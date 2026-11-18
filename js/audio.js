'use strict';
/* ============================================================
 *  AUDIO  — fully synthesized SFX + generative 国风 music
 *  (Karplus–Strong 古筝, 笛 lead, taiko, gong, string pad)
 * ============================================================ */
const Snd = {
  ctx: null, master: null, sfxBus: null, musicBus: null, verb: null, verbSend: null, noiseBuf: null,
  settings: { master: 0.8, music: 0.55, sfx: 0.85, muted: false },
  last: {},

  unlock() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    let ctx;
    try { ctx = this.ctx = new AC(); } catch (e) { return; }
    this.master = ctx.createGain();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -12; comp.knee.value = 10; comp.ratio.value = 5;
    comp.attack.value = 0.003; comp.release.value = 0.25;
    this.master.connect(comp); comp.connect(ctx.destination);
    this.sfxBus = ctx.createGain(); this.sfxBus.connect(this.master);
    this.musicBus = ctx.createGain(); this.musicBus.connect(this.master);
    this.verb = ctx.createConvolver();
    this.verb.buffer = this.makeIR(3.2, 2.6);
    const vo = ctx.createGain(); vo.gain.value = 0.55;
    this.verb.connect(vo); vo.connect(this.master);
    this.verbSend = ctx.createGain(); this.verbSend.connect(this.verb);
    const n = ctx.sampleRate * 2;
    this.noiseBuf = ctx.createBuffer(1, n, ctx.sampleRate);
    const d = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    this.applyVolumes();
    if (Music.pending) { const p = Music.pending; Music.pending = null; Music.play(p); }
  },
  makeIR(dur, decay) {
    const sr = this.ctx.sampleRate, n = (sr * dur) | 0;
    const b = this.ctx.createBuffer(2, n, sr);
    for (let ch = 0; ch < 2; ch++) {
      const d = b.getChannelData(ch);
      for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, decay);
    }
    return b;
  },
  applyVolumes() {
    if (!this.ctx) return;
    const m = this.settings.muted ? 0 : this.settings.master;
    this.master.gain.setTargetAtTime(m, this.ctx.currentTime, 0.05);
    this.sfxBus.gain.value = this.settings.sfx;
    this.musicBus.gain.value = this.settings.music;
  },
  get ok() { return this.ctx && this.ctx.state === 'running'; },

  /* --- primitive voices --- */
  osc(type, f, t, dur, vol, o = {}) {
    const ctx = this.ctx;
    const os = ctx.createOscillator();
    const g = ctx.createGain();
    os.type = type;
    os.frequency.setValueAtTime(f, t);
    if (o.slide) os.frequency.exponentialRampToValueAtTime(Math.max(20, o.slide), t + (o.slideT || dur));
    if (o.detune) os.detune.value = o.detune;
    const a = o.attack || 0.004;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let node = os;
    if (o.filter) {
      const fl = ctx.createBiquadFilter();
      fl.type = o.filter; fl.frequency.value = o.ff || 1000; fl.Q.value = o.q || 1;
      if (o.ff2) fl.frequency.exponentialRampToValueAtTime(o.ff2, t + dur);
      os.connect(fl); node = fl;
    }
    node.connect(g);
    g.connect(o.bus || this.sfxBus);
    if (o.verb) { const s = ctx.createGain(); s.gain.value = o.verb; g.connect(s); s.connect(this.verbSend); }
    os.start(t); os.stop(t + dur + 0.05);
    return os;
  },
  noise(t, dur, vol, o = {}) {
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    src.playbackRate.value = o.rate || 1;
    const f = ctx.createBiquadFilter();
    f.type = o.type || 'bandpass';
    f.frequency.setValueAtTime(o.f || 1000, t);
    if (o.f2) f.frequency.exponentialRampToValueAtTime(o.f2, t + (o.fT || dur));
    f.Q.value = o.q || 1;
    const g = ctx.createGain();
    const a = o.attack || 0.002;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(o.bus || this.sfxBus);
    if (o.verb) { const s = ctx.createGain(); s.gain.value = o.verb; g.connect(s); s.connect(this.verbSend); }
    src.start(t, Math.random() * 1.5); src.stop(t + dur + 0.05);
  },

  play(name, o = {}) {
    if (!this.ok) return;
    const now = this.ctx.currentTime;
    const lim = this.last[name];
    if (lim !== undefined && now - lim < (o.gap || 0.035)) return;
    this.last[name] = now;
    const v = o.vol === undefined ? 1 : o.vol;
    const p = (o.pitch || 1) * (0.94 + Math.random() * 0.12);
    const t = now + 0.005;
    switch (name) {
      case 'swing':
        this.noise(t, 0.13, 0.22 * v, { type: 'bandpass', f: 620 * p, f2: 3100 * p, q: 1.8 });
        this.osc('triangle', 340 * p, t, 0.055, 0.07 * v, { slide: 130 * p });
        break;
      case 'swingHeavy':
        this.noise(t, 0.24, 0.34 * v, { type: 'bandpass', f: 280 * p, f2: 1750 * p, q: 1.3 });
        this.osc('triangle', 220 * p, t, 0.11, 0.14 * v, { slide: 70 * p });
        this.osc('sine', 135 * p, t, 0.22, 0.16 * v, { slide: 52 });
        break;
      case 'thrust':
        this.noise(t, 0.14, 0.28 * v, { type: 'bandpass', f: 1100 * p, f2: 4600 * p, q: 2.2 });
        this.osc('triangle', 680 * p, t, 0.08, 0.1 * v, { slide: 240 * p });
        break;
      case 'hit':
        this.osc('triangle', 320 * p, t, 0.032, 0.26 * v, { slide: 90 });
        this.osc('sine', 185 * p, t, 0.12, 0.45 * v, { slide: 46 });
        this.noise(t, 0.06, 0.3 * v, { type: 'bandpass', f: 2800 * p, q: 0.85 });
        this.noise(t, 0.035, 0.22 * v, { type: 'highpass', f: 5200 });
        break;
      case 'hitHeavy':
        this.osc('triangle', 240 * p, t, 0.045, 0.36 * v, { slide: 62 });
        this.osc('sine', 125 * p, t, 0.28, 0.78 * v, { slide: 30 });
        this.noise(t, 0.24, 0.48 * v, { type: 'lowpass', f: 2400, f2: 180, q: 0.7, verb: 0.24 });
        this.noise(t, 0.05, 0.32 * v, { type: 'highpass', f: 4200 });
        break;
      case 'crit':
        this.osc('triangle', 300 * p, t, 0.045, 0.32 * v, { slide: 80 });
        this.osc('sine', 145 * p, t, 0.24, 0.7 * v, { slide: 36 });
        this.osc('triangle', 1750 * p, t, 0.13, 0.09 * v, { slide: 1150, verb: 0.22 });
        this.osc('triangle', 2600 * p, t, 0.1, 0.05 * v, { verb: 0.2 });
        this.noise(t, 0.1, 0.36 * v, { type: 'bandpass', f: 3500, q: 0.7 });
        break;
      case 'jump':
        this.noise(t, 0.09, 0.08 * v, { type: 'highpass', f: 2500 });
        this.osc('sine', 260 * p, t, 0.1, 0.06 * v, { slide: 520 });
        break;
      case 'land':
        this.noise(t, 0.1, 0.14 * v, { type: 'lowpass', f: 500 });
        break;
      case 'dash':
        this.noise(t, 0.28, 0.3 * v, { type: 'bandpass', f: 300 * p, f2: 3200 * p, q: 2, attack: 0.03 });
        break;
      case 'cast':
        this.osc('triangle', 420 * p, t, 0.35, 0.12 * v, { slide: 1260 * p, verb: 0.5 });
        this.osc('sine', 840 * p, t + 0.05, 0.4, 0.07 * v, { slide: 1680 * p, verb: 0.5 });
        this.noise(t, 0.3, 0.12 * v, { type: 'bandpass', f: 1500, f2: 6000, q: 3, attack: 0.05 });
        break;
      case 'fire':
        this.noise(t, 0.55, 0.35 * v, { type: 'lowpass', f: 1400 * p, f2: 300, q: 0.8, attack: 0.02 });
        this.noise(t, 0.4, 0.12 * v, { type: 'bandpass', f: 3000, q: 4, rate: 0.6 });
        break;
      case 'boom':
        this.osc('sine', 95 * p, t, 0.8, 1.0 * v, { slide: 26 });
        this.noise(t, 0.9, 0.7 * v, { type: 'lowpass', f: 1600, f2: 90, q: 0.6, verb: 0.45 });
        break;
      case 'thunder':
        this.noise(t, 0.12, 0.6 * v, { type: 'highpass', f: 3000 });
        this.noise(t + 0.03, 1.1, 0.6 * v, { type: 'lowpass', f: 2600, f2: 120, q: 0.5, verb: 0.6 });
        this.osc('sawtooth', 70, t, 0.5, 0.2 * v, { slide: 30, filter: 'lowpass', ff: 400 });
        break;
      case 'water':
        this.noise(t, 0.45, 0.3 * v, { type: 'bandpass', f: 420 * p, f2: 1800 * p, q: 3, attack: 0.02 });
        this.noise(t + 0.1, 0.4, 0.18 * v, { type: 'bandpass', f: 1200 * p, f2: 500, q: 5 });
        break;
      case 'ice':
        this.osc('triangle', 2200 * p, t, 0.25, 0.08 * v, { slide: 3300 * p, verb: 0.4 });
        this.osc('sine', 3300 * p, t + 0.04, 0.3, 0.05 * v, { verb: 0.4 });
        this.noise(t, 0.18, 0.25 * v, { type: 'highpass', f: 4500 });
        break;
      case 'pickup':
        this.osc('triangle', 990 * p, t, 0.09, 0.09 * v);
        this.osc('triangle', 1485 * p, t + 0.06, 0.14, 0.08 * v, { verb: 0.2 });
        break;
      case 'coin':
        this.osc('square', 1560 * p, t, 0.05, 0.035 * v, { filter: 'lowpass', ff: 5000 });
        this.osc('square', 2340 * p, t + 0.045, 0.1, 0.03 * v, { filter: 'lowpass', ff: 5000 });
        break;
      case 'loot': {
        const ns = [0, 4, 7, 12, 16];
        ns.forEach((n, i) => this.osc('triangle', 660 * Math.pow(2, n / 12), t + i * 0.06, 0.5, 0.07 * v, { verb: 0.6 }));
        break;
      }
      case 'levelup': {
        const ns = [0, 2, 4, 7, 9, 12, 16, 19];
        ns.forEach((n, i) => { Music.pluck(62 + n, t + i * 0.055, 0.35 * v, this.sfxBus, 0.5); });
        this.osc('sine', 1046, t + 0.4, 1.2, 0.06 * v, { verb: 0.8 });
        break;
      }
      case 'ui':
        this.osc('triangle', 720, t, 0.06, 0.07 * v);
        break;
      case 'uiok':
        Music.pluck(74, t, 0.3 * v, this.sfxBus, 0.3); Music.pluck(81, t + 0.05, 0.25 * v, this.sfxBus, 0.3);
        break;
      case 'uiback':
        this.osc('triangle', 520, t, 0.08, 0.07 * v, { slide: 360 });
        break;
      case 'roar':
        this.osc('sawtooth', 72 * p, t, 1.3, 0.35 * v, { slide: 48, filter: 'lowpass', ff: 300, ff2: 1200, detune: 8 });
        this.osc('sawtooth', 75 * p, t, 1.3, 0.3 * v, { slide: 46, filter: 'lowpass', ff: 300, ff2: 1000, detune: -12 });
        this.noise(t, 1.2, 0.3 * v, { type: 'bandpass', f: 300, f2: 900, q: 1.2, attack: 0.15, verb: 0.4 });
        break;
      case 'gong': {
        const base = 98 * p;
        [1, 1.48, 2.11, 2.63, 3.27, 4.1].forEach((m, i) => this.osc('sine', base * m, t, 3.5 - i * 0.4, (0.22 / (i + 1)) * v, { attack: 0.01, verb: 0.6 }));
        this.noise(t, 0.3, 0.15 * v, { type: 'lowpass', f: 900 });
        break;
      }
      case 'ult':
        this.play('gong', { vol: v * 0.9 });
        this.noise(t, 0.9, 0.35 * v, { type: 'bandpass', f: 200, f2: 5000, q: 2, attack: 0.6, verb: 0.5 });
        break;
      case 'hurt':
        this.osc('square', 220 * p, t, 0.12, 0.09 * v, { slide: 110, filter: 'lowpass', ff: 1500 });
        this.noise(t, 0.1, 0.25 * v, { type: 'bandpass', f: 900, q: 1 });
        break;
      case 'die':
        this.noise(t, 0.35, 0.28 * v, { type: 'bandpass', f: 1400 * p, f2: 200, q: 1.2 });
        this.osc('sine', 260 * p, t, 0.3, 0.2 * v, { slide: 50 });
        break;
      case 'spawn':
        this.noise(t, 0.6, 0.18 * v, { type: 'bandpass', f: 200, f2: 2000, q: 4, attack: 0.45, verb: 0.4 });
        break;
      case 'shield':
        this.osc('triangle', 520 * p, t, 0.5, 0.1 * v, { verb: 0.5 });
        this.osc('triangle', 780 * p, t + 0.03, 0.5, 0.08 * v, { verb: 0.5 });
        break;
      case 'laser':
        this.osc('sawtooth', 1400 * p, t, 0.7, 0.09 * v, { slide: 180, filter: 'bandpass', ff: 1800, q: 3 });
        this.noise(t, 0.7, 0.15 * v, { type: 'bandpass', f: 4000, f2: 600, q: 2 });
        break;
      case 'warn':
        this.osc('sine', 980, t, 0.08, 0.08 * v);
        this.osc('sine', 980, t + 0.12, 0.08, 0.08 * v);
        break;
      case 'heal':
        [0, 4, 7, 11].forEach((n, i) => this.osc('sine', 523 * Math.pow(2, n / 12), t + i * 0.07, 0.6, 0.06 * v, { verb: 0.7 }));
        break;
      case 'bell':
        Music.pluck(86, t, 0.4 * v, this.sfxBus, 0.8);
        break;
      default:
        break;
    }
  },
};

