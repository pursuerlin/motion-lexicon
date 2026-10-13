/* Two shared studies, rendered at their actual viewport size. No preview scaling. */
(function () {
 'use strict';
 const M=window.MOTION,E=window.ENGINE,oldHTML=M.htmlFor,oldMount=M.KINDS.compound;
 const TAU=Math.PI*2,STEP=TAU/8;
 const pictures=['p16.jpg','city-2.jpg','city-3.jpg','snow-3.jpg','abs-1.jpg','gal-2.jpg','p03.jpg','p05.jpg'];
 const names=['灯河','街角','都市','雪岭','纹理','回廊','暮色','掠影'];
 const enNames=['River lights','Street corner','City','Snow ridge','Texture','Arcade','Dusk','Passing light'];
 const en=()=>document.documentElement.dataset.lang==='en';
 const copy=(zh,english)=>en()?english:zh;
 const reduced=()=>!E.motionOn()||matchMedia('(prefers-reduced-motion: reduce)').matches;
 const rgb=s=>{const n=s.match(/[\d.]+/g);return n&&n.length>=3?n.slice(0,3).map(Number).map(x=>x/255):[.8,.7,.6];};
 window.TERMS.forEach(t=>{if(!['glow','helix'].includes(t.demo?.mode))return;t.demo.ctl=[];
  if(t.demo.mode==='glow'){t.alias=['追光','鼠标打光','陶瓷光照'];t.def='光照在三枚交错的陶瓷环上流转。移动指针同时改变主光源与观察角度，表面的高光、明暗分界和地面落影持续响应；离开后光源回到中央。';t.vague='光跟着鼠标走，物体上的高光也跟着变化';t.demo.hint='移动指针 · 探索光照';t.say='指针位置同时驱动三维光照方向与相机的小幅转角，真实法线计算漫反射和镜面高光，保持输入与画面连续';}
  else{t.en='Draggable helix gallery';t.def='八幅摄影沿螺旋轨道展开，前后卡片由真实空间位置形成遮挡与透视。按住左右拖动旋转整组画面，松手后带着惯性停在相邻卡位；也可以用前后按钮或方向键逐张浏览。';t.say='摄影卡片按螺旋角度计算三维坐标，拖动位移驱动相位，释放速度决定惯性距离，吸附到相邻卡位并更新当前读数';}
 });
 M.htmlFor=function(s){if(s.kind!=='compound'||!['glow','helix'].includes(s.mode))return oldHTML(s);
  return '<div class="atelier-study" data-study="'+s.mode+'"><div class="atelier-view" tabindex="0" role="group"><div class="atelier-title"><small></small><strong></strong></div>'+
   (s.mode==='glow'?'<canvas class="atelier-glow" aria-hidden="true"></canvas><div class="atelier-light" aria-hidden="true"></div>':'<div class="atelier-helix">'+pictures.map((p,i)=>'<figure class="atelier-photo" data-photo="'+i+'"><img src="assets/img/'+p+'" alt="" draggable="false"><figcaption></figcaption></figure>').join('')+'</div>')+
   '</div><div class="atelier-controls"><span class="atelier-cue"></span>'+(s.mode==='helix'?'<button type="button" data-step="-1">←</button><output>01 / 08</output><button type="button" data-step="1">→</button>':'<button type="button" data-reset>↺</button>')+'</div></div>';
 };
 const vertex='attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';
 // Ray-marched ceramic rings: light, camera, contact shadow and specular all share one geometry.
 const fragment=`precision highp float;
 uniform vec2 res,mouse; uniform vec3 base,top,accent; uniform float dark;
 mat3 ry(float a){float c=cos(a),s=sin(a);return mat3(c,0.,s,0.,1.,0.,-s,0.,c);}
 mat3 rx(float a){float c=cos(a),s=sin(a);return mat3(1.,0.,0.,0.,c,-s,0.,s,c);}
 float tor(vec3 p){return length(vec2(length(p.xz)-.79,p.y))-.195;}
 vec2 shape(vec3 p){p.y-=.23;float a=tor(rx(.62)*p),b=tor(rx(1.89)*ry(1.12)*p),c=tor(rx(-.57)*ry(-1.06)*p);float d=min(a,min(b,c));return vec2(d,a<b&&a<c?0.:b<c?1.:2.);}
 vec3 normal(vec3 p){vec2 e=vec2(.001,0.);return normalize(vec3(shape(p+e.xyy).x-shape(p-e.xyy).x,shape(p+e.yxy).x-shape(p-e.yxy).x,shape(p+e.yyx).x-shape(p-e.yyx).x));}
 float shadow(vec3 p,vec3 l){float v=1.,t=.03;for(int i=0;i<22;i++){float h=shape(p+l*t).x;v=min(v,12.*h/t);t+=clamp(h,.025,.15);if(t>3.)break;}return clamp(v,.18,1.);}
 void main(){vec2 uv=(gl_FragCoord.xy-.5*res)/min(res.x,res.y);vec3 ro=ry((mouse.x-.5)*.23)*vec3(0.,.65,4.6);vec3 target=vec3(0.,.15,0.);vec3 ww=normalize(target-ro),uu=normalize(cross(ww,vec3(0.,1.,0.))),vv=cross(uu,ww);vec3 rd=normalize(uv.x*uu+uv.y*vv+1.65*ww);vec3 bg=mix(base,top,clamp(gl_FragCoord.y/res.y,0.,1.));vec3 light=normalize(vec3((mouse.x-.5)*4.,1.3+(1.-mouse.y)*2.,2.8));float t=0.;vec2 hit;bool found=false;
 for(int i=0;i<64;i++){hit=shape(ro+rd*t);if(hit.x<.0015){found=true;break;}t+=hit.x*.86;if(t>8.)break;}
 vec3 col=bg;
 float floorT=(-1.04-ro.y)/rd.y;if(rd.y<-.001&&floorT>0.){vec3 fp=ro+rd*floorT;float contact=exp(-dot(fp.xz,fp.xz)*1.1)*.21;col=bg*(1.-contact*(.6+.4*(1.-shadow(fp+vec3(0.,.01,0.),light))));}
 if(found){vec3 p=ro+rd*t,n=normal(p);float diff=max(0.,dot(n,light)),spec=pow(max(0.,dot(n,normalize(light-rd))),58.);float ao=clamp(shape(p+n*.14).x/.14,.3,1.);vec3 mat=hit.y<.5?mix(vec3(.9,.85,.76),accent,.28):hit.y<1.5?mix(vec3(.76,.83,.77),accent,.16):mix(vec3(.93,.89,.8),accent,.55);float rim=pow(1.-max(dot(n,-rd),0.),3.);col=mat*(.28+.74*diff*shadow(p+n*.01,light))*(.72+.28*ao)+vec3(1.,.96,.84)*spec*.76+top*rim*.13;col=mix(col,col*.82,dark*.15);}
 col+=vec3(.002)*sin(gl_FragCoord.x*1.7+gl_FragCoord.y*2.3);gl_FragColor=vec4(col,1.);}`;
 function renderer(canvas){const gl=canvas.getContext('webgl',{antialias:true,alpha:false,powerPreference:'low-power'});if(!gl)return null;
  const shaders=[];function shader(type,src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){console.warn('Atelier shader:',gl.getShaderInfoLog(s));gl.deleteShader(s);return null;}shaders.push(s);return s;}
  const vs=shader(gl.VERTEX_SHADER,vertex),fs=shader(gl.FRAGMENT_SHADER,fragment);if(!vs||!fs)return null;
  const p=gl.createProgram();gl.attachShader(p,vs);gl.attachShader(p,fs);gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))return null;gl.useProgram(p);
  const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);const a=gl.getAttribLocation(p,'a');gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,2,gl.FLOAT,false,0,0);
  const u=Object.fromEntries(['res','mouse','base','top','accent','dark'].map(k=>[k,gl.getUniformLocation(p,k)]));
  return {draw(x,y,colors){gl.viewport(0,0,canvas.width,canvas.height);gl.uniform2f(u.res,canvas.width,canvas.height);gl.uniform2f(u.mouse,x,y);['base','top','accent'].forEach(k=>gl.uniform3fv(u[k],colors[k]));gl.uniform1f(u.dark,colors.dark);gl.drawArrays(gl.TRIANGLES,0,6);},destroy(){gl.deleteBuffer(buffer);shaders.forEach(s=>gl.deleteShader(s));gl.deleteProgram(p);gl.getExtension('WEBGL_lose_context')?.loseContext();}};
 }
 M.KINDS.compound=function(stage,s){if(!['glow','helix'].includes(s.mode))return oldMount(stage,s);
  const root=stage.querySelector('.atelier-study'),view=root.querySelector('.atelier-view'),canvas=root.querySelector('canvas'),photos=[...root.querySelectorAll('.atelier-photo')],abort=new AbortController();
  const on=(el,event,fn,opts={})=>el.addEventListener(event,fn,{...opts,signal:abort.signal});
  const gl=canvas&&renderer(canvas);if(canvas&&!gl)root.dataset.fallback='true';
  let x=.5,y=.5,tx=.5,ty=.5,angle=0,target=0,velocity=0,drag=null,last=performance.now(),active=false,dead=false,colors,dirty=true;
  function theme(){const probe=document.createElement('i');view.appendChild(probe);const get=(variable)=>{probe.style.color='var('+variable+')';return rgb(getComputedStyle(probe).color);};colors={base:get('--studio-base'),top:get('--studio-top'),accent:get('--accent'),dark:['ember','graphite'].includes(document.documentElement.dataset.theme)?1:0};probe.remove();dirty=true;render();}
  function language(){root.querySelector('small').textContent=copy(s.mode==='glow'?'光与材质':'八幅风景 · 一条螺旋',s.mode==='glow'?'LIGHT & MATERIAL':'EIGHT MOMENTS / ONE HELIX');root.querySelector('strong').textContent=copy(s.mode==='glow'?'让光，随你流转。':'把风景，转到眼前。',s.mode==='glow'?'Light follows your lead.':'Bring a moment into view.');root.querySelector('.atelier-cue').textContent=copy(s.mode==='glow'?'移动指针 · 改变光照':'左右拖动 · 松手停靠',s.mode==='glow'?'Move to shape the light':'Drag to turn · release to settle');view.setAttribute('aria-label',copy(s.mode==='glow'?'移动指针或使用方向键改变光照':'左右拖动或使用方向键浏览摄影',s.mode==='glow'?'Move or use arrow keys to change the light':'Drag or use arrow keys to browse photographs'));photos.forEach((p,i)=>p.querySelector('figcaption').textContent=String(i+1).padStart(2,'0')+' / '+(en()?enNames:names)[i]);root.querySelectorAll('[data-step]').forEach(b=>b.setAttribute('aria-label',copy(+b.dataset.step<0?'上一幅':'下一幅',+b.dataset.step<0?'Previous photo':'Next photo')));root.querySelector('[data-reset]')?.setAttribute('aria-label',copy('重置光照','Reset light'));dirty=true;render();}
  function render(){if(dead)return;if(gl)gl.draw(x,y,colors||{base:[.9,.88,.82],top:[.97,.96,.92],accent:[.7,.4,.2],dark:0});
   const w=view.clientWidth,h=view.clientHeight,idx=((Math.round(-angle/STEP)%8)+8)%8;
   photos.forEach((p,i)=>{const a=i*STEP+angle,z=Math.cos(a),px=Math.sin(a)*w*.32,py=Math.sin(a)*h*.10;const scale=.58+(z+1)*.21;p.style.transform='translate3d('+px+'px,'+py+'px,'+(z*65)+'px) rotateY('+(-Math.sin(a)*27)+'deg) rotateZ('+(-Math.sin(a)*8)+'deg) scale('+scale+')';p.style.zIndex=String(Math.round((z+1)*100));p.style.opacity=String(.38+(z+1)*.31);p.dataset.current=String(i===idx);});
   root.dataset.angle=angle.toFixed(4);root.dataset.current=String(idx);root.dataset.light=x.toFixed(3)+','+y.toFixed(3);if(photos.length)root.querySelector('output').textContent=String(idx+1).padStart(2,'0')+' / 08';dirty=false;
  }
  function size(){if(canvas){const dpr=Math.min(2,Math.max(1.5,devicePixelRatio||1)),w=view.clientWidth,h=view.clientHeight,k=Math.min(dpr,1800/Math.max(w,h));canvas.width=Math.max(1,Math.round(w*k));canvas.height=Math.max(1,Math.round(h*k));}dirty=true;render();}
  function point(e){const r=view.getBoundingClientRect();tx=Math.max(0,Math.min(1,(e.clientX-r.left)/r.width));ty=Math.max(0,Math.min(1,(e.clientY-r.top)/r.height));dirty=true;if(reduced()){x=tx;y=ty;render();}}
  on(view,'pointerdown',e=>{if(e.button!==0||drag)return;view.focus({preventScroll:true});view.setPointerCapture(e.pointerId);drag={id:e.pointerId,start:angle,x:e.clientX,time:performance.now(),lastX:e.clientX,moved:false};target=angle;velocity=0;point(e);});
  on(view,'pointermove',e=>{if(drag&&drag.id!==e.pointerId)return;if(s.mode==='glow'){point(e);return;}if(!drag)return;const now=performance.now(),dt=Math.max(.008,(now-drag.time)/1000),k=TAU/view.clientWidth;angle=target=drag.start+(e.clientX-drag.x)*k;velocity=Math.max(-9,Math.min(9,(e.clientX-drag.lastX)*k/dt));drag.moved ||=Math.abs(e.clientX-drag.x)>4;drag.lastX=e.clientX;drag.time=now;dirty=true;render();});
  function end(e,cancel){if(!drag||drag.id!==e.pointerId)return;const d=drag;drag=null;const stale=performance.now()-d.time>100;target=Math.round((angle+(cancel||reduced()||stale?0:velocity*.15))/STEP)*STEP;velocity=0;if(reduced())angle=target;dirty=true;render();}
  on(view,'pointerup',e=>end(e,false));on(view,'pointercancel',e=>end(e,true));on(view,'lostpointercapture',e=>end(e,true));on(view,'pointerleave',()=>{if(!drag&&s.mode==='glow'){tx=ty=.5;dirty=true;if(reduced()){x=tx;y=ty;render();}}});
  const step=n=>{target-=n*STEP;if(reduced())angle=target;dirty=true;render();};
  root.querySelectorAll('[data-step]').forEach(b=>on(b,'click',()=>step(+b.dataset.step)));
  on(view,'keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home'].includes(e.key))return;e.preventDefault();e.stopPropagation();if(s.mode==='helix'){if(e.key==='Home'){target=0;if(reduced())angle=0;dirty=true;}else step(e.key==='ArrowRight'?1:-1);}else{if(e.key==='Home')tx=ty=.5;else if(e.key==='ArrowLeft')tx=Math.max(0,tx-.12);else if(e.key==='ArrowRight')tx=Math.min(1,tx+.12);else if(e.key==='ArrowUp')ty=Math.max(0,ty-.12);else ty=Math.min(1,ty+.12);dirty=true;if(reduced()){x=tx;y=ty;}}render();});
  const reset=()=>{tx=ty=.5;target=0;if(reduced()){x=tx;y=ty;angle=0;}dirty=true;render();};root.querySelector('[data-reset]')&&on(root.querySelector('[data-reset]'),'click',reset);
  const ro=new ResizeObserver(size);ro.observe(view);const mo=new MutationObserver(()=>{theme();language();});mo.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme','data-lang']});
  stage._update=now=>{const dt=Math.min(.04,Math.max(0,(now-last)/1000));last=now;if(!active||!stage.isConnected)return;const a=1-Math.exp(-dt*12);if(!drag)angle+=(target-angle)*a;x+=(tx-x)*a;y+=(ty-y)*a;if(dirty||Math.abs(angle-target)>.0001||Math.abs(x-tx)+Math.abs(y-ty)>.0001)render();};E.tickers.add(stage._update);
  stage._setActive=()=>{active=stage.isConnected&&E.isVisible(stage)&&!document.hidden;last=performance.now();if(active)render();};stage._onMotion=()=>{x=tx;y=ty;angle=target;dirty=true;render();};stage._replay=reset;
  stage._dispose=()=>{if(dead)return;dead=true;abort.abort();mo.disconnect();ro.disconnect();E.tickers.delete(stage._update);gl?.destroy();};on(document,'visibilitychange',stage._setActive);
  theme();language();size();stage._setActive();
 };
})();
