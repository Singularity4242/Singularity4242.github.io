import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {createGeometry} from '../public/sculpture-renderer.js';
const geometry=createGeometry();
assert.equal(geometry.indices.length,256*32*6);
assert.ok(geometry.indices.every(i=>i<geometry.positions.length/3));
assert.ok(geometry.positions.every(Number.isFinite));
for(let i=0;i<geometry.normals.length;i+=3)assert.ok(Math.abs(Math.hypot(...geometry.normals.slice(i,i+3))-1)<1e-5);
// A half twist connects the final ring to the opposite side of the first ring.
for(let j=0;j<32;j++)for(let k=0;k<3;k++)assert.ok(Math.abs(geometry.positions[(256*33+j)*3+k]-geometry.positions[((j+16)%32)*3+k])<1e-5);
const source=readFileSync(new URL('../public/site.js',import.meta.url),'utf8').replace(/^import .*\n/,'');
function harness(reduced=false,available=true){
 const raf=new Map(), observers=[],events={},buttonEvents={},documentEvents={},canvasEvents={},resetEvents={};let nextId=1,captured=null;
 const draws=[], classes=new Set(),label={},symbol={},controls={hidden:true};
 const preference={matches:reduced,addEventListener:(_,fn)=>events.preference=fn};
 const button={hidden:true,setAttribute(){},querySelector:s=>s.includes('label')?label:symbol,addEventListener:(n,f)=>buttonEvents[n]=f};
 const reset={addEventListener:(n,f)=>resetEvents[n]=f};
 const stage={clientWidth:600,clientHeight:600,classList:{add:n=>classes.add(n),remove:n=>classes.delete(n)},style:{setProperty(){}},querySelector:s=>s==='.sculpture-controls'?controls:reset};
 const canvas={parentElement:stage,addEventListener:(n,f)=>canvasEvents[n]=f,setPointerCapture:id=>captured=id,hasPointerCapture:id=>captured===id,releasePointerCapture:()=>captured=null};
 const welcome={offsetHeight:800};
 const doc={hidden:false,documentElement:{dataset:{}},querySelector:s=>s==='.motion-toggle'?button:s==='.welcome'?welcome:null,getElementById:id=>id==='sculpture'?canvas:null,querySelectorAll:()=>[],addEventListener:(n,f)=>documentEvents[n]=f};
 const sandbox={document:doc,matchMedia:()=>preference,createSculptureRenderer:()=>available?{draw:state=>draws.push({...state})}:null,innerWidth:1280,innerHeight:800,devicePixelRatio:2,scrollY:0,location:{hash:''},window:{},requestAnimationFrame:f=>{const id=nextId++;raf.set(id,f);return id},cancelAnimationFrame:id=>raf.delete(id),addEventListener:(n,f)=>events[n]=f,IntersectionObserver:class{constructor(fn){observers.push(fn)}observe(){}},ResizeObserver:class{observe(){}}};
 vm.runInNewContext(source,sandbox);
 function step(time=100){const frames=[...raf];raf.clear();for(const [,f]of frames)f(time);}
 function pointer(type,x=0,y=0,pointerType='mouse',id=1){canvasEvents[type]({pointerId:id,pointerType,button:0,clientX:x,clientY:y,preventDefault(){}});}
 return {raf,doc,preference,events,buttonEvents,documentEvents,observers,label,button,canvas,canvasEvents,resetEvents,draws,controls,classes,step,pointer};
}
const h=harness();assert.equal(h.raf.size,1);h.buttonEvents.click();assert.equal(h.raf.size,0);
h.pointer('pointerdown',100,100);h.pointer('pointermove',400,250);h.step();
assert.ok(Math.abs(h.draws.at(-1).yaw-Math.PI)<1e-8,'half-turn horizontal drag');
assert.ok(Math.abs(h.draws.at(-1).pitch-Math.PI/2)<1e-8,'vertical flip');
h.pointer('pointerup');assert.equal(h.raf.size,0,'manual rotation works while paused without an idle loop');
h.resetEvents.click();h.step();assert.equal(h.draws.at(-1).yaw,0);assert.equal(h.draws.at(-1).pitch,0);
h.pointer('pointerdown',100,100,'touch');h.pointer('pointermove',150,200,'touch');h.step();assert.equal(h.draws.at(-1).pitch,0,'vertical touch remains scrolling');
h.pointer('pointercancel',150,200,'touch');assert.ok(!h.classes.has('dragging'));
h.canvasEvents.keydown({key:'ArrowRight',preventDefault(){}});h.step();assert.ok(h.draws.at(-1).yaw>0);
h.canvasEvents.keydown({key:'Home',preventDefault(){}});h.step();assert.equal(h.draws.at(-1).yaw,0);
h.buttonEvents.click();assert.equal(h.raf.size,1);
h.observers[0]([{isIntersecting:false}]);assert.equal(h.raf.size,0);
h.observers[0]([{isIntersecting:true}]);assert.equal(h.raf.size,1);
h.doc.hidden=true;h.documentEvents.visibilitychange();assert.equal(h.raf.size,0);
h.doc.hidden=false;h.documentEvents.visibilitychange();assert.equal(h.raf.size,1);
h.preference.matches=true;h.events.preference();assert.equal(h.raf.size,0);
h.canvasEvents.webglcontextlost({preventDefault(){}});assert.equal(h.raf.size,0);assert.ok(h.controls.hidden);assert.ok(!h.classes.has('rendered'));
h.canvasEvents.webglcontextrestored();assert.ok(h.classes.has('rendered'));assert.ok(!h.controls.hidden);
const reduced=harness(true);assert.equal(reduced.raf.size,0);reduced.pointer('pointerdown');reduced.pointer('pointermove',100,0);reduced.step();reduced.pointer('pointerup');assert.ok(reduced.draws.at(-1).yaw>0);assert.equal(reduced.raf.size,0);
const fallback=harness(false,false);assert.equal(fallback.raf.size,0);assert.ok(fallback.controls.hidden);assert.ok(fallback.button.hidden);assert.equal(fallback.canvas.tabIndex,-1);
console.log('PASS: geometry seam/normals, drag/flip/reset, touch cancellation, keyboard, pause, reduced motion, offscreen/background, context recovery and fallback.');
