'use strict';
/* ============================================================
 *  造梦西游Ⅵ · 梦烬归墟  —  core utilities / input
 * ============================================================ */
const W = 1280, H = 720, GROUND = 600;
const TAU = Math.PI * 2, PI = Math.PI;

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const invLerp = (a, b, v) => clamp((v - a) / (b - a), 0, 1);
const rand = (a, b) => (b === undefined ? Math.random() * (a === undefined ? 1 : a) : a + Math.random() * (b - a));
const randi = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
const pick = (arr) => arr[(Math.random() * arr.length) | 0];
const sign = (v) => (v < 0 ? -1 : 1);
const dist = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);
const approach = (v, t, d) => (v < t ? Math.min(v + d, t) : Math.max(v - d, t));
const damp = (a, b, k, dt) => lerp(a, b, 1 - Math.exp(-k * dt));
const chance = (p) => Math.random() < p;

const Ease = {
  linear: (t) => t,
  inQuad: (t) => t * t,
  outQuad: (t) => 1 - (1 - t) * (1 - t),
  inCubic: (t) => t * t * t,
  outCubic: (t) => 1 - Math.pow(1 - t, 3),
  inOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  outExpo: (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  inExpo: (t) => (t <= 0 ? 0 : Math.pow(2, 10 * t - 10)),
  outBack: (t) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
  outElastic: (t) => (t <= 0 ? 0 : t >= 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (TAU / 3)) + 1),
  inOutSine: (t) => -(Math.cos(PI * t) - 1) / 2,
};

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

/* ---------- colour helpers ---------- */
const _colCache = {};
function parseColor(c) {
  let v = _colCache[c];
  if (v) return v;
  let r = 0, g = 0, b = 0;
  if (c[0] === '#') {
    let h = c.slice(1);
    if (h.length === 3) h = h.split('').map((x) => x + x).join('');
    const n = parseInt(h, 16);
    r = (n >> 16) & 255; g = (n >> 8) & 255; b = n & 255;
  } else {
    const m = c.match(/[\d.]+/g);
    if (m) { r = +m[0]; g = +m[1]; b = +m[2]; }
  }
  return (_colCache[c] = [r, g, b]);
}
function rgba(c, a) {
  const p = parseColor(c);
  return 'rgba(' + p[0] + ',' + p[1] + ',' + p[2] + ',' + (a < 0 ? 0 : a > 1 ? 1 : a).toFixed(3) + ')';
}
function mix(c1, c2, t) {
  const a = parseColor(c1), b = parseColor(c2);
  return 'rgb(' + Math.round(lerp(a[0], b[0], t)) + ',' + Math.round(lerp(a[1], b[1], t)) + ',' + Math.round(lerp(a[2], b[2], t)) + ')';
}

/* ---------- fonts ---------- */
const FONT_BRUSH = '"STXingkai","华文行楷","FZShuTi","方正舒体","STKaiti","KaiTi",serif';
const FONT_KAI = '"STKaiti","华文楷体","KaiTi","楷体",serif';
const FONT_UI = '"Microsoft YaHei","PingFang SC","Noto Sans SC",sans-serif';
const FONT_NUM = '"Arial Black","Impact","Microsoft YaHei",sans-serif';

/* ---------- offscreen canvas ---------- */
function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.ceil(w));
  c.height = Math.max(1, Math.ceil(h));
  return c;
}

/* ============================================================
 *  INPUT  (keyboard + gamepad + mouse)
 * ============================================================ */
const KEYMAP = {
  KeyA: 'left', ArrowLeft: 'left',
  KeyD: 'right', ArrowRight: 'right',
  KeyW: 'up', ArrowUp: 'up',
  KeyS: 'down', ArrowDown: 'down',
  KeyJ: 'attack', KeyK: 'jump', KeyL: 'dash', ShiftLeft: 'dash', ShiftRight: 'dash',
  KeyU: 's1', KeyI: 's2', KeyO: 's3', KeyE: 'treasure', KeyH: 'treasure', Space: 'ult',
  Escape: 'pause', Enter: 'confirm', NumpadEnter: 'confirm',
  KeyB: 'bag', KeyC: 'swap', KeyX: 'sell', Backspace: 'back', KeyM: 'mute', KeyF: 'fullscreen',
};

