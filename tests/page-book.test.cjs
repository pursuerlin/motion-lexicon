// Exercise the real instance and pointer handlers with a deterministic clock.
// WebGL is stubbed: these checks cover interaction continuity, not pixels.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

async function fixture() {
  let now = 0, frameId = 0;
  const frames = new Map();
  const gl = new Proxy({}, { get(object, key) {
    if (key === 'getShaderPrecisionFormat') return () => ({ precision: 23 });
    if (key === 'getShaderParameter' || key === 'getProgramParameter') return () => true;
    if (key === 'getParameter') return () => 4096;
    if (key === 'checkFramebufferStatus') return () => gl.FRAMEBUFFER_COMPLETE;
    if (key === 'getExtension') return () => ({ loseContext() {} });
    if (key === 'getAttribLocation') return () => 0;
    if (/^[A-Z_0-9]+$/.test(key)) return object[key] ??= Object.keys(object).length + 1;
    return () => ({});
  } });
  class Element extends EventTarget {
    constructor() { super(); this.dataset = {}; this.style = {}; this.attrs = {}; this.classList = { add() {}, remove() {} }; }
    setAttribute(key, value) { this.attrs[key] = String(value); }
    matches() { return false; }
    focus() {}
    setPointerCapture() {}
    getBoundingClientRect() { return { left: 0, top: 0, width: 800, height: 400 }; }
    getContext() { return gl; }
  }
  const elements = new Map();
  const host = new Element(); host.isConnected = true;
  host.querySelector = selector => {
    if (!elements.has(selector)) elements.set(selector, new Element());
    return elements.get(selector);
  };
  class Image {
    naturalWidth = 960; naturalHeight = 1200;
    set src(value) { this.url = value; queueMicrotask(() => this.onload()); }
  }
  const document = new EventTarget(); document.hidden = false;
  const reduced = new EventTarget(); reduced.matches = false;
  const context = vm.createContext({ window: {}, document, Image, AbortController, DOMException,
    performance: { now: () => now }, matchMedia: () => reduced,
    getComputedStyle: () => ({ backgroundColor: 'rgb(245, 243, 238)' }),
    devicePixelRatio: 1, addEventListener() {},
    ResizeObserver: class { observe() {} disconnect() {} },
    requestAnimationFrame(fn) { frames.set(++frameId, fn); return frameId; },
    cancelAnimationFrame(id) { frames.delete(id); }
  });
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../assets/page-book.js'), 'utf8'), context);
  const api = await context.window.PAGE_BOOK.create(host);
  const canvas = elements.get('[data-book-book]');
  function tick(count = 1) {
    for (let i = 0; i < count; i++) {
      now += 16;
      const pending = [...frames.values()]; frames.clear();
      pending.forEach(callback => callback(now));
    }
  }
  function pointer(type, x, advance = 16) {
    now += advance;
    const event = new Event(type);
    Object.assign(event, { button: 0, pointerId: 1, clientX: x, clientY: 240, shiftKey: false });
    canvas.dispatchEvent(event);
  }
  tick();
  return { api, canvas, tick, pointer, frames, elements };
}

(async () => {
  const { api, canvas, tick, pointer, frames, elements } = await fixture();
  api.reset(1); tick();

  // Pointer progress must be immediate; no easing delay while holding paper.
  pointer('pointerdown', 500);
  pointer('pointermove', 340, 80);
  const forward = api.state();
  assert.ok(forward.position > 1.6);
  assert.equal(forward.position, forward.target);
  tick(12);
  assert.equal(api.state().position, forward.position, 'stationary pointer must leave the held page stationary');
  const handedness = forward.leaves[1].direction;

  // A short reversal starts with the current bend, then changes continuously
  // with distance, independent of elapsed frames.
  pointer('pointermove', 338, 80);
  const beforeReverse = api.state();
  pointer('pointermove', 340, 80);
  const tinyReverse = api.state();
  assert.ok(tinyReverse.position < beforeReverse.position);
  assert.equal(tinyReverse.position, tinyReverse.target);
  assert.ok(Math.abs(tinyReverse.leaves[1].direction - handedness) < .02, 'small reversal must not snap the crease');
  pointer('pointermove', 460, 80);
  const reversed = api.state();
  assert.ok(reversed.position < forward.position);
  assert.equal(reversed.position, reversed.target, 'reverse stroke must track input immediately');
  tick(12);
  assert.equal(api.state().leaves[1].direction, reversed.leaves[1].direction, 'held bend must not drift on a delayed timer');
  pointer('pointerup', 460, 0);
  assert.equal(api.state().target, 1, 'release after reversal must settle back instead of using stale forward momentum');
  const releasePosition = api.state().position;
  assert.ok(releasePosition > 1 && releasePosition < 2);
  tick(3);
  assert.ok(api.state().position < releasePosition, 'release must continue smoothly from the held surface');
  tick(90);
  assert.equal(api.state().position, 1);

  // Interrupt an airborne page with a stationary press before drag threshold.
  api.step(1); tick(5);
  const airborne = api.state().position;
  assert.ok(airborne > 1 && airborne < 2);
  pointer('pointerdown', 500);
  tick(30);
  assert.equal(api.state().position, airborne, 'a caught page must stop under the pointer');
  assert.ok(api.state().leaves.every(leaf => leaf.v === 0));
  pointer('pointermove', 510, 80);
  tick(8);
  assert.ok(api.state().position < airborne);
  pointer('pointercancel', 510); tick(90);
  assert.equal(api.state().position, Math.round(airborne));

  // Rapid button retargeting and motion-off direct manipulation still work.
  api.reset(1); api.step(3); tick(5); api.step(-2); tick(120);
  assert.equal(api.state().position, 2);
  api.setMotion(false);
  pointer('pointerdown', 500); pointer('pointermove', 400, 80);
  assert.equal(api.state().position, api.state().target);
  pointer('pointerup', 400); tick();
  assert.equal(api.state().position, Math.round(api.state().target));
  api.setMotion(true);

  // No hidden autoplay route through keyboard, loops or elapsed time.
  const position = api.state().position;
  const key = new Event('keydown'); Object.assign(key, { code: 'Space', key: ' ', shiftKey: false });
  canvas.dispatchEvent(key); tick(700);
  assert.equal(api.state().position, position);
  assert.equal(api.auto, undefined);
  assert.equal(elements.has('[data-book-play]'), false);
  assert.equal(elements.has('[data-book-scrub]'), false);
  assert.equal(elements.has('[data-book-prev]'), false);
  api.dispose(); assert.equal(frames.size, 0);
  console.log('page-book: immediate pointer follow, continuous partial reversal, airborne catch, cancellation, motion-off, no autoplay — passed');
})().catch(error => { console.error(error); process.exitCode = 1; });