/* ============================================================
 *  MUSIC — generative pentatonic sequencer
 * ============================================================ */
const MODES = {
  gong: [0, 2, 4, 7, 9], shang: [0, 2, 5, 7, 10], jue: [0, 3, 5, 8, 10],
  zhi: [0, 2, 5, 7, 9], yu: [0, 3, 5, 7, 10],
};
const TRACKS = {
  title:  { bpm: 70,  root: 50, mode: 'yu',   lead: 'pluck', alt: 'dizi', drums: 'sparse', pad: 0.6, bass: 0.6, seed: 11 },
  map:    { bpm: 84,  root: 55, mode: 'gong', lead: 'dizi',  alt: 'pluck', drums: 'light', pad: 0.5, bass: 0.6, seed: 23 },
  s1:     { bpm: 112, root: 52, mode: 'zhi',  lead: 'pluck', alt: 'dizi', drums: 'mid', pad: 0.45, bass: 0.8, seed: 37 },
  s2:     { bpm: 96,  root: 50, mode: 'yu',   lead: 'dizi',  alt: 'pluck', drums: 'light', pad: 0.6, bass: 0.7, seed: 41 },
  s3:     { bpm: 128, root: 48, mode: 'jue',  lead: 'pluck', alt: 'pluck', drums: 'heavy', pad: 0.4, bass: 0.9, seed: 53 },
  s4:     { bpm: 108, root: 57, mode: 'gong', lead: 'pluck', alt: 'dizi', drums: 'mid', pad: 0.55, bass: 0.7, seed: 67 },
  s5:     { bpm: 100, root: 46, mode: 'yu',   lead: 'dizi',  alt: 'pluck', drums: 'mid', pad: 0.8, bass: 0.8, seed: 79, eerie: true },
  boss:   { bpm: 150, root: 45, mode: 'yu',   lead: 'pluck', alt: 'dizi', drums: 'boss', pad: 0.5, bass: 1, seed: 97, ostinato: true },
  final:  { bpm: 160, root: 44, mode: 'shang', lead: 'pluck', alt: 'dizi', drums: 'boss', pad: 0.8, bass: 1, seed: 113, ostinato: true, eerie: true },
  ending: { bpm: 68,  root: 53, mode: 'gong', lead: 'dizi',  alt: 'pluck', drums: 'sparse', pad: 0.7, bass: 0.5, seed: 131 },
};
const DRUMS = {
  sparse: { k: [0], t: [], h: [], gongEvery: 8 },
  light:  { k: [0, 10], t: [8], h: [4, 12], gongEvery: 16 },
  mid:    { k: [0, 6, 10], t: [4, 12, 14], h: [2, 6, 10, 14], gongEvery: 16 },
  heavy:  { k: [0, 3, 6, 10, 11], t: [4, 12, 13, 14], h: [2, 6, 8, 10, 14], gongEvery: 8 },
  boss:   { k: [0, 3, 6, 8, 10, 11, 14], t: [4, 12, 13, 15], h: [0, 2, 4, 6, 8, 10, 12, 14], gongEvery: 8 },
};
const RHYTHMS = [
  [[0, 4], [4, 2], [6, 2], [8, 6], [14, 2], [16, 4], [20, 4], [24, 8]],
  [[0, 3], [3, 1], [4, 4], [8, 2], [10, 2], [12, 4], [16, 6], [22, 2], [24, 4], [28, 4]],
  [[0, 2], [2, 2], [4, 2], [6, 2], [8, 8], [16, 2], [18, 2], [20, 4], [24, 8]],
  [[0, 6], [6, 2], [8, 4], [12, 4], [16, 3], [19, 1], [20, 4], [24, 8]],
  [[0, 4], [4, 4], [8, 2], [10, 1], [11, 1], [12, 4], [16, 8], [24, 4], [28, 4]],
];