const Input = {
  codes: new Set(),
  pressed: new Set(),
  lastPress: {},
  padPrev: {},
  padActive: {},
  anyKey: false,
  mouse: { x: 0, y: 0, clicked: false, down: false, moved: false },
  usingPad: false,

  init(canvas) {
    window.addEventListener('keydown', (e) => {
      const a = KEYMAP[e.code];
      if (a) e.preventDefault();
      if (e.repeat) return;
      this.codes.add(e.code);
      if (a) this._press(a);
      this.anyKey = true;
      this.usingPad = false;
      Snd.unlock();
    });
    window.addEventListener('keyup', (e) => { this.codes.delete(e.code); });
    window.addEventListener('blur', () => { this.codes.clear(); });
    const toLocal = (e) => {
      const r = canvas.getBoundingClientRect();
      this.mouse.x = ((e.clientX - r.left) / r.width) * W;
      this.mouse.y = ((e.clientY - r.top) / r.height) * H;
    };
    canvas.addEventListener('mousemove', (e) => { toLocal(e); this.mouse.moved = true; });
    canvas.addEventListener('mousedown', (e) => { toLocal(e); this.mouse.down = true; this.mouse.clicked = true; this.anyKey = true; Snd.unlock(); });
    window.addEventListener('mouseup', () => { this.mouse.down = false; });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  },
  _press(a) {
    this.pressed.add(a);
    this.lastPress[a] = performance.now();
  },
  down(a) {
    if (this.padActive[a]) return true;
    for (const c of this.codes) if (KEYMAP[c] === a) return true;
    return false;
  },
  hit(a) { return this.pressed.has(a); },
  buffered(a, ms = 160) { const t = this.lastPress[a]; return t !== undefined && performance.now() - t < ms; },
  consume(a) { this.lastPress[a] = -1e9; this.pressed.delete(a); },
  confirm() { return this.hit('confirm') || this.hit('attack') || this.hit('ult'); },
  back() { return this.hit('pause') || this.hit('back'); },
  pollPad() {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    const p = pads && (pads[0] || pads[1] || pads[2] || pads[3]);
    const st = {};
    if (p) {
      const b = (i) => p.buttons[i] && p.buttons[i].pressed;
      const ax = p.axes[0] || 0, ay = p.axes[1] || 0;
      st.jump = b(0); st.dash = b(1); st.attack = b(2); st.s1 = b(3);
      st.s2 = b(4); st.s3 = b(5); st.ult = b(6) || b(7);
      st.pause = b(9); st.bag = b(8);
      st.up = b(12) || ay < -0.55; st.down = b(13) || ay > 0.55;
      st.left = b(14) || ax < -0.4; st.right = b(15) || ax > 0.4;
      st.confirm = b(0);
    }
    for (const k in st) {
      if (st[k] && !this.padPrev[k]) { this._press(k); this.usingPad = true; this.anyKey = true; Snd.unlock(); }
    }
    this.padActive = st;
    this.padPrev = st;
  },
  endFrame() {
    this.pressed.clear();
    this.anyKey = false;
    this.mouse.clicked = false;
    this.mouse.moved = false;
  },
};

/* ---------- persistent save ---------- */
const Save = {
  KEY: 'zmxy6_save_v1',
  load() {
    try { const s = localStorage.getItem(this.KEY); return s ? JSON.parse(s) : null; } catch (e) { return null; }
  },
  write(data) {
    try { localStorage.setItem(this.KEY, JSON.stringify(data)); } catch (e) { /* ignore */ }
  },
  clear() { try { localStorage.removeItem(this.KEY); } catch (e) { /* ignore */ } },
};
