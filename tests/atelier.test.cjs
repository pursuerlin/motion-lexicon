const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
function setup(mode='helix') {
 let now=1000,motion=true;
 function node(){return {dataset:{},style:{},handlers:{},clientWidth:600,clientHeight:360,isConnected:true,hidden:false,
 addEventListener(k,fn,o){(this.handlers[k]||=[]).push(fn);o?.signal?.addEventListener('abort',()=>{this.handlers[k]=this.handlers[k].filter(f=>f!==fn);},{once:true});},
 fire(k,e={}){for(const f of this.handlers[k]||[])f({button:0,pointerId:1,clientX:300,clientY:180,preventDefault(){},stopPropagation(){},...e});},
 setAttribute(k,v){this[k]=v;},querySelector(){return null;},querySelectorAll(){return [];},getBoundingClientRect(){return {left:0,top:0,width:600,height:360};},focus(){},setPointerCapture(){},appendChild(){},remove(){}};}
 const view=node(),cue=node(),small=node(),strong=node(),output=node(),previous=node(),next=node(),root=node(),reset=node();previous.dataset.step='-1';next.dataset.step='1';
 const photos=Array.from({length:mode==='helix'?8:0},()=>{const p=node(),caption=node();p.querySelector=()=>caption;return p;});
 const canvas=mode==='glow'?Object.assign(node(),{getContext:()=>null}):null;
 root.querySelector=s=>({'.atelier-view':view,canvas,'.atelier-cue':cue,small,strong,output,'[data-reset]':mode==='glow'?reset:null}[s]||null);
 root.querySelectorAll=s=>s==='.atelier-photo'?photos:s==='[data-step]'?[previous,next]:[];
 const stage=node();stage.querySelector=()=>root;
 const tickers=new Set();const engine={motionOn:()=>motion,isVisible:()=>true,tickers};
 const document=node();document.documentElement={dataset:{lang:'zh',theme:'paper'}};
 document.createElement=()=>node();
 const window={MOTION:{htmlFor:()=>'',KINDS:{compound(){}}},ENGINE:engine,TERMS:[]};
 vm.runInNewContext(fs.readFileSync('assets/atelier-studies.js','utf8'),{window,document,AbortController,ResizeObserver:class{observe(){}disconnect(){}},MutationObserver:class{observe(){}disconnect(){}},matchMedia:()=>({matches:false}),getComputedStyle:()=>({color:'rgb(240, 235, 225)'}),devicePixelRatio:1,performance:{now:()=>now},console,Math});
 window.MOTION.KINDS.compound(stage,{kind:'compound',mode});
 function advance(ms=1400){for(let i=0;i<ms/16;i++){now+=16;for(const f of tickers)f(now);}}
 return {root,view,next,stage,tickers,photos,advance,setTime:t=>now=t,stop(){motion=false;stage._onMotion();}};
}
test('helix drag tracks input directly, ignores other pointers, and cancellation settles without a click',()=>{
 const e=setup();e.view.fire('pointerdown');e.setTime(1050);e.view.fire('pointermove',{clientX:360,pointerId:2});assert.equal(e.root.dataset.angle,'0.0000');
 e.view.fire('pointermove',{clientX:375});assert.ok(Math.abs(+e.root.dataset.angle-Math.PI/4)<.001);
 e.view.fire('pointercancel',{clientX:375});e.view.fire('lostpointercapture');e.advance();assert.ok(Math.abs(+e.root.dataset.angle-Math.PI/4)<.001);
 assert.equal(e.root.dataset.current,'7');assert.equal(e.photos.filter(p=>p.dataset.current==='true').length,1);
});
test('helix buttons and keyboard work with motion off; detached stages retain their controller until disposal',()=>{
 const e=setup();e.stop();e.next.fire('click');assert.equal(e.root.dataset.current,'1');
 e.view.fire('keydown',{key:'ArrowLeft'});assert.equal(e.root.dataset.current,'0');
 e.stage.isConnected=false;e.stage._setActive();assert.equal(e.tickers.size,1);
 e.stage.isConnected=true;e.stage._setActive();e.next.fire('click');assert.equal(e.root.dataset.current,'1');
 e.stage._dispose();e.stage._dispose();assert.equal(e.tickers.size,0);assert.ok(Object.values(e.view.handlers).every(a=>a.length===0));
});
test('glow fallback preserves pointer and keyboard light controls without WebGL',()=>{
 const e=setup('glow');assert.equal(e.root.dataset.fallback,'true');e.stop();
 e.view.fire('pointermove',{clientX:120,clientY:90});assert.equal(e.root.dataset.light,'0.200,0.250');
 e.view.fire('keydown',{key:'Home'});assert.equal(e.root.dataset.light,'0.500,0.500');e.stage._dispose();
});
