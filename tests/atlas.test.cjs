const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
function environment(record = false) {
  let motion = true;
  const calls = [];
  const gradient = { addColorStop() {} };
  const ctx = new Proxy({}, { get(t,k) { if (k in t) return t[k]; if (/create.*Gradient/.test(k)) return () => gradient; if (k === 'measureText') return () => ({width:10}); return (...args) => { if(record) calls.push([k,...args]); }; } });
  const canvas = () => ({ width:600, height:360, style:{}, handlers:{}, getContext:()=>ctx,
    getBoundingClientRect:()=>({left:0,top:0,right:600,bottom:360,width:600,height:360}),
    addEventListener(k,f,o) { (this.handlers[k] ||= []).push(f); o?.signal?.addEventListener('abort',()=>this.removeEventListener(k,f),{once:true}); },
    removeEventListener(k,f) { this.handlers[k] = this.handlers[k].filter(x => x !== f); },
    setPointerCapture(){}, fire(k,e={}) { for (const fn of this.handlers[k] || []) fn({button:0,pointerId:1,clientX:300,clientY:180,preventDefault(){},...e}); }
  });
  const sandbox = {window:{ENGINE:{motionOn:()=>motion}},document:{createElement:canvas,documentElement:{dataset:{lang:'zh'}}},matchMedia:()=>({matches:false}),devicePixelRatio:1,performance:{now:()=>1000},console,Math};
  vm.runInNewContext(fs.readFileSync('assets/atlas-canvas.js','utf8'),sandbox);
  return {Demo:sandbox.window.ATLAS_CANVAS.Demo,canvas,calls,stop:()=>{motion=false;}};
}
test('chart starts without bars or a line and reveals columns progressively in both directions',()=>{
 const e=environment(true),d=new e.Demo(e.canvas(),{id:26,mode:'scroll'});
 const draw=p=>{e.calls.length=0;d.p=p;d.draw();return e.calls.filter(c=>c[0]==='roundRect'&&c[3]===32).length;};
 assert.equal(draw(0),0,'no authored columns exist in the initial frame');
 assert.equal(draw(.2),2,'only the first two columns have entered');
 assert.equal(draw(1),7,'all seven columns are complete');
 assert.equal(draw(.2),2,'reverse scrubbing removes later columns');
 assert.equal(draw(0),0,'returning to the start clears every column');
 assert.ok(!e.calls.some(c=>c[0]==='lineTo'&&c[1]===490),'no chart line connects unrevealed columns');
});
const cases = [[1,'pointer'],[2,'pointer'],[3,'hover'],[7,'hover'],[16,'scroll'],[17,'scroll'],[22,'scroll'],[25,'scroll'],[26,'scroll'],[28,'scroll'],[29,'click'],[30,'click'],[31,'click'],[35,'click'],[37,'click'],[39,'click'],[40,'drag'],[43,'drag'],[44,'drag'],[46,'click']];
test('all 20 source scenes render initial, intermediate and final states',()=>{
 const e=environment();
 for(const [id,mode] of cases){const d=new e.Demo(e.canvas(),{id,mode});d.trigger();for(let i=0;i<150;i++){d.p=i/149;d.update(1/60,i*16,1/60);}for(const key of ['time','p','x','y','angle','openP'])assert.ok(Number.isFinite(d[key]),`${id}: ${key}`);d.reset();d.destroy();assert.ok(Object.values(d.canvas.handlers).every(x=>!x.length));}
});
test('garden planting keeps independent positions and timelines, retains seven plants, and resets',()=>{
 const e=environment(),c=e.canvas(),d=new e.Demo(c,{id:29,mode:'click'});
 d.trigger({x:.2,y:.7});d.update(.4,1400,.4);d.trigger({x:.8,y:.8});
 assert.equal(d.garden[0].x,120);assert.equal(d.garden[1].x,480);
 assert.ok(d.garden[1].time>d.garden[0].time);assert.notEqual(d.garden[0].y,d.garden[1].y);
 for(let i=0;i<8;i++)d.trigger({x:.1+i*.1,y:.75});assert.equal(d.garden.length,7);
 e.stop();d.trigger({x:.5,y:.7});d.update(0,2000,0);assert.equal(d.garden.length,7);
 d.reset();assert.equal(d.garden.length,0);
});
test('scroll reverses, clamps, and hands the page scroll back at endpoints',()=>{
 const e=environment(),canvas=e.canvas(),d=new e.Demo(canvas,{id:26,mode:'scroll'});let prevented=0;
 canvas.fire('wheel',{deltaY:800,deltaX:0,preventDefault(){prevented++;}});assert.equal(d.p,.5);
 canvas.fire('wheel',{deltaY:-400,deltaX:0,preventDefault(){prevented++;}});assert.equal(d.p,.25);
 canvas.fire('wheel',{deltaY:4000,deltaX:0,preventDefault(){prevented++;}});assert.equal(d.p,1);
 canvas.fire('wheel',{deltaY:400,deltaX:0,preventDefault(){prevented++;}});assert.equal(prevented,3);
});
test('cancelled pointer sequences never activate a button or pin a hover',()=>{
 const e=environment();for(const id of [3,7,30,31,39]){const c=e.canvas(),d=new e.Demo(c,{id,mode:id<10?'hover':'click'});c.fire('pointerdown');c.fire('pointercancel');c.fire('lostpointercapture');assert.equal(d.clickCount,0);assert.equal(d.latched,false);assert.equal(d.drag,null);}
});
test('motion off still permits direct interaction without advancing animation time',()=>{
 const e=environment();e.stop();for(const id of [30,31,37,39,43,44]){const d=new e.Demo(e.canvas(),{id,mode:id>40?'drag':'click'});d.trigger();d.update(0,1000,0);assert.equal(d.time,0);if(id===30||id===39)assert.equal(d.openP,1);if(id===31)assert.equal(d.buttonWidth,145);if(id>40)assert.equal(d.angle,d.targetAngle);}
});
test('a detail stage survives detachment during navigation and disposes only on eviction',()=>{
 const e=environment();
 function node(){return {dataset:{},style:{},hidden:false,clientWidth:600,clientHeight:360,handlers:{},setAttribute(k,v){this[k]=v;},getAttribute(k){return this[k];},querySelector(){return null;},querySelectorAll(){return [];},addEventListener(k,fn){(this.handlers[k]||=[]).push(fn);},removeEventListener(){}};}
 const c=e.canvas();Object.assign(c,{setAttribute(k,v){this[k]=v;},getAttribute(k){return this[k];}});
 const cue=node(),reset=node(),resetText=node(),view=node(),root=node();
 reset.querySelector=()=>resetText;
 root.querySelector=s=>({'canvas':c,'.atlas-viewport':view,'.atlas-reset':reset,'.atlas-cue':cue}[s]||null);
 const stage=node();stage.isConnected=false;stage.querySelector=()=>root;
 const tickers=new Set(), spec={kind:'compound',mode:'fab'};
 const engine={esc:String,tickers,isVisible:()=>true,motionOn:()=>true};
 const document=node();document.documentElement={dataset:{lang:'zh'}};document.hidden=false;
 const window=node();Object.assign(window,{MOTION:{htmlFor:()=>'',KINDS:{compound(){}}},ENGINE:engine,ATLAS_CANVAS:{Demo:e.Demo},TERMS:[{id:'fab-to-sheet',zh:'悬浮按钮展开面板',en:'FAB',def:'',demo:spec}]});
 const sandbox={window,document,matchMedia:()=>({matches:false}),performance:{now:()=>1000},AbortController,ResizeObserver:class {observe(){}disconnect(){}},MutationObserver:class {observe(){}disconnect(){}},console,Set,Math,location:{origin:'http://localhost'}};
 vm.runInNewContext(fs.readFileSync('assets/atlas.js','utf8'),sandbox);
 window.MOTION.KINDS.compound(stage,spec);
 assert.equal(tickers.size,1);for(const tick of tickers)tick(1100);
 assert.ok(c.handlers.pointerdown.length>0,'detached stage retains input listeners');
 stage.isConnected=true;stage._setActive();c.fire('pointerdown');c.fire('pointerup');for(const tick of tickers)tick(1200);
 assert.equal(root.dataset.clicks,1);assert.ok(+root.dataset.open>0);
 stage._dispose();stage._dispose();assert.equal(tickers.size,0);assert.equal(c.handlers.pointerdown.length,0);
});
