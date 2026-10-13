/* Adapted from the user-provided page-flip/翻书.html. Original WebGL paper mesh, spring physics and shadow pass retained. */
window.PAGE_BOOK={async create(bookHost,options={},controller=new AbortController()){

// Native WebGL paper simulation. Album textures load only when a book is mounted.
const ARTWORK = [{"name": "HER · The shape of becoming.", "pages": ["assets/page-book/her-00-0.jpg"]}, {"name": "Beyond the veil.", "pages": ["assets/page-book/her-01-0.jpg", "assets/page-book/her-01-1.jpg"]}, {"name": "Where light lingers.", "pages": ["assets/page-book/her-02-0.jpg", "assets/page-book/her-02-1.jpg"]}, {"name": "Liquid bloom.", "pages": ["assets/page-book/her-03-0.jpg", "assets/page-book/her-03-1.jpg"]}, {"name": "Meeting myself.", "pages": ["assets/page-book/her-04-0.jpg", "assets/page-book/her-04-1.jpg"]}, {"name": "A line of my own.", "pages": ["assets/page-book/her-05-0.jpg", "assets/page-book/her-05-1.jpg"]}, {"name": "A step beyond.", "pages": ["assets/page-book/her-06-0.jpg", "assets/page-book/her-06-1.jpg"]}, {"name": "I let go.", "pages": ["assets/page-book/her-07-0.jpg", "assets/page-book/her-07-1.jpg"]}, {"name": "One touch. A widening circle.", "pages": ["assets/page-book/her-08-0.jpg", "assets/page-book/her-08-1.jpg"]}, {"name": "Back to the world.", "pages": ["assets/page-book/her-09-0.jpg", "assets/page-book/her-09-1.jpg"]}, {"name": "Still becoming.", "pages": ["assets/page-book/her-10-0.jpg"]}];
const embeddedHost=bookHost;
const signal=controller.signal;
let disposed=false,motionEnabled=options.motion!==false,resizeObserver;
const $ = s => embeddedHost?embeddedHost.querySelector(s.replace(/#([\w-]+)/g,'[data-book-$1]')):document.querySelector(s);
const canvas = $('#book');
const gl = canvas.getContext('webgl', {alpha:false,antialias:true});
signal.addEventListener('abort',()=>{disposed=true;resizeObserver?.disconnect();if(frame)cancelAnimationFrame(frame);gl?.getExtension('WEBGL_lose_context')?.loseContext();},{once:true});
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const H=1.25, COLS=64, ROWS=18, STRIDE=8, SHADOW_EXTENT=1.85;
let spreads=[],leaves=[],index=0,target=0,edition='original';
let ready=false,drag=null,pointer=null,frame=0,lastTime=0;
let playSpeed=1;
let frozen=false,active=false,clockTime=0,wheelTotal=0,hover=0,hoverTarget=0,hoverY=.7,hoverSide=1;
let hostActive=true;
let view={width:0,height:0,dpr:1,worldHeight:1.62},busy=false,history=[];
let resizeDirty=true,floorColor=[1,1,1];
let program,loc,indexBuffer,indices,flatRight,flatLeft,white,shadowFBO,shadowTexture,shadowSize;
const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
const fract=n=>n-Math.floor(n);
const noise=n=>fract(Math.sin(n*12.9898+78.233)*43758.5453);
const smooth=t=>t*t*(3-2*t);
const VERTEX=`precision highp float;
attribute vec3 position;attribute vec2 uv;attribute vec3 normal;
uniform vec2 viewport;uniform float worldHeight;uniform float center;uniform float mode;
uniform vec3 offset;uniform vec3 scale;
varying vec2 vUV;varying vec3 vNormal;varying vec3 vWorld;
void main(){vec3 p=position*scale+offset;vUV=uv;vNormal=normal;vWorld=p;
 if(mode>0.5&&mode<1.5){gl_Position=vec4((p.x+p.z*.42)/1.85,(p.y-p.z*.065)/1.85,-p.z*.65,1.0);}
 else{float w=1.0-p.z*.105;gl_Position=vec4((p.x+center)*2.0/(worldHeight*viewport.x/viewport.y),p.y*2.0/worldHeight-p.z*.018,-p.z*.3,w);}}
`;
const FRAGMENT=`precision highp float;
uniform sampler2D front;uniform sampler2D back;uniform sampler2D shadowMap;
uniform vec3 floorColor;
uniform float mode;uniform float gloss;uniform float shadowEnabled;
varying vec2 vUV;varying vec3 vNormal;varying vec3 vWorld;
float testShadow(vec2 q,float depth){
 // Compare each tap against the local tangent plane, rather than a constant
 // depth: otherwise a curved page incorrectly casts stripes onto itself.
 vec2 origin=vec2(vWorld.x+vWorld.z*.42,vWorld.y-vWorld.z*.065)/3.7+.5;
 vec3 n=normalize(vNormal);
 float plane=n.z-.42*n.x+.065*n.y;
 plane=(plane<0.0?-1.0:1.0)*max(.22,abs(plane));
 float correction=clamp(-3.7*dot(n.xy,q-origin)/(1.5*plane),-.15,.15);
 return step(depth+correction,texture2D(shadowMap,q).r);
}
float shadowAmount(vec3 n){
 if(shadowEnabled<.5)return 0.0;
 vec2 q=vec2(vWorld.x+vWorld.z*.42,vWorld.y-vWorld.z*.065)/3.7+.5;
 if(q.x<0.0||q.y<0.0||q.x>1.0||q.y>1.0)return 0.0;
 float here=(vWorld.z+.08)/1.5;
 // Search nearby blockers too, so penumbrae stay soft at silhouette edges.
 float blocker=texture2D(shadowMap,q).r;
 blocker=max(blocker,texture2D(shadowMap,q+vec2(.007,0.0)).r);
 blocker=max(blocker,texture2D(shadowMap,q-vec2(.007,0.0)).r);
 blocker=max(blocker,texture2D(shadowMap,q+vec2(0.0,.007)).r);
 blocker=max(blocker,texture2D(shadowMap,q-vec2(0.0,.007)).r);
 float gap=max(0.0,blocker-here);
 vec3 lightDirection=normalize(vec3(-.42,.065,1.0));
 float slope=1.0/max(.22,abs(dot(n,lightDirection)))-1.0;
 float bias=.006+.003*slope;
 float d=here+bias;
 float radius=.0018+min(.018,gap*.055);
 float s=testShadow(q,d);
 s+=testShadow(q+vec2(-.942,-.399)*radius,d);
 s+=testShadow(q+vec2(.946,-.769)*radius,d);
 s+=testShadow(q+vec2(-.094,-.929)*radius,d);
 s+=testShadow(q+vec2(.345,.294)*radius,d);
 s+=testShadow(q+vec2(-.916,.458)*radius,d);
 s+=testShadow(q+vec2(-.815,-.879)*radius,d);
 s+=testShadow(q+vec2(-.382,.276)*radius,d);
 s+=testShadow(q+vec2(.975,.756)*radius,d);
 s+=testShadow(q+vec2(.443,-.975)*radius,d);
 s+=testShadow(q+vec2(.538,-.474)*radius,d);
 s+=testShadow(q+vec2(-.265,-.418)*radius,d);
 return s/12.0*(1.0-.24*smoothstep(.08,.65,gap));
}
void main(){
 if(mode>.5&&mode<1.5){gl_FragColor=vec4(clamp((vWorld.z+.08)/1.5,0.0,1.0),0.0,0.0,1.0);return;}
 vec3 n=normalize(vNormal)*(gl_FrontFacing?1.0:-1.0);
 float shadow=shadowAmount(n);
 if(mode>1.5){gl_FragColor=vec4(floorColor*(1.0-shadow*.16),1.0);return;}
 vec2 q=gl_FrontFacing?vUV:vec2(1.0-vUV.x,vUV.y);
 vec3 color=gl_FrontFacing?texture2D(front,q).rgb:texture2D(back,q).rgb;
 vec3 light=normalize(vec3(-.42,.065,1.0));
 float diffuse=max(0.0,dot(n,light));
 float shade=.60+.43*diffuse*(1.0-shadow*.88);
 float crease=1.0-.11*exp(-vUV.x*38.0);
 vec3 halfway=normalize(light+vec3(0.0,0.0,1.0));
 float highlight=pow(max(0.0,dot(n,halfway)),42.0)*gloss;
 vec3 sheen=vec3(1.0,.975,1.0)*highlight*(1.0-shadow*.6);
 color=color*shade*crease+sheen;
 gl_FragColor=vec4(color,1.0);
}`;
function shader(type,source){if(!gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER,gl.HIGH_FLOAT).precision)source=source.replace('precision highp float;','precision mediump float;');const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
function bindMesh(mesh){gl.bindBuffer(gl.ARRAY_BUFFER,mesh.buffer);for(const [name,size,offset] of [['position',3,0],['uv',2,12],['normal',3,20]]){gl.vertexAttribPointer(loc[name],size,gl.FLOAT,false,STRIDE*4,offset);}}
function newMesh(){return {buffer:gl.createBuffer(),data:new Float32Array((COLS+1)*(ROWS+1)*STRIDE)};}
function initGL(){
 program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,VERTEX));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,FRAGMENT));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.useProgram(program);loc={};
 for(const name of ['viewport','worldHeight','center','mode','offset','scale','front','back','gloss','shadowEnabled','shadowMap','floorColor'])loc[name]=gl.getUniformLocation(program,name);
 for(const name of ['position','uv','normal']){loc[name]=gl.getAttribLocation(program,name);gl.enableVertexAttribArray(loc[name]);}
 const list=[];for(let i=0;i<COLS;i++)for(let j=0;j<ROWS;j++){let a=i*(ROWS+1)+j,b=a+ROWS+1;list.push(a,a+1,b,b,a+1,b+1);}indices=new Uint16Array(list);indexBuffer=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,indexBuffer);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,indices,gl.STATIC_DRAW);
 gl.uniform1i(loc.front,0);gl.uniform1i(loc.back,1);gl.uniform1i(loc.shadowMap,2);gl.uniform1f(loc.shadowEnabled,1);gl.uniform3f(loc.scale,1,1,1);gl.uniform3f(loc.offset,0,0,0);
 gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);
 white=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,white);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([245,242,246,255]));textureParams();
 flatRight=newMesh();flatLeft=newMesh();deform(flatRight,0,0,{seed:0,curl:0,twist:0,grab:.5},0,0);deform(flatLeft,1,0,{seed:0,curl:0,twist:0,grab:.5},0,0);
 shadowSize=Math.min(2048,gl.getParameter(gl.MAX_TEXTURE_SIZE));shadowTexture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,shadowTexture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,shadowSize,shadowSize,0,gl.RGBA,gl.UNSIGNED_BYTE,null);textureParams(gl.NEAREST);
 shadowFBO=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,shadowFBO);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,shadowTexture,0);
 const depth=gl.createRenderbuffer();gl.bindRenderbuffer(gl.RENDERBUFFER,depth);gl.renderbufferStorage(gl.RENDERBUFFER,gl.DEPTH_COMPONENT16,shadowSize,shadowSize);gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.RENDERBUFFER,depth);
 if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw Error('Shadow framebuffer unavailable');gl.bindFramebuffer(gl.FRAMEBUFFER,null);
}
function textureParams(filter=gl.LINEAR){gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,filter);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,filter);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);}
function loadImage(src){return new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=reject;image.src=src;});}
function makeTexture(image){
 const max=Math.min(4096,gl.getParameter(gl.MAX_TEXTURE_SIZE)),width=image.naturalWidth||image.width,height=image.naturalHeight||image.height;
 if(Math.max(width,height)>max){const c=document.createElement('canvas'),r=max/Math.max(width,height);c.width=Math.round(width*r);c.height=Math.round(height*r);c.getContext('2d').drawImage(image,0,0,c.width,c.height);image=c;}
 const t=gl.createTexture();gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,t);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);textureParams();return t;
}
async function loadOriginal(){const pages=await Promise.all(ARTWORK.map(a=>Promise.all(a.pages.map(loadImage))));if(signal.aborted)throw new DOMException('Aborted','AbortError');return [{name:'Cover',left:null,right:makeTexture(pages[0][0]),thumb:ARTWORK[0].pages[0]},...pages.slice(1,-1).map((images,i)=>({name:ARTWORK[i+1].name,left:makeTexture(images[0]),right:makeTexture(images[1]),thumb:ARTWORK[i+1].pages[0]})),{name:'Still becoming.',left:makeTexture(pages.at(-1)[0]),right:null,thumb:ARTWORK.at(-1).pages[0]}];}
function profile(s,grab=.5,speed=0,direction=1){let n=noise(s+2);return {seed:n,grab,direction,curl:(s===0||s===leaves.length-1?.65:1.05+n*.95)+Math.min(.4,speed*.028),twist:(.16+n*.16)+(grab-.5)*1.3,flutter:noise(s+17)*.025};}
function heldShape(l,goal,grab,speed,direction){
 let fold=drag.shapes.get(l.s);
 if(!fold){
  const base=l.p>.001&&l.p<.999?{...l.shape}:profile(l.s,grab,speed,direction);
  fold={base,from:base.direction,direction,anchor:l.p};drag.shapes.set(l.s,fold);
 }
 if(direction!==fold.direction){
  fold.from=l.shape.direction;fold.direction=direction;fold.anchor=l.p;
 }
 // Change the bend by distance, never by a delayed timer. A new reversal
 // starts at the current surface; small changes cannot snap its polarity.
 // Strong corner twists need a longer stroke so their curl cannot counter
 // the directly controlled turn angle at the outer edge.
 const span=.32+Math.abs(fold.base.grab-.5)*.45;
 const t=smooth(clamp((goal-fold.anchor)*direction/span));
 return {...fold.base,direction:fold.from+(direction-fold.from)*t};
}
// Arc-length integration preserves the width of each row. The row-dependent
// curl and grabbed corner produce different folds; normals come from the mesh.
function deform(mesh,p,velocity,shape,hoverLift,time){
 const data=mesh.data,pulse=Math.sin(Math.PI*clamp(p)),seed=shape.seed;
 for(let j=0;j<=ROWS;j++){
  const v=j/ROWS;let x=0,z=0;
  // A complete backward turn mirrors the forward fold across the spine.
  // Direction blends on interruption, preserving the existing surface.
  const theta=u=>Math.PI*p+pulse*(shape.direction??1)*(shape.curl*(.36-u)+shape.twist*(v-shape.grab)*Math.pow(u,1.35)+.085*Math.sin(Math.PI*u*1.5+seed*6)*(v-.5))+hoverLift*(p<.5?1:-1)*.19*u*u;
  for(let i=0;i<=COLS;i++){
   const u=i/COLS,k=(i*(ROWS+1)+j)*STRIDE;
   if(i){let a=theta(u-.5/COLS);x+=Math.cos(a)/COLS;z+=Math.sin(a)/COLS;}
   const corner=pulse*.07*Math.pow(u,1.7)*(v-.5)*(shape.grab-.5);
   const flutter=Math.min(.018,Math.abs(velocity)*.009)*u*u*(.55+.45*Math.sin(time*.018+seed*9+v*3));
   data[k]=x;data[k+1]=(.5-v)*H+pulse*.025*u*u*(v-shape.grab);data[k+2]=z+corner+flutter;data[k+3]=u;data[k+4]=v;
  }
 }
 for(let i=0;i<=COLS;i++)for(let j=0;j<=ROWS;j++){
  const k=(i*(ROWS+1)+j)*STRIDE,a=(Math.max(0,i-1)*(ROWS+1)+j)*STRIDE,b=(Math.min(COLS,i+1)*(ROWS+1)+j)*STRIDE,c=(i*(ROWS+1)+Math.max(0,j-1))*STRIDE,d=(i*(ROWS+1)+Math.min(ROWS,j+1))*STRIDE;
  const ux=data[b]-data[a],uy=data[b+1]-data[a+1],uz=data[b+2]-data[a+2],vx=data[d]-data[c],vy=data[d+1]-data[c+1],vz=data[d+2]-data[c+2];
  let nx=vy*uz-vz*uy,ny=vz*ux-vx*uz,nz=vx*uy-vy*ux,len=Math.hypot(nx,ny,nz)||1;data[k+5]=nx/len;data[k+6]=ny/len;data[k+7]=nz/len;
 }
 gl.bindBuffer(gl.ARRAY_BUFFER,mesh.buffer);gl.bufferData(gl.ARRAY_BUFFER,data,gl.DYNAMIC_DRAW);
}
function rebuildLeaves(at=0){
 for(const leaf of leaves)gl.deleteBuffer(leaf.mesh.buffer);
 leaves=Array.from({length:spreads.length-1},(_,s)=>({s,p:s<at?1:0,v:0,goal:s<at?1:0,due:0,shape:null,mesh:newMesh(),changed:true}));
 leaves.forEach(l=>{l.shape=profile(l.s,.5,0,l.p<.5?1:-1);l.shapeTarget={...l.shape};});index=target=at;active=false;frozen=false;drag=pointer=null;hover=hoverTarget=0;wheelTotal=0;lastTime=performance.now();updateUI();requestRender();
}
function position(){return leaves.reduce((q,l)=>q+l.p,0);}
function isMoving(){return leaves.some(l=>Math.abs(l.p-l.goal)>.0015||Math.abs(l.v)>.015);}
function updateUI(){
 canvas.dataset.page=String(Math.round(target));
 canvas.dataset.turning=String(isMoving());
 canvas.dataset.active=String(hostActive);
 const last=spreads.length-1,n=clamp(Math.round(target),0,last);
 $('#status').textContent=n===0?(options.en?'Cover':'封面'):n===last?(options.en?'Back cover · Still becoming.':'封底 · Still becoming.'):(options.en?`Spread ${n} of ${last-1}`:`第 ${n} 组内页，共 ${last-1} 组`);

}
function setTarget(to,{direct=false,grab=.5,speed=0}={}){
 if(!ready||busy)return;
 const next=clamp(direct?to:Math.round(to),0,leaves.length),now=performance.now(),q=position(),dir=Math.sign(next-q);
 if((reduced.matches||!motionEnabled)&&!direct){leaves.forEach(l=>{l.p=l.goal=l.s<next?1:0;l.v=0;l.changed=true;});target=index=next;active=false;frozen=false;updateUI();requestRender();return;}
 frozen=false;target=next;
 leaves.forEach(l=>{
  const goal=clamp(next-l.s);
  if(Math.abs(goal-l.goal)>.0001){
   const wasMoving=Math.abs(l.v)>.04;
   l.goal=goal;l.due=direct||wasMoving?now:now+Math.max(0,dir>0?l.s-Math.floor(q):Math.ceil(q)-1-l.s)*62;
   const foldDirection=Math.sign(goal-l.p)||dir||l.shape.direction;
   if(direct&&drag){
    l.shapeTarget=heldShape(l,goal,grab,speed,foldDirection);
    l.shape={...l.shapeTarget};
   }else l.shapeTarget=profile(l.s,grab,speed,foldDirection);
   // Flat pages have no visible crease yet, so adopt the correct handedness
   // immediately. Airborne pages relax continuously into the new fold.
   if(l.p<.001||l.p>.999)l.shape={...l.shapeTarget};
   l.changed=true;
  }
  // Match the original embedded book: held paper tracks input immediately.
  // The original spring takes over only after release.
  if(direct){l.p=l.goal=goal;l.v=0;l.due=now;l.changed=true;}
 });
 history.push({at:now,target:next,source:direct?'drag':'turn'});if(history.length>80)history.shift();
 active=isMoving();if(!frame)lastTime=now;updateUI();requestRender();
}
function step(n,options={}){setTarget(Math.round(target)+n,options);}
function tickPhysics(now){
 let dt=clamp((now-lastTime)/1000,0,.085)*playSpeed;lastTime=now;clockTime=now;
 if(frozen)return;
 const oldHover=hover;hover+=(hoverTarget-hover)*(1-Math.exp(-dt*16));
 if(Math.abs(hover-hoverTarget)<.0005)hover=hoverTarget;
 for(const l of leaves){
  if(now<l.due)continue;
  for(const key of ['grab','curl','twist','direction']){
   const delta=l.shapeTarget[key]-l.shape[key];
   if(Math.abs(delta)>.0001){l.shape[key]+=delta*(1-Math.exp(-dt*11));l.changed=true;}
  }
  if(drag)continue;
  const oldP=l.p,oldV=l.v,k=drag?245:((l.s===0||l.s===leaves.length-1)?165:125+l.shape.seed*34),damping=2*Math.sqrt(k)*(drag?.92:.70+l.shape.seed*.15);
  const steps=Math.max(1,Math.ceil(dt/.008)),h=dt/steps;
  for(let n=0;n<steps;n++){l.v+=((l.goal-l.p)*k-l.v*damping)*h;l.p+=l.v*h;if(l.p<0){l.p=0;l.v*=.22;}if(l.p>1){l.p=1;l.v*=.22;}}
  if(Math.abs(l.p-l.goal)<.0008&&Math.abs(l.v)<.015){l.p=l.goal;l.v=0;}
  if(Math.abs(oldP-l.p)>.000001||Math.abs(oldV-l.v)>.0001)l.changed=true;
 }
 if(oldHover!==hover){const right=leaves.find(l=>l.p<.001),left=leaves.findLast(l=>l.p>.999);if(right)right.changed=true;if(left)left.changed=true;}
 const moving=isMoving();if(active&&!moving&&!drag){index=Math.round(target);updateUI();}active=moving;
}
function visibleLeaves(){
 const visible=[];let right=null,left=null;
 for(const l of leaves){if(l.p<=.0001&&Math.abs(l.v)<.01){if(right===null)right=l;}else if(l.p>=.9999&&Math.abs(l.v)<.01){left=l;}else visible.push(l);}
 if(right)visible.push(right);if(left)visible.push(left);
 return visible.sort((a,b)=>a.s-b.s);
}
function leafHeight(l){return ((1-l.p)*(leaves.length-l.s)+l.p*(l.s+1))*.0024+.002;}
function drawMesh(mesh,front,back,offset=[0,0,0],scale=[1,1,1],gloss=.032){
 bindMesh(mesh);gl.uniform3fv(loc.offset,offset);gl.uniform3fv(loc.scale,scale);gl.uniform1f(loc.gloss,gloss);
 gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,front||white);gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,back||white);
 gl.drawElements(gl.TRIANGLES,indices.length,gl.UNSIGNED_SHORT,0);
}
function drawLeaf(l){drawMesh(l.mesh,spreads[l.s].right,spreads[l.s+1].left,[0,0,leafHeight(l)],[1,1,1],l.s===0||l.s===leaves.length-1?.055:.025);}
function render(now){
 frame=0;if(disposed||!ready||!bookHost.isConnected||document.hidden||!hostActive)return;if(resizeDirty)resize();tickPhysics(now);
 const visible=visibleLeaves(),hoverLeaf=hoverSide>0?leaves.find(l=>l.p<=.0001):leaves.findLast(l=>l.p>=.9999);
 for(const l of visible){if(l.changed||Math.abs(l.v)>.015){deform(l.mesh,l.p,l.v,l.shape,l===hoverLeaf?hover:0,now);l.changed=false;}}
 // Directional shadow pass: the same paper meshes occlude one another and the floor.
 gl.activeTexture(gl.TEXTURE2);gl.bindTexture(gl.TEXTURE_2D,null);gl.bindFramebuffer(gl.FRAMEBUFFER,shadowFBO);gl.viewport(0,0,shadowSize,shadowSize);gl.clearColor(0,0,0,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.uniform1f(loc.mode,1);for(const l of visible)drawLeaf(l);
 gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.viewport(0,0,canvas.width,canvas.height);gl.uniform3fv(loc.floorColor,floorColor);gl.clearColor(...floorColor,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.activeTexture(gl.TEXTURE2);gl.bindTexture(gl.TEXTURE_2D,shadowTexture);
 const center=-.5*(1-leaves[0].p)+.5*leaves.at(-1).p;
 gl.uniform2f(loc.viewport,view.width,view.height);gl.uniform1f(loc.worldHeight,view.worldHeight);gl.uniform1f(loc.center,center);
 gl.uniform1f(loc.mode,0);
 // A turning cover is the only sheet on the empty side. Do not draw a
 // full-size blank stack there until a sheet actually lies on that side.
 const restingLeft=leaves.some(l=>l.p>=.9999&&Math.abs(l.v)<.01);
 const restingRight=leaves.some(l=>l.p<=.0001&&Math.abs(l.v)<.01);
 for(let i=5;i>=1;i--){if(restingLeft)drawMesh(flatLeft,white,white,[-i*.0025,-i*.0028,-.022-i*.001]);if(restingRight)drawMesh(flatRight,white,white,[i*.0025,-i*.0028,-.022-i*.001]);}
 for(const l of visible)drawLeaf(l);
 // Draw the receiving floor last: the paper depth now rejects pixels hidden
 // underneath the book before the expensive soft-shadow fragment shader runs.
 gl.uniform1f(loc.mode,2);drawMesh(flatRight,white,white,[-5,0,-.065],[10,10,1],0);
 if((active||drag||Math.abs(hover-hoverTarget)>.001)&&!frame)frame=requestAnimationFrame(render);
}
function requestRender(){if(!disposed&&!frame&&ready&&bookHost.isConnected&&hostActive&&!document.hidden)frame=requestAnimationFrame(render);}
function setHostActive(value){
 value=!!value;if(value===hostActive)return;
 hostActive=value;
 canvas.dataset.active=String(value);
 if(!value){if(frame)cancelAnimationFrame(frame);frame=0;}
 else{lastTime=performance.now();requestRender();}
}
function resize(){const bounds=embeddedHost?canvas.getBoundingClientRect():null,w=bounds?bounds.width:innerWidth,h=bounds?bounds.height:innerHeight,dpr=Math.min(devicePixelRatio||1,2.5);if(!w||!h)return;resizeDirty=false;if(view.width!==w||view.height!==h||view.dpr!==dpr){view={width:w,height:h,dpr,worldHeight:Math.max(1.62,2.28/(w/h))};canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);}}
function refresh(){resizeDirty=true;const color=getComputedStyle(bookHost).backgroundColor,bg=color.match(/[\d.]+/g);floorColor=bg?bg.slice(0,3).map(Number).map(v=>color.startsWith('color(srgb')?v:v/255):[1,1,1];requestRender();}
function pointerPosition(e){const bounds=embeddedHost?canvas.getBoundingClientRect():null,x=e.clientX-(bounds?.left||0),clientY=e.clientY-(bounds?.top||0),pagePixels=view.height/view.worldHeight;return {x,clientY,y:clamp((clientY-view.height/2+pagePixels*H/2)/(pagePixels*H)),pagePixels};}
function bindInteractions(){
 canvas.addEventListener('wheel',e=>{
  e.preventDefault();if(!ready||busy)return;hoverTarget=0;const delta=Math.abs(e.deltaX)>Math.abs(e.deltaY)?e.deltaX:e.deltaY,unit=e.deltaMode===1?18:e.deltaMode===2?view.height:1;
  wheelTotal+=delta*unit;const steps=Math.trunc(wheelTotal/85);if(steps){wheelTotal-=steps*85;step(steps*(e.shiftKey?3:1),{grab:hoverY,speed:Math.abs(delta)/8});}else updateUI();
 },{passive:false,signal});
 canvas.addEventListener('pointerdown',e=>{
  if(e.button!==0||busy||!ready||pointer)return;frozen=false;hoverTarget=0;canvas.setPointerCapture(e.pointerId);canvas.focus({preventScroll:true});resize();const pos=pointerPosition(e);pointer={x:pos.x,y:pos.clientY,q:position(),time:performance.now(),lastX:pos.x,lastTime:performance.now(),velocity:0,id:e.pointerId,grab:pos.y,pagePixels:pos.pagePixels,shift:e.shiftKey};drag=null;
  // Catch an airborne sheet before the drag threshold; do not let it keep
  // travelling toward its previous destination under a stationary pointer.
  target=pointer.q;leaves.forEach(l=>{l.goal=l.p;l.v=0;l.due=0;l.shapeTarget={...l.shape};l.changed=true;});active=false;requestRender();updateUI();
 },{signal});
 canvas.addEventListener('pointermove',e=>{
  if(pointer&&pointer.id!==e.pointerId)return;
  const pos=pointerPosition(e);hoverY=pos.y;
  if(!pointer){const center=-.5*(1-leaves[0].p)+.5*leaves.at(-1).p,side=pos.x<view.width/2+center*pos.pagePixels?-1:1,edge=view.width/2+(side+center)*pos.pagePixels;
   if(hoverSide!==side){hoverSide=side;leaves.forEach(l=>l.changed=true);requestRender();}
   const nextHover=motionEnabled&&!reduced.matches&&!active&&Math.abs(pos.x-edge)<55&&Math.abs(pos.clientY-view.height/2)<H*pos.pagePixels/2&&(side>0?target<leaves.length:target>0)?1:0;
   if(nextHover!==hoverTarget){hoverTarget=nextHover;requestRender();}return;}
  const dx=pos.x-pointer.x,dy=pos.clientY-pointer.y,now=performance.now(),dt=(now-pointer.lastTime)/1000;
  if(dt>0){const v=clamp(-(pos.x-pointer.lastX)/pointer.pagePixels/dt,-20,20);pointer.velocity=v*pointer.velocity<0?v:pointer.velocity*.55+v*.45;}pointer.lastX=pos.x;pointer.lastTime=now;
  if(!drag&&Math.abs(dx)>7&&Math.abs(dx)>Math.abs(dy))drag={grab:pointer.grab,shapes:new Map()};
  if(drag){canvas.classList.add('dragging');const q=clamp(pointer.q-dx/pointer.pagePixels*(pointer.shift?2.5:1),0,leaves.length);setTarget(q,{direct:true,grab:pointer.grab,speed:Math.abs(pointer.velocity)});}
 },{signal});
 function endPointer(e,cancel=false){
  if(!pointer||pointer.id!==e.pointerId)return;const p=pointer,wasDrag=!!drag;pointer=drag=null;canvas.classList.remove('dragging');hoverTarget=0;
  if(wasDrag){const stale=performance.now()-p.lastTime>110,velocity=stale?0:p.velocity,momentum=cancel?0:clamp(velocity*.12,-2.5,2.5);let to=cancel?Math.round(p.q):Math.round(target+momentum);setTarget(to,{grab:p.grab,speed:Math.abs(velocity)});}
  else if(!cancel){const pos=pointerPosition(e);if(Math.hypot(pos.x-p.x,pos.clientY-p.y)<10)step((pos.x>view.width/2?1:-1)*(e.shiftKey?3:1),{grab:p.grab});else setTarget(Math.round(target),{grab:p.grab});}
  else setTarget(Math.round(p.q),{grab:p.grab});
 }
 canvas.addEventListener('pointerup',e=>endPointer(e),{signal});canvas.addEventListener('pointercancel',e=>endPointer(e,true),{signal});canvas.addEventListener('lostpointercapture',e=>endPointer(e,true),{signal});canvas.addEventListener('pointerleave',()=>{hoverTarget=0;requestRender();},{signal});
 (embeddedHost?canvas:window).addEventListener('keydown',e=>{
  if(e.target.tagName==='INPUT')return;
  if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();step((e.key==='ArrowRight'?1:-1)*(e.shiftKey?3:1),{speed:e.repeat?10:0});}
  if(e.key==='Home'){e.preventDefault();setTarget(0);}if(e.key==='End'){e.preventDefault();setTarget(leaves.length);}
 },{signal});
 addEventListener('resize',()=>{resizeDirty=true;requestRender();},{signal});document.addEventListener('visibilitychange',()=>{if(document.hidden){if(frame)cancelAnimationFrame(frame);frame=0;}else{lastTime=performance.now();requestRender();}},{signal});reduced.addEventListener('change',()=>{if(reduced.matches)setTarget(target);},{signal});
 resizeObserver=new ResizeObserver(()=>{resizeDirty=true;requestRender();});resizeObserver.observe(canvas);
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();ready=false;if(frame)cancelAnimationFrame(frame);frame=0;$('.fallback').textContent=options.en?'3D preview interrupted. Reload to restore it.':'3D 画面暂时中断，请刷新页面恢复。';$('.fallback').style.display='block';},{signal});
}
async function main(){
 initGL();spreads=await loadOriginal();if(disposed)return null;ready=true;rebuildLeaves(0);(embeddedHost||document.body).classList.add('ready');bindInteractions();
 const bookAPI={
  setActive:setHostActive,
  capture(){return{index,target,frozen,hover,hoverTarget,hoverY,hoverSide,leaves:leaves.map(l=>({p:l.p,v:l.v,goal:l.goal,delay:Math.max(0,l.due-performance.now()),shape:{...l.shape},shapeTarget:{...l.shapeTarget}}))};},
  restore(saved){if(!saved||saved.leaves.length!==leaves.length)return;const now=performance.now();saved.leaves.forEach((s,i)=>Object.assign(leaves[i],s,{due:now+s.delay,shape:{...s.shape},shapeTarget:{...s.shapeTarget},changed:true}));({index,target,frozen,hover,hoverTarget,hoverY,hoverSide}=saved);lastTime=now;active=isMoving();updateUI();requestRender();},
  go(to){setTarget(to);},step(n){step(n);},
  reset(to=0){rebuildLeaves(clamp(to,0,spreads.length-1));},
  seek(from,to,progress,options={}){frozen=true;drag=pointer=null;hover=hoverTarget=0;const direction=Math.sign(to-from),n=Math.abs(to-from);leaves.forEach(l=>{l.p=l.goal=l.s<from?1:0;l.v=0;l.changed=true;});for(let i=0;i<n;i++){const s=direction>0?from+i:from-i-1,l=leaves[s],q=clamp(progress-(options.fan?i*.11:0));l.p=l.goal=direction>0?q:1-q;l.shape=profile(s,options.grab??.5,options.speed??0,direction);l.shapeTarget={...l.shape};l.changed=true;}index=from;target=from+(to-from)*progress;active=false;updateUI();requestRender();},
  lighting(on){gl.uniform1f(loc.shadowEnabled,on?1:0);requestRender();},
  state(){return{index,target,total:spreads.length,position:position(),animating:isMoving(),dragging:!!drag,ready,edition,hostActive,leaves:leaves.map(l=>({p:l.p,v:l.v,curl:l.shape.curl,twist:l.shape.twist,direction:l.shape.direction})),history};}
 };
 refresh();return bookAPI;
}
if(!gl)throw new Error('WebGL unavailable');
try {
 const api=await main();if(!api)return null;
 api.setMotion=function(on){motionEnabled=on;if(!on){hover=hoverTarget=0;leaves.forEach(l=>l.changed=true);setTarget(Math.round(target));}updateUI();requestRender();};
 api.setSpeed=function(speed){playSpeed=speed;};
 api.setLanguage=function(en){options.en=en;updateUI();};
 api.refresh=refresh;
 api.dispose=function(){controller.abort();};
 return api;
} catch(error){gl.getExtension('WEBGL_lose_context')?.loseContext();throw error;}

}};