const Music = {
  cur: null, curName: null, pending: null, gain: null, timer: null,
  step: 0, next: 0, phrases: null, rng: null, plucks: {}, intensity: 1,

  midiF(m) { return 440 * Math.pow(2, (m - 69) / 12); },
  pluckBuf(m) {
    if (this.plucks[m]) return this.plucks[m];
    const ctx = Snd.ctx, sr = ctx.sampleRate;
    const f = this.midiF(m);
    const dur = clamp(3.2 - (m - 40) * 0.03, 1.2, 3.2);
    const N = (sr * dur) | 0;
    const buf = ctx.createBuffer(1, N, sr);
    const d = buf.getChannelData(0);
    const p = Math.max(2, Math.round(sr / f));
    const ring = new Float32Array(p);
    let prev = 0;
    for (let i = 0; i < p; i++) { const r = Math.random() * 2 - 1; prev = prev * 0.35 + r * 0.65; ring[i] = prev; }
    let idx = 0;
    const decay = 0.9965 + clamp((60 - m) * 0.00004, -0.001, 0.0012);
    for (let i = 0; i < N; i++) {
      const a = ring[idx], b = ring[(idx + 1) % p];
      ring[idx] = (a + b) * 0.5 * decay;
      d[i] = a * (i < 40 ? i / 40 : 1);
      idx = (idx + 1) % p;
    }
    return (this.plucks[m] = buf);
  },
  pluck(m, t, vol, bus, verb = 0.25, bend = 0) {
    if (!Snd.ctx) return;
    const ctx = Snd.ctx;
    const src = ctx.createBufferSource();
    src.buffer = this.pluckBuf(Math.round(m));
    if (bend) {
      src.playbackRate.setValueAtTime(1, t + 0.12);
      src.playbackRate.linearRampToValueAtTime(Math.pow(2, bend / 12), t + 0.32);
    }
    const g = ctx.createGain(); g.gain.value = vol;
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 4200;
    src.connect(f); f.connect(g); g.connect(bus || this.gain || Snd.musicBus);
    if (verb) { const s = ctx.createGain(); s.gain.value = verb; g.connect(s); s.connect(Snd.verbSend); }
    src.start(t); src.stop(t + 3.3);
  },
  dizi(m, t, dur, vol) {
    const ctx = Snd.ctx;
    const o = ctx.createOscillator(); o.type = 'triangle';
    const o2 = ctx.createOscillator(); o2.type = 'sine';
    const f = this.midiF(m);
    o.frequency.setValueAtTime(f * 0.985, t); o.frequency.linearRampToValueAtTime(f, t + 0.06);
    o2.frequency.setValueAtTime(f * 2, t);
    const lfo = ctx.createOscillator(); lfo.frequency.value = 5.2;
    const lg = ctx.createGain(); lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(f * 0.012, t + Math.min(dur, 0.5));
    lfo.connect(lg); lg.connect(o.frequency);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.05);
    g.gain.setValueAtTime(vol, t + Math.max(0.06, dur - 0.08));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.12);
    const g2 = ctx.createGain(); g2.gain.value = 0.18;
    o.connect(g); o2.connect(g2); g2.connect(g);
    g.connect(this.gain);
    const s = ctx.createGain(); s.gain.value = 0.45; g.connect(s); s.connect(Snd.verbSend);
    // breath
    const nb = ctx.createBufferSource(); nb.buffer = Snd.noiseBuf;
    const nf = ctx.createBiquadFilter(); nf.type = 'bandpass'; nf.frequency.value = f * 2; nf.Q.value = 6;
    const ng = ctx.createGain(); ng.gain.setValueAtTime(vol * 0.5, t); ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
    nb.connect(nf); nf.connect(ng); ng.connect(this.gain);
    [o, o2, lfo].forEach((x) => { x.start(t); x.stop(t + dur + 0.2); });
    nb.start(t, Math.random()); nb.stop(t + 0.2);
  },
  pad(notes, t, dur, vol, eerie) {
    const ctx = Snd.ctx;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + dur * 0.35);
    g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.6);
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = eerie ? 700 : 950; f.Q.value = 0.7;
    g.connect(f); f.connect(this.gain);
    const s = ctx.createGain(); s.gain.value = 0.6; f.connect(s); s.connect(Snd.verbSend);
    notes.forEach((m) => {
      [-7, 7].forEach((dt) => {
        const o = ctx.createOscillator(); o.type = 'sawtooth';
        o.frequency.value = this.midiF(m); o.detune.value = dt + (eerie ? (Math.random() - 0.5) * 30 : 0);
        const og = ctx.createGain(); og.gain.value = 0.25 / notes.length;
        o.connect(og); og.connect(g); o.start(t); o.stop(t + dur + 0.7);
      });
    });
  },
  drum(kind, t, vol) {
    const ctx = Snd.ctx, bus = this.gain;
    if (kind === 'k') {
      const o = ctx.createOscillator(); o.type = 'sine';
      o.frequency.setValueAtTime(95, t); o.frequency.exponentialRampToValueAtTime(38, t + 0.35);
      const g = ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
      o.connect(g); g.connect(bus); o.start(t); o.stop(t + 0.55);
      Snd.noise(t, 0.12, vol * 0.3, { type: 'lowpass', f: 700, bus });
    } else if (kind === 't') {
      const o = ctx.createOscillator(); o.type = 'sine';
      o.frequency.setValueAtTime(240, t); o.frequency.exponentialRampToValueAtTime(140, t + 0.18);
      const g = ctx.createGain(); g.gain.setValueAtTime(vol * 0.6, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
      o.connect(g); g.connect(bus); o.start(t); o.stop(t + 0.25);
      Snd.noise(t, 0.08, vol * 0.35, { type: 'bandpass', f: 1800, q: 1, bus });
    } else if (kind === 'h') {
      Snd.noise(t, 0.04, vol * 0.18, { type: 'highpass', f: 7000, bus });
    }
  },

  makePhrase(rng, tr, variant) {
    const r = RHYTHMS[(rng() * RHYTHMS.length) | 0];
    let deg = 5 + ((rng() * 5) | 0);
    const notes = [];
    for (let i = 0; i < r.length; i++) {
      const [st, len] = r[i];
      const last = i === r.length - 1;
      if (last) deg = rng() < 0.5 ? 5 : 10;
      else {
        const stepv = [-2, -1, -1, 1, 1, 2, 0, 3, -3][(rng() * 9) | 0];
        deg = clamp(deg + stepv, 3, 13);
      }
      notes.push({ st, len, deg, bend: rng() < 0.12 && len >= 4 ? (rng() < 0.5 ? 2 : 1) : 0 });
    }
    if (variant && notes.length > 2) notes[notes.length - 2].deg = clamp(notes[notes.length - 2].deg + 2, 3, 13);
    return notes;
  },
  degToMidi(deg, tr, octShift = 12) {
    const sc = MODES[tr.mode];
    const o = Math.floor(deg / 5);
    return tr.root + octShift + sc[((deg % 5) + 5) % 5] + 12 * o - 12;
  },

  play(name) {
    if (!Snd.ctx) { this.pending = name; return; }
    if (this.curName === name) return;
    const ctx = Snd.ctx;
    if (this.gain) {
      const old = this.gain;
      old.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.4);
      setTimeout(() => { try { old.disconnect(); } catch (e) { /* */ } }, 2500);
    }
    this.curName = name;
    this.cur = TRACKS[name];
    if (!this.cur) { this.gain = null; return; }
    this.gain = ctx.createGain();
    this.gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    this.gain.gain.linearRampToValueAtTime(0.55, ctx.currentTime + 1.2);
    this.gain.connect(Snd.musicBus);
    this.rng = mulberry32(this.cur.seed);
    this.phrases = [this.makePhrase(this.rng, this.cur), null, this.makePhrase(this.rng, this.cur)];
    this.phrases[1] = this.phrases[0].map((n) => ({ ...n }));
    if (this.phrases[1].length > 2) this.phrases[1][this.phrases[1].length - 1].deg = 7;
    this.step = 0;
    this.next = ctx.currentTime + 0.15;
    if (!this.timer) this.timer = setInterval(() => this.tick(), 25);
  },
  stop() {
    if (!Snd.ctx || !this.gain) { this.curName = null; return; }
    this.gain.gain.setTargetAtTime(0.0001, Snd.ctx.currentTime, 0.3);
    this.curName = null; this.cur = null;
  },
  tick() {
    if (!Snd.ok || !this.cur) return;
    const ctx = Snd.ctx;
    if (this.next < ctx.currentTime - 0.5) this.next = ctx.currentTime + 0.05;
    while (this.next < ctx.currentTime + 0.18) {
      this.playStep(this.step, this.next);
      this.next += 60 / this.cur.bpm / 4;
      this.step++;
    }
  },
  playStep(step, t) {
    const tr = this.cur;
    const s16 = 60 / tr.bpm / 4;
    const barStep = step % 16;
    const bar = Math.floor(step / 16);
    const sec = Math.floor(bar / 2) % 8; // 2-bar sections, 16-bar song form
    const form = [0, 1, 2, 1, 0, 1, -1, 2][sec];
    const phraseStep = step % 32;
    // regenerate B phrase every cycle for variation
    if (step % 256 === 0 && step > 0) this.phrases[2] = this.makePhrase(this.rng, tr, true);
    // --- melody ---
    if (form >= 0) {
      const ph = this.phrases[form];
      const instr = form === 2 ? tr.alt : tr.lead;
      for (const n of ph) {
        if (n.st === phraseStep) {
          const m = this.degToMidi(n.deg, tr, 24);
          if (instr === 'dizi') this.dizi(m, t, n.len * s16 * 0.95, 0.09);
          else {
            this.pluck(m, t, 0.32, null, 0.3, n.bend);
            if (n.len >= 6) this.pluck(m - 12, t + s16 * 0.5, 0.12, null, 0.3);
          }
        }
      }
    } else if (phraseStep === 0) {
      // 刮奏 glissando into break
      for (let i = 0; i < 10; i++) this.pluck(this.degToMidi(3 + i, tr, 24), t + i * s16 * 0.35, 0.16, null, 0.4);
    }
    // --- ostinato (boss) ---
    if (tr.ostinato) {
      const pat = [0, 2, 4, 2, 5, 4, 2, 1];
      const d = pat[step % 8] + (bar % 4 === 3 ? 1 : 0);
      this.pluck(this.degToMidi(d, tr, 12), t, 0.16, null, 0.1);
    }
    // --- bass ---
    if (barStep === 0 || (barStep === 8 && tr.bass > 0.7) || (tr.ostinato && barStep % 4 === 0)) {
      const deg = bar % 4 === 2 ? 3 : bar % 4 === 3 ? 4 : 0;
      this.pluck(this.degToMidi(deg, tr, 0), t, 0.42 * tr.bass, null, 0.1);
    }
    // --- pad ---
    if (step % 32 === 0 && tr.pad > 0) {
      const chordSet = [[0, 2, 5], [3, 5, 8], [1, 4, 6], [0, 3, 5]];
      const ch = chordSet[(bar / 2) % 4 | 0].map((d) => this.degToMidi(d, tr, 12));
      this.pad(ch, t, s16 * 32, 0.05 * tr.pad, tr.eerie);
    }
    // --- drums ---
    const dr = DRUMS[tr.drums];
    if (dr && form !== -1) {
      if (dr.k.includes(barStep)) this.drum('k', t, 0.55 * this.intensity);
      if (dr.t.includes(barStep)) this.drum('t', t, 0.4 * this.intensity);
      if (dr.h.includes(barStep)) this.drum('h', t, 0.4);
    }
    if (dr && step % (16 * dr.gongEvery) === 0) {
      const base = this.midiF(tr.root - 12);
      [1, 1.48, 2.11, 2.63, 3.27].forEach((m, i) => {
        const ctx = Snd.ctx;
        const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = base * m;
        const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.12 / (i + 1), t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 4 - i * 0.5);
        o.connect(g); g.connect(this.gain);
        const s = ctx.createGain(); s.gain.value = 0.5; g.connect(s); s.connect(Snd.verbSend);
        o.start(t); o.stop(t + 4.2);
      });
    }
  },
};
