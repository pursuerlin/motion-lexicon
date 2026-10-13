const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const context = {window:{ENGINE:{onMotion(){}}, MOTION:{KINDS:{}}}, document:{documentElement:{},addEventListener(){}}, MutationObserver:class{observe(){}}};
vm.createContext(context);
for (const file of ['ease','data1','data2','runtime','compound','params','dialects']) vm.runInContext(fs.readFileSync('assets/'+file+'.js','utf8'),context);
const D=context.window.DIALECTS, terms=context.window.TERMS, byId=id=>terms.find(t=>t.id===id);
assert.equal(terms.length,244);
for(const id of ['page-curl','morphing-dot-sphere','scramble-decode','spring','confetti','glitch-in','mask','unmount']) {
  for(const format of D.list){D.set(format.key);assert.equal(D.codeFor(byId(id)),'',id+' must not export source pseudocode');assert.equal(D.panelHTML(byId(id)),'');}
}
D.set('css');D.set('swift');assert.equal(D.current,'css');
let exported=0;const pages=[];
for(const term of terms){
  if(!D.compilable(term))continue;
  exported++;
  for(const {key} of D.list){
    D.set(key);const html=D.codeFor(term);
    assert.match(html,/<!doctype html>/);assert.doesNotMatch(html,/assets\/|var\(--accent|undefined|NaN/);
    new vm.Script(html.match(/<script>\n([\s\S]*)\n<\/script>/)[1]);
    pages.push({id:term.id,format:key,html});
  }
}
D.set('css');assert.match(D.codeFor(byId('stagger'),{dur:810,st:75,loop:true}),/810ms.*infinite alternate both/);assert.match(D.codeFor(byId('stagger'),{st:75}),/var\(--i\) \* 75ms/);
assert.match(D.codeFor(byId('iteration')),/ 3 normal both/);
assert.match(D.codeFor(byId('asymmetric')),/@keyframes motion1/);
assert.match(D.codeFor(byId('duration'),{dur:240}),/motion0 240ms/);
assert.match(D.codeFor(byId('duration'),{dur:240}),/motion1 1800ms/);
D.set('waapi');
const sequence=D.codeFor(byId('orchestration'));assert.match(sequence,/"offset": 0.6/);assert.match(sequence,/translateY\(-4px\) rotate\(2deg\)/);assert.match(sequence,/easing: "linear"/);assert.match(sequence,/"easing": "cubic-bezier/);
assert.match(D.codeFor(byId('iteration')),/iterations: 3/);
console.log(`${terms.length} terms audited; ${exported} complete native implementations / ${pages.length} syntax-checked HTML exports.`);
if(process.argv.includes('--fixture')) {
 fs.writeFileSync('/tmp/motion-code-302/pages.json',JSON.stringify(pages));
 for(const page of pages.filter(p=>['stagger','hover-lift','press-feedback','orchestration','asymmetric'].includes(p.id)))fs.writeFileSync('/tmp/motion-code-302/'+page.id+'-'+page.format+'.html',page.html);
}
