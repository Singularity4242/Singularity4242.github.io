import { createSculptureRenderer } from './sculpture-renderer.js';

// Essential interactions work independently of the decorative canvas.
document.querySelector('.copy-email')?.addEventListener('click', async event => {
  const email = event.currentTarget.dataset.email;
  const status = document.getElementById('copy-status');
  try {
    await navigator.clipboard.writeText(email);
    status.textContent = '邮箱已复制，期待你的来信。';
  } catch {
    status.textContent = `请选中并复制邮箱：${email}`;
  }
});
document.getElementById('print-resume')?.addEventListener('click', () => window.print());

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
let userPaused = false;
const motionButton = document.querySelector('.motion-toggle');
const intro = document.querySelector('#intro');
// Native anchors preserve scrolling, deep links, history and no-JS access.
document.querySelector('.enter-link')?.addEventListener('click', () => {
  intro?.focus({ preventScroll: true });
});

if ('IntersectionObserver' in window && !reduceMotion.matches) {
  const reveals = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.remove('is-pending');
      reveals.unobserve(entry.target);
    }
  }, { threshold: .08 });
  for (const element of document.querySelectorAll('.reveal')) {
    // Never hide content already visible, or a deep-linked project.
    if (element.getBoundingClientRect().top > innerHeight && !element.contains(document.getElementById(location.hash.slice(1) || 'home'))) {
      element.classList.add('is-pending');
      reveals.observe(element);
    }
  }
}

const canvas = document.getElementById('sculpture');
if (canvas) setupSculpture(canvas);

function setupSculpture(canvas) {
  const stage = canvas.parentElement;
  const welcome = document.querySelector('.welcome');
  const controls = stage.querySelector('.sculpture-controls');
  const resetButton = stage.querySelector('.sculpture-reset');
  let renderer = createSculptureRenderer(canvas, innerWidth < 721);
  let phase = 0, pitch = 0, yaw = 0;
  let frame = 0, lastTime = 0, inView = true, dirty = true;
  let pointer = null, lastX = 0, lastY = 0, heroHeight = welcome.offsetHeight;
  const visible = () => inView && !document.hidden && renderer;
  const automatic = () => !userPaused && !reduceMotion.matches && pointer === null;

  function draw() {
    if (!renderer) return;
    renderer.draw({pitch,yaw,phase});
    stage.classList.add('rendered');
    dirty = false;
  }
  function requestDraw() {
    dirty = true;
    if (visible() && !frame) frame = requestAnimationFrame(tick);
  }
  function tick(now) {
    frame = 0;
    if (!visible()) return;
    const elapsed = lastTime ? now-lastTime : 34;
    if (dirty || elapsed >= 1000/30) {
      if (automatic()) phase += Math.min(elapsed,100)*.00022;
      draw(); lastTime=now;
    }
    if (automatic()) frame=requestAnimationFrame(tick);
  }
  function endDrag() {
    if (pointer === null) return;
    const oldPointer = pointer; pointer = null;
    stage.classList.remove('dragging');
    if (canvas.hasPointerCapture(oldPointer)) canvas.releasePointerCapture(oldPointer);
    lastTime=0;
    if (visible() && automatic() && !frame) frame=requestAnimationFrame(tick);
  }
  function sync() {
    cancelAnimationFrame(frame); frame=0; lastTime=0;
    if (!visible()) endDrag();
    const stopped = userPaused || reduceMotion.matches;
    document.documentElement.dataset.motion = stopped ? 'off' : 'on';
    motionButton.hidden=!renderer;
    motionButton.disabled=reduceMotion.matches;
    motionButton.setAttribute('aria-pressed',String(stopped));
    motionButton.querySelector('.motion-label').textContent = reduceMotion.matches ? '已减少动效' : userPaused ? '开启动效' : '暂停动效';
    motionButton.querySelector('.motion-symbol').textContent = stopped ? '▷' : 'Ⅱ';
    controls.hidden=!renderer;
    canvas.tabIndex=renderer ? 0 : -1;
    if (stopped) stage.style.setProperty('--drift','0px');
    if (visible() && (automatic() || dirty)) frame=requestAnimationFrame(tick);
  }
  function resize() {
    heroHeight=welcome.offsetHeight;
    const pixelRatio=Math.min(devicePixelRatio || 1,1.75);
    canvas.width=Math.max(1,Math.round(stage.clientWidth*pixelRatio));
    canvas.height=Math.max(1,Math.round(stage.clientHeight*pixelRatio));
    draw();
  }
  function reset() {pitch=0;yaw=0;phase=0;requestDraw();}
  canvas.addEventListener('pointerdown',event=>{
    if (!renderer || pointer !== null || event.button !== 0) return;
    pointer=event.pointerId;lastX=event.clientX;lastY=event.clientY;
    canvas.setPointerCapture(pointer);
    stage.classList.add('dragging');
    // Vertical touch gestures remain native page scrolling (touch-action: pan-y).
    if(event.pointerType === 'mouse') event.preventDefault();
  });
  canvas.addEventListener('pointermove',event=>{
    if(event.pointerId !== pointer) return;
    const sensitivity=2*Math.PI/Math.max(stage.clientWidth,300);
    yaw+=(event.clientX-lastX)*sensitivity;
    // Touch dragging rotates horizontally; browsers retain vertical scrolling.
    if(event.pointerType !== 'touch') pitch+=(event.clientY-lastY)*sensitivity;
    lastX=event.clientX;lastY=event.clientY;
    yaw%=2*Math.PI;pitch%=2*Math.PI;
    requestDraw();
  });
  for(const name of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(name,event=>{if(event.pointerId===pointer)endDrag();});
  canvas.addEventListener('dblclick',reset);
  resetButton.addEventListener('click',reset);
  canvas.addEventListener('keydown',event=>{
    if(!renderer)return;
    const keys={ArrowLeft:[0,-.18],ArrowRight:[0,.18],ArrowUp:[-.18,0],ArrowDown:[.18,0]};
    if(event.key==='Home'){event.preventDefault();reset();return;}
    if(!keys[event.key])return;
    event.preventDefault();pitch+=keys[event.key][0];yaw+=keys[event.key][1];requestDraw();
  });
  canvas.addEventListener('webglcontextlost',event=>{
    event.preventDefault();renderer=null;stage.classList.remove('rendered');sync();
  });
  canvas.addEventListener('webglcontextrestored',()=>{
    renderer=createSculptureRenderer(canvas,innerWidth<721);resize();sync();
  });
  resize();
  new ResizeObserver(resize).observe(stage);
  addEventListener('scroll',()=>{
    if (!visible() || !automatic()) return;
    stage.style.setProperty('--drift',`${Math.min(scrollY/heroHeight,1)*24}px`);
  },{passive:true});
  new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;sync();},{threshold:0}).observe(welcome);
  document.addEventListener('visibilitychange',sync);
  reduceMotion.addEventListener('change',sync);
  motionButton.addEventListener('click',()=>{userPaused=!userPaused;sync();});
  sync();
}
