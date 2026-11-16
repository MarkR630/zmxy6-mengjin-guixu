'use strict';
/* ============================================================
 *  BACKGROUNDS — procedural 水墨 parallax worlds
 * ============================================================ */
const THEMES = {
  ember: {
    name: '花果山·烬',
    sky: ['#12060c', '#3e1018', '#a3361f', '#f29a4a'],
    stars: 0,
    sun: { x: 0.66, y: 0.46, r: 96, color: '#ffd9a0', halo: '#ff6a2a', type: 'sun' },
    layers: [
      { par: 0.06, base: 0.6, amp: 0.3, color: '#7a2c26', fog: '#e07a48', peaks: 16, style: 'karst' },
      { par: 0.14, base: 0.66, amp: 0.3, color: '#521a1c', fog: '#b4502e', peaks: 11, style: 'karst', decor: 'pagoda' },
      { par: 0.28, base: 0.74, amp: 0.26, color: '#2e0e12', fog: '#78281e', peaks: 9, style: 'karst', decor: 'pines' },
      { par: 0.5, base: 0.84, amp: 0.14, color: '#170708', fog: '#3e1410', peaks: 14, style: 'hills', decor: 'deadtrees' },
    ],
    ground: { top: '#1c0d0a', bottom: '#060203', edge: '#ff9a5a', detail: 'grass', detailColor: '#120706' },
    weather: 'embers', rim: '#ffab6a', grade: '#ff5a1a', gradeA: 0.08, props: ['rays', 'waterfall', 'mist'],
    mist: '#f08a50', platform: 'rock',
  },
  river: {
    name: '流沙河·渊',
    sky: ['#02060c', '#0a1a28', '#18404c', '#4e8a88'],
    stars: 160,
    sun: { x: 0.3, y: 0.3, r: 70, color: '#f2fbf6', halo: '#6ad6d0', type: 'moon' },
    layers: [
      { par: 0.06, base: 0.62, amp: 0.22, color: '#1e4a52', fog: '#4c8c8a', peaks: 12, style: 'dunes' },
      { par: 0.14, base: 0.68, amp: 0.2, color: '#123640', fog: '#336e70', peaks: 10, style: 'karst' },
      { par: 0.28, base: 0.76, amp: 0.2, color: '#08222a', fog: '#1e4c50', peaks: 8, style: 'karst', decor: 'bones' },
      { par: 0.5, base: 0.86, amp: 0.1, color: '#04121a', fog: '#0e2c30', peaks: 10, style: 'dunes', decor: 'reeds' },
    ],
    ground: { top: '#0c1c1e', bottom: '#020607', edge: '#8ae6dc', detail: 'reeds', detailColor: '#061012' },
    weather: 'spirits', rim: '#9af0ea', grade: '#20a0a0', gradeA: 0.07, props: ['water', 'mist'],
    mist: '#5aa8a4', platform: 'bone',
  },
  flame: {
    name: '火焰山·劫',
    sky: ['#070103', '#2a0506', '#6e120a', '#e24a12'],
    stars: 0,
    sun: { x: 0.5, y: 0.9, r: 0, color: '#ff8a30', halo: '#ff3a10', type: 'none' },
    layers: [
      { par: 0.06, base: 0.62, amp: 0.34, color: '#5a1410', fog: '#d8461a', peaks: 9, style: 'volcano' },
      { par: 0.14, base: 0.7, amp: 0.3, color: '#380a0a', fog: '#a42c12', peaks: 10, style: 'karst' },
      { par: 0.28, base: 0.78, amp: 0.22, color: '#1e0506', fog: '#6a1a0c', peaks: 9, style: 'jagged', decor: 'deadtrees' },
      { par: 0.5, base: 0.88, amp: 0.12, color: '#0e0203', fog: '#3a0c06', peaks: 12, style: 'jagged' },
    ],
    ground: { top: '#140606', bottom: '#030101', edge: '#ff6a2a', detail: 'cracks', detailColor: '#0a0202' },
    weather: 'fire', rim: '#ff7a3a', grade: '#ff2a00', gradeA: 0.1, props: ['lava', 'mist'],
    mist: '#ff5a20', platform: 'basalt',
  },
  heaven: {
    name: '天宫·碎',
    sky: ['#120e2e', '#3a2c66', '#a77aa4', '#ffdcae'],
    stars: 60,
    sun: { x: 0.72, y: 0.36, r: 80, color: '#fffbe8', halo: '#ffd27a', type: 'sun' },
    layers: [
      { par: 0.06, base: 0.7, amp: 0.2, color: '#8a6a9a', fog: '#f0c8b8', peaks: 7, style: 'islands' },
      { par: 0.14, base: 0.72, amp: 0.22, color: '#5a4478', fog: '#c89aa8', peaks: 6, style: 'islands', decor: 'palace' },
      { par: 0.28, base: 0.8, amp: 0.2, color: '#2c2048', fog: '#7a5a80', peaks: 5, style: 'islands', decor: 'pillars' },
      { par: 0.5, base: 0.9, amp: 0.08, color: '#140e24', fog: '#3a2a48', peaks: 8, style: 'clouds' },
    ],
    ground: { top: '#1a1428', bottom: '#06040c', edge: '#ffe2a0', detail: 'marble', detailColor: '#0c0814' },
    weather: 'motes', rim: '#ffe6a6', grade: '#ffc070', gradeA: 0.07, props: ['rays', 'clouds', 'mist'],
    mist: '#ffd8c0', platform: 'cloud', reflect: true,
  },
  void: {
    name: '归墟',
    sky: ['#010005', '#07031a', '#170a34', '#3a0f4e'],
    stars: 260,
    sun: { x: 0.5, y: 0.36, r: 120, color: '#e8c0ff', halo: '#9a40ff', type: 'vortex' },
    layers: [
      { par: 0.06, base: 0.66, amp: 0.2, color: '#22103e', fog: '#5a2a7a', peaks: 10, style: 'shards' },
      { par: 0.14, base: 0.72, amp: 0.22, color: '#160a2c', fog: '#3e1a5a', peaks: 9, style: 'shards' },
      { par: 0.28, base: 0.8, amp: 0.2, color: '#0c0618', fog: '#24103a', peaks: 8, style: 'shards' },
      { par: 0.5, base: 0.9, amp: 0.08, color: '#05020c', fog: '#140822', peaks: 8, style: 'jagged' },
    ],
    ground: { top: '#0c0716', bottom: '#020104', edge: '#c890ff', detail: 'crystal', detailColor: '#06030c' },
    weather: 'void', rim: '#d0a0ff', grade: '#7a30ff', gradeA: 0.1, props: ['mist'],
    mist: '#8a50c0', platform: 'crystal', reflect: true,
  },
};

const LW = 2400; // layer tile width

class Background {
  constructor(themeKey, seed = 7) {
    this.key = themeKey;
    this.th = THEMES[themeKey];
    this.rng = mulberry32(seed);
    this.t = 0;
    this.weather = [];
    this.build();
    for (let i = 0; i < 90; i++) this.spawnWeather(true);
  }
  r(a, b) { return a === undefined ? this.rng() : (b === undefined ? this.rng() * a : a + this.rng() * (b - a)); }

  build() {
    const th = this.th;
    // ---- sky ----
    this.sky = makeCanvas(W, H);
    const g = this.sky.getContext('2d');
    const gr = g.createLinearGradient(0, 0, 0, H);
    gr.addColorStop(0, th.sky[0]); gr.addColorStop(0.35, th.sky[1]); gr.addColorStop(0.7, th.sky[2]); gr.addColorStop(1, th.sky[3]);
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    for (let i = 0; i < th.stars; i++) {
      const x = this.r(W), y = this.r(H * 0.65), s = this.r(0.4, 1.6);
      g.fillStyle = rgba('#ffffff', this.r(0.2, 0.9) * (1 - y / (H * 0.7)));
      g.fillRect(x, y, s, s);
    }
    // soft cloud streaks
    for (let i = 0; i < 9; i++) {
      const y = this.r(H * 0.1, H * 0.6), x = this.r(W), w = this.r(300, 800), h = this.r(8, 26);
      const cg = g.createRadialGradient(x, y, 0, x, y, w / 2);
      cg.addColorStop(0, rgba(th.sky[3], 0.18)); cg.addColorStop(1, rgba(th.sky[3], 0));
      g.save(); g.translate(x, y); g.scale(1, h / w); g.translate(-x, -y);
      g.fillStyle = cg; g.beginPath(); g.arc(x, y, w / 2, 0, TAU); g.fill(); g.restore();
    }
    // ---- mountain layers ----
    this.layers = th.layers.map((L, i) => ({ ...L, canvas: this.buildLayer(L, i) }));
    // ---- ground detail strip ----
    this.gstrip = this.buildGroundStrip();
    this.fg = this.buildForeground();
  }

  profileFn(L) {
    const peaks = [];
    const n = L.peaks;
    for (let i = 0; i < n; i++) {
      peaks.push({ x: (i + this.r(-0.35, 0.35)) * (LW / n), w: this.r(70, 220) * (L.style === 'karst' ? 0.75 : 1.3), h: this.r(0.35, 1) });
    }
    const ph = [this.r(TAU), this.r(TAU), this.r(TAU), this.r(TAU)];
    const style = L.style;
    const rough = (x) => Math.sin((x / LW) * TAU * 37 + ph[0]) * 0.012 + Math.sin((x / LW) * TAU * 91 + ph[1]) * 0.006;
    return (x) => {
      let v = 0;
      if (style === 'hills' || style === 'dunes' || style === 'clouds') {
        v = 0.45 + 0.25 * Math.sin((x / LW) * TAU * 3 + ph[0]) + 0.15 * Math.sin((x / LW) * TAU * 7 + ph[1]) + 0.08 * Math.sin((x / LW) * TAU * 13 + ph[2]);
        if (style === 'clouds') v += 0.06 * Math.abs(Math.sin((x / LW) * TAU * 29 + ph[3]));
        return v + (style === 'dunes' ? 0 : rough(x));
      }
      for (const p of peaks) {
        let d = Math.abs(x - p.x) % LW;
        d = Math.min(d, LW - d) / p.w;
        if (d >= 0 && d < 1) {
          let s;
          if (style === 'karst') s = Math.pow(Math.max(0, Math.cos((d * PI) / 2)), 0.55);
          else if (style === 'volcano') s = d < 0.12 ? 0.92 + d * 0.3 : 1 - Math.pow(Math.max(0, d), 0.8) * 0.95;
          else s = 1 - d; // jagged / shards
          v = Math.max(v, p.h * s);
        }
      }
      v = Math.max(v, 0.12 + 0.06 * Math.sin((x / LW) * TAU * 4 + ph[2]));
      return v + rough(x) * (style === 'jagged' || style === 'shards' ? 3 : 1);
    };
  }

  buildLayer(L, idx) {
    const c = makeCanvas(LW, H);
    const g = c.getContext('2d');
    const th = this.th;
    const top = H * (L.base - L.amp);
    const fogGrad = () => {
      const gr = g.createLinearGradient(0, top, 0, H * Math.min(1, L.base + 0.1));
      gr.addColorStop(0, L.color);
      gr.addColorStop(0.55, mix(L.color, L.fog, 0.45));
      gr.addColorStop(1, L.fog);
      return gr;
    };
    if (L.style === 'islands') {
      this.drawIslands(g, L, fogGrad());
    } else if (L.style === 'shards') {
      this.drawShards(g, L, fogGrad(), idx);
    } else {
      const prof = this.profileFn(L);
      const pts = [];
      for (let x = 0; x <= LW; x += 4) pts.push([x, H * L.base - prof(x) * L.amp * H]);
      g.beginPath();
      g.moveTo(0, H);
      for (const [x, y] of pts) g.lineTo(x, y);
      g.lineTo(LW, H);
      g.closePath();
      g.fillStyle = fogGrad();
      g.fill();
      // ink texture strokes (皴法)
      g.save(); g.clip();
      for (let i = 0; i < 120; i++) {
        const x = this.r(LW), p = pts[Math.min(pts.length - 1, (x / 4) | 0)];
        const y0 = p[1] + this.r(4, 60), len = this.r(20, 90);
        g.strokeStyle = rgba(idx < 2 ? '#000000' : '#000000', this.r(0.04, 0.12));
        g.lineWidth = this.r(1, 3);
        g.beginPath(); g.moveTo(x, y0); g.quadraticCurveTo(x + this.r(-10, 10), y0 + len / 2, x + this.r(-20, 20), y0 + len); g.stroke();
      }
      g.restore();
      // rim light along ridge
      g.strokeStyle = rgba(th.rim, 0.18 + idx * 0.04);
      g.lineWidth = 1.5;
      g.beginPath();
      pts.forEach(([x, y], i) => (i ? g.lineTo(x, y + 1) : g.moveTo(x, y + 1)));
      g.stroke();
      // decor
      if (L.decor) this.decorate(g, L, pts, idx);
    }
    // mist at base
    const mg = g.createLinearGradient(0, H * (L.base - 0.06), 0, H * (L.base + 0.12));
    mg.addColorStop(0, rgba(L.fog, 0));
    mg.addColorStop(1, rgba(L.fog, 0.85));
    g.fillStyle = mg;
    g.globalCompositeOperation = 'source-atop';
    g.fillRect(0, H * (L.base - 0.06), LW, H);
    g.globalCompositeOperation = 'source-over';
    return c;
  }

  drawIslands(g, L, fill) {
    const n = L.peaks;
    g.fillStyle = fill;
    for (let i = 0; i < n; i++) {
      const cx = (i + this.r(0.1, 0.9)) * (LW / n);
      const w = this.r(180, 380) * (1 - L.par);
      const ty = H * (L.base - L.amp) + this.r(0, L.amp * H * 0.8);
      const depth = w * this.r(0.45, 0.8);
      const draw = (ox) => {
        g.beginPath();
        g.moveTo(ox + cx - w / 2, ty);
        const seg = 10;
        for (let s = 1; s <= seg; s++) g.lineTo(ox + cx - w / 2 + (w * s) / seg, ty - this.r(0, 10));
        for (let s = seg; s >= 0; s--) {
          const f = s / seg;
          const d = depth * Math.pow(Math.sin(f * PI), 0.8) * this.r(0.75, 1.05);
          g.lineTo(ox + cx - w / 2 + w * f, ty + d);
        }
        g.closePath(); g.fill();
        // light rim on top
        g.strokeStyle = rgba(this.th.rim, 0.35);
        g.lineWidth = 2;
        g.beginPath(); g.moveTo(ox + cx - w / 2, ty); g.lineTo(ox + cx + w / 2, ty); g.stroke();
        if (L.decor === 'palace') this.palace(g, ox + cx + this.r(-w * 0.2, w * 0.2), ty - 4, w * 0.35, L.color);
        if (L.decor === 'pillars') {
          for (let k = 0; k < 3; k++) this.pillar(g, ox + cx + this.r(-w * 0.4, w * 0.4), ty, this.r(40, 110), L.color);
        }
        // hanging vines/roots
        g.strokeStyle = rgba(L.color, 0.6); g.lineWidth = 1;
        for (let k = 0; k < 6; k++) { const x = ox + cx + this.r(-w * 0.35, w * 0.35); g.beginPath(); g.moveTo(x, ty + depth * 0.3); g.lineTo(x + this.r(-6, 6), ty + depth * this.r(0.6, 1.2)); g.stroke(); }
        g.fillStyle = fill;
      };
      draw(0);
      if (cx - w < 0) draw(LW);
      if (cx + w > LW) draw(-LW);
    }
    // cloud sea at the bottom
    const cg = g.createLinearGradient(0, H * L.base, 0, H);
    cg.addColorStop(0, rgba(L.fog, 0)); cg.addColorStop(0.4, rgba(L.fog, 0.7)); cg.addColorStop(1, L.fog);
    g.fillStyle = cg;
    for (let x = -60; x < LW + 60; x += 70) {
      g.beginPath(); g.arc(x, H * L.base + 40 + Math.sin(x * 0.01) * 14, this.r(50, 90), 0, TAU); g.fill();
    }
    g.fillRect(0, H * L.base + 50, LW, H);
  }

  drawShards(g, L, fill, idx) {
    g.fillStyle = fill;
    // hanging inverted peaks from the top
    for (let i = 0; i < L.peaks; i++) {
      const cx = (i + this.r()) * (LW / L.peaks), w = this.r(60, 160), h = this.r(60, 200) * (1 - idx * 0.2);
      g.beginPath(); g.moveTo(cx - w / 2, 0); g.lineTo(cx + w / 2, 0);
      g.lineTo(cx + this.r(-10, 10), h); g.closePath();
      g.globalAlpha = 0.6; g.fill(); g.globalAlpha = 1;
    }
    // floating fragments
    for (let i = 0; i < L.peaks * 2; i++) {
      const cx = this.r(LW), cy = H * (L.base - L.amp) + this.r(-120, L.amp * H), s = this.r(14, 70) * (1 + idx * 0.3);
      g.beginPath();
      const k = randi(4, 6);
      for (let j = 0; j < k; j++) {
        const a = (j / k) * TAU + this.r(-0.3, 0.3), rr = s * this.r(0.5, 1.1) * (j % 2 ? 1 : 1.8);
        g.lineTo(cx + Math.cos(a) * rr * 0.6, cy + Math.sin(a) * rr);
      }
      g.closePath(); g.fill();
      g.strokeStyle = rgba(this.th.rim, 0.3); g.lineWidth = 1; g.stroke();
    }
    // bottom ridge
    const prof = this.profileFn({ ...L, style: 'jagged' });
    g.beginPath(); g.moveTo(0, H);
    for (let x = 0; x <= LW; x += 6) g.lineTo(x, H * (L.base + 0.06) - prof(x) * L.amp * H * 0.5);
    g.lineTo(LW, H); g.closePath(); g.fill();
  }

  decorate(g, L, pts, idx) {
    const col = L.color;
    const at = (x) => pts[Math.max(0, Math.min(pts.length - 1, (x / 4) | 0))][1];
    if (L.decor === 'pagoda') {
      // place on a few highest points
      const sorted = pts.filter((_, i) => i % 25 === 0).sort((a, b) => a[1] - b[1]).slice(0, 3);
      for (const [x, y] of sorted) this.pagoda(g, x, y + 6, this.r(0.7, 1.1), col);
    } else if (L.decor === 'pines') {
      for (let i = 0; i < 26; i++) { const x = this.r(LW); this.pine(g, x, at(x) + 4, this.r(26, 60), col); }
    } else if (L.decor === 'deadtrees') {
      for (let i = 0; i < 14; i++) { const x = this.r(LW); this.deadTree(g, x, at(x) + 6, this.r(50, 120), col, 4); }
    } else if (L.decor === 'bones') {
      for (let i = 0; i < 5; i++) { const x = this.r(LW); this.ribcage(g, x, at(x) + 20, this.r(60, 120), col); }
    } else if (L.decor === 'reeds') {
      for (let i = 0; i < 80; i++) { const x = this.r(LW); this.reed(g, x, at(x) + 6, this.r(20, 50), col); }
    }
  }

  pagoda(g, x, y, s, col) {
    g.fillStyle = col;
    let w = 46 * s, yy = y;
    const tiers = 5;
    for (let i = 0; i < tiers; i++) {
      const h = 16 * s;
      g.fillRect(x - w * 0.32, yy - h, w * 0.64, h);
      // eave with upturned tips
      g.beginPath();
      g.moveTo(x - w * 0.62, yy - h - 2);
      g.quadraticCurveTo(x - w * 0.3, yy - h + 3, x, yy - h - 8 * s);
      g.quadraticCurveTo(x + w * 0.3, yy - h + 3, x + w * 0.62, yy - h - 2);
      g.lineTo(x + w * 0.4, yy - h + 3); g.lineTo(x - w * 0.4, yy - h + 3); g.closePath(); g.fill();
      yy -= h + 4 * s; w *= 0.84;
    }
    g.fillRect(x - 1.5 * s, yy - 22 * s, 3 * s, 24 * s);
  }
  palace(g, x, y, w, col) {
    g.fillStyle = col;
    g.fillRect(x - w * 0.4, y - w * 0.3, w * 0.8, w * 0.3);
    g.beginPath();
    g.moveTo(x - w * 0.65, y - w * 0.28);
    g.quadraticCurveTo(x - w * 0.3, y - w * 0.32, x - w * 0.2, y - w * 0.52);
    g.lineTo(x + w * 0.2, y - w * 0.52);
    g.quadraticCurveTo(x + w * 0.3, y - w * 0.32, x + w * 0.65, y - w * 0.28);
    g.closePath(); g.fill();
    g.fillStyle = rgba(this.th.rim, 0.5);
    for (let i = -2; i <= 2; i++) g.fillRect(x + i * w * 0.14 - 2, y - w * 0.2, 4, w * 0.12);
  }
  pillar(g, x, y, h, col) {
    g.fillStyle = col;
    const broken = this.rng() < 0.6;
    g.beginPath();
    g.moveTo(x - 7, y); g.lineTo(x - 7, y - h);
    if (broken) { g.lineTo(x - 2, y - h - 8); g.lineTo(x + 3, y - h + 4); g.lineTo(x + 7, y - h - 4); }
    else { g.lineTo(x - 11, y - h); g.lineTo(x - 11, y - h - 6); g.lineTo(x + 11, y - h - 6); g.lineTo(x + 11, y - h); }
    g.lineTo(x + 7, y - h); g.lineTo(x + 7, y); g.closePath(); g.fill();
  }
  pine(g, x, y, h, col) {
    g.strokeStyle = col; g.fillStyle = col; g.lineWidth = Math.max(1.5, h * 0.06);
    const lean = this.r(-0.4, 0.4);
    const tx = x + lean * h, ty = y - h;
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x - lean * h * 0.5, y - h * 0.5, tx, ty); g.stroke();
    for (let i = 0; i < 4; i++) {
      const f = 0.45 + i * 0.18;
      const bx = lerp(x, tx, f), by = lerp(y, ty, f);
      const side = i % 2 ? 1 : -1;
      const ex = bx + side * h * this.r(0.2, 0.45), ey = by - h * 0.05;
      g.beginPath(); g.moveTo(bx, by); g.lineTo(ex, ey); g.stroke();
      g.beginPath(); g.ellipse(ex, ey - 2, h * this.r(0.18, 0.28), h * 0.07, 0, 0, TAU); g.fill();
    }
    g.beginPath(); g.ellipse(tx, ty, h * 0.22, h * 0.08, 0, 0, TAU); g.fill();
  }
  deadTree(g, x, y, h, col, depth) {
    g.strokeStyle = col; g.lineCap = 'round';
    const branch = (x0, y0, a, len, w, d) => {
      const x1 = x0 + Math.sin(a) * len, y1 = y0 - Math.cos(a) * len;
      g.lineWidth = w;
      g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo((x0 + x1) / 2 + this.r(-6, 6), (y0 + y1) / 2, x1, y1); g.stroke();
      if (d > 0) {
        const k = d > 2 ? 2 : randi(1, 3);
        for (let i = 0; i < k; i++) branch(x1, y1, a + this.r(-0.8, 0.8), len * this.r(0.55, 0.78), w * 0.62, d - 1);
      } else if (this.key === 'ember' && this.rng() < 0.3) {
        // burnt peach blossoms
        g.fillStyle = rgba('#ff6a3a', 0.5);
        g.beginPath(); g.arc(x1, y1, 2.5, 0, TAU); g.fill();
      }
    };
    branch(x, y, this.r(-0.2, 0.2), h * 0.42, h * 0.07, depth);
  }
  ribcage(g, x, y, s, col) {
    g.strokeStyle = col; g.lineWidth = s * 0.06; g.lineCap = 'round';
    g.beginPath(); g.moveTo(x - s, y - s * 0.1); g.quadraticCurveTo(x, y - s * 0.35, x + s, y - s * 0.05); g.stroke();
    for (let i = -4; i <= 4; i++) {
      const bx = x + i * s * 0.2;
      g.beginPath(); g.moveTo(bx, y - s * 0.28 + Math.abs(i) * s * 0.02);
      g.quadraticCurveTo(bx + s * 0.25, y - s * 0.6, bx + s * 0.05, y - s * 0.95 + Math.abs(i) * s * 0.1); g.stroke();
    }
  }
  reed(g, x, y, h, col) {
    g.strokeStyle = col; g.lineWidth = 1.2;
    const b = this.r(-0.3, 0.3);
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + b * h * 0.3, y - h * 0.6, x + b * h, y - h); g.stroke();
    g.fillStyle = col;
    g.beginPath(); g.ellipse(x + b * h, y - h, 2, 6, b, 0, TAU); g.fill();
  }

  buildGroundStrip() {
    const gd = this.th.ground;
    const c = makeCanvas(LW, 80);
    const g = c.getContext('2d');
    const base = 60;
    g.fillStyle = gd.detailColor; g.strokeStyle = gd.detailColor;
    if (gd.detail === 'grass' || gd.detail === 'reeds') {
      for (let i = 0; i < 700; i++) {
        const x = this.r(LW), h = this.r(4, gd.detail === 'reeds' ? 34 : 18) * (this.rng() < 0.1 ? 2 : 1);
        g.lineWidth = this.r(1, 2.2);
        const b = this.r(-0.5, 0.5);
        g.beginPath(); g.moveTo(x, base + 2); g.quadraticCurveTo(x + b * 4, base - h * 0.6, x + b * h * 0.6, base - h); g.stroke();
      }
      for (let i = 0; i < 40; i++) { const x = this.r(LW); g.beginPath(); g.ellipse(x, base + 2, this.r(6, 20), this.r(3, 9), 0, PI, TAU); g.fill(); }
    } else if (gd.detail === 'cracks') {
      for (let i = 0; i < 60; i++) {
        const x = this.r(LW);
        g.beginPath(); g.moveTo(x - this.r(10, 30), base + 2); g.lineTo(x, base - this.r(4, 22)); g.lineTo(x + this.r(10, 30), base + 2); g.fill();
      }
    } else if (gd.detail === 'marble') {
      for (let x = 0; x < LW; x += 120) {
        g.fillRect(x, base - 12, 6, 14);
        g.fillRect(x - 4, base - 16, 14, 5);
      }
      g.fillRect(0, base - 10, LW, 3);
    } else if (gd.detail === 'crystal') {
      for (let i = 0; i < 90; i++) {
        const x = this.r(LW), h = this.r(6, 30), w = this.r(3, 9), lean = this.r(-6, 6);
        g.beginPath(); g.moveTo(x - w, base + 2); g.lineTo(x + lean, base - h); g.lineTo(x + w, base + 2); g.fill();
      }
    }
    return c;
  }
  buildForeground() {
    // blurred dark silhouettes for depth
    const c = makeCanvas(LW, 260);
    const g = c.getContext('2d');
    try { g.filter = 'blur(5px)'; } catch (e) { /* */ }
    g.fillStyle = '#030203';
    for (let i = 0; i < 9; i++) {
      const x = this.r(LW), w = this.r(120, 320), h = this.r(60, 180);
      g.beginPath(); g.ellipse(x, 260, w / 2, h, 0, PI, TAU); g.fill();
      if (this.th.ground.detail === 'grass' || this.th.ground.detail === 'reeds') {
        g.strokeStyle = '#030203'; g.lineWidth = 4;
        for (let k = 0; k < 12; k++) {
          const gx = x + this.r(-w / 2, w / 2), gh = this.r(80, 200);
          g.beginPath(); g.moveTo(gx, 260); g.quadraticCurveTo(gx + this.r(-30, 30), 260 - gh / 2, gx + this.r(-60, 60), 260 - gh); g.stroke();
        }
      }
    }
    try { g.filter = 'none'; } catch (e) { /* */ }
    return c;
  }

  /* ---------------- weather ---------------- */
  spawnWeather(init) {
    const w = this.th.weather;
    const z = rand(0.3, 1.6);
    const p = { x: rand(-50, W + 50), y: init ? rand(H) : 0, z, t: rand(10), vx: 0, vy: 0, s: 1, c: '#fff', kind: 'glow', life: rand(4, 10) };
    if (w === 'embers' || w === 'fire') {
      if (Math.random() < 0.7) { p.kind = 'glow'; p.c = pick(['#ff9a3a', '#ffcf6a', '#ff5a1a']); p.vy = -rand(20, 70) * (w === 'fire' ? 2 : 1) * z; p.vx = rand(-15, 25); p.s = rand(1.2, 3) * z; if (!init) p.y = H + 10; }
      else { p.kind = 'ash'; p.c = '#2a2020'; p.vy = rand(15, 40) * z; p.vx = rand(-20, 10); p.s = rand(1.5, 3) * z; if (!init) p.y = -10; }
    } else if (w === 'spirits') {
      p.kind = 'glow'; p.c = pick(['#7af0e0', '#bafff4', '#4ac0d0']); p.vy = -rand(5, 20); p.vx = rand(-20, -5) * z; p.s = rand(1.2, 2.6) * z; if (!init) p.y = rand(H * 0.3, H);
    } else if (w === 'motes') {
      if (Math.random() < 0.6) { p.kind = 'glow'; p.c = pick(['#ffe8a0', '#fff6d8', '#ffc870']); p.vy = -rand(6, 22); p.vx = rand(-6, 6); p.s = rand(1, 2.5) * z; if (!init) p.y = H + 10; }
      else { p.kind = 'petal'; p.c = pick(['#ffd6e0', '#ffe8c0']); p.vy = rand(20, 45) * z; p.vx = rand(10, 40); p.s = rand(2, 4) * z; if (!init) p.y = -10; }
    } else if (w === 'void') {
      p.kind = 'glow'; p.c = pick(['#c080ff', '#ff70d0', '#80a0ff']); p.s = rand(1, 2.6) * z;
      p.vx = 0; p.vy = 0; p.orbit = true; p.r = rand(100, 900); p.a = rand(TAU); if (!init) p.r = rand(700, 1000);
    } else if (w === 'title') {
      p.kind = Math.random() < 0.7 ? 'glow' : 'petal'; p.c = p.kind === 'glow' ? pick(['#ffb050', '#ffd890']) : '#ff9aa8';
      p.vy = p.kind === 'glow' ? -rand(10, 40) : rand(20, 40); p.vx = rand(-10, 30); p.s = rand(1.2, 3) * z;
      if (!init) p.y = p.kind === 'glow' ? H + 10 : -10;
    }
    this.weather.push(p);
  }
  update(dt) {
    this.t += dt;
    const sx = this.th.sun.x * W, sy = this.th.sun.y * H;
    for (let i = this.weather.length - 1; i >= 0; i--) {
      const p = this.weather[i];
      p.t += dt;
      if (p.orbit) {
        p.a += dt * (60 / p.r); p.r -= dt * 40 * p.z;
        p.x = sx + Math.cos(p.a) * p.r; p.y = sy + Math.sin(p.a) * p.r * 0.45;
        if (p.r < 30) { this.weather.splice(i, 1); continue; }
      } else {
        p.x += (p.vx + Math.sin(p.t * 0.9 + p.z * 5) * 12) * dt;
        p.y += p.vy * dt;
      }
      if (p.y < -30 || p.y > H + 30 || p.x < -80 || p.x > W + 80) this.weather.splice(i, 1);
    }
    while (this.weather.length < 110) this.spawnWeather(false);
  }
  drawWeather(ctx, front, cam) {
    ctx.globalCompositeOperation = 'lighter';
    for (const p of this.weather) {
      if ((p.z > 1.25) !== front) continue;
      const ox = -(((cam.x * 0.2 * p.z) % (W + 160)) + (W + 160)) % (W + 160);
      let x = p.x + ox; if (x < -80) x += W + 160;
      if (p.kind === 'glow') {
        drawGlow(ctx, x, p.y, p.s * 5, p.c, 0.6 + 0.4 * Math.sin(p.t * 3 + p.z * 9));
      } else if (p.kind === 'ash') {
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = rgba(p.c, 0.7); ctx.fillRect(x, p.y, p.s, p.s);
        ctx.globalCompositeOperation = 'lighter';
      } else if (p.kind === 'petal') {
        ctx.globalCompositeOperation = 'source-over';
        ctx.save(); ctx.translate(x, p.y); ctx.rotate(p.t * 2 + p.z);
        ctx.fillStyle = rgba(p.c, 0.75);
        ctx.beginPath(); ctx.ellipse(0, 0, p.s, p.s * 0.45 * Math.abs(Math.sin(p.t * 2.3)) + 0.4, 0, 0, TAU); ctx.fill();
        ctx.restore();
        ctx.globalCompositeOperation = 'lighter';
      }
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  }

  /* ---------------- draw ---------------- */
  drawBack(ctx, cam) {
    const th = this.th;
    const t = this.t;
    const camDy = (cam.y - 360);
    const zoom = cam.zoom || 1;
    ctx.drawImage(this.sky, 0, 0);
    // celestial body
    const S = th.sun, sx = S.x * W, sy = S.y * H - camDy * 0.03;
    ctx.globalCompositeOperation = 'lighter';
    if (S.type === 'sun' || S.type === 'moon') {
      drawGlow(ctx, sx, sy, S.r * 7, S.halo, 0.35);
      drawGlow(ctx, sx, sy, S.r * 3, S.halo, 0.5);
      drawGlow(ctx, sx, sy, S.r * 1.6, S.color, 0.8);
    } else if (S.type === 'vortex') {
      this.drawVortex(ctx, sx, sy, S, t);
    } else {
      drawGlow(ctx, W / 2, H * 1.0, 900, S.halo, 0.45);
    }
    ctx.globalCompositeOperation = 'source-over';
    if (S.type === 'sun' || S.type === 'moon') {
      const dg = ctx.createRadialGradient(sx - S.r * 0.3, sy - S.r * 0.3, 0, sx, sy, S.r);
      dg.addColorStop(0, '#ffffff'); dg.addColorStop(0.7, S.color); dg.addColorStop(1, rgba(S.halo, 0.9));
      ctx.fillStyle = dg;
      ctx.beginPath(); ctx.arc(sx, sy, S.r, 0, TAU); ctx.fill();
      if (S.type === 'moon') {
        ctx.fillStyle = rgba('#8ab0b0', 0.18);
        [[-0.3, -0.2, 0.22], [0.25, 0.1, 0.16], [-0.05, 0.35, 0.12]].forEach(([a, b, r]) => { ctx.beginPath(); ctx.arc(sx + a * S.r, sy + b * S.r, r * S.r, 0, TAU); ctx.fill(); });
      }
    }
    // layers
    this.layers.forEach((L, i) => {
      if (i === 1 && th.props.includes('rays')) this.drawRays(ctx, sx, sy, t);
      if (i === 1 && th.props.includes('clouds')) this.drawClouds(ctx, cam, 0.1, 0.35);
      if (i === 2 && th.props.includes('water')) this.drawWater(ctx, cam, sx);
      if (i === 2 && th.props.includes('lava')) this.drawLava(ctx, cam, t);
      const s = 1 + (zoom - 1) * L.par * 1.5;
      ctx.save();
      if (s !== 1) { ctx.translate(W / 2, H * 0.8); ctx.scale(s, s); ctx.translate(-W / 2, -H * 0.8); }
      let ox = -((cam.x * L.par) % LW);
      if (ox > 0) ox -= LW;
      const oy = -camDy * L.par * 0.6;
      ctx.drawImage(L.canvas, ox, oy);
      ctx.drawImage(L.canvas, ox + LW, oy);
      if (i === 2 && th.props.includes('waterfall')) this.drawWaterfall(ctx, cam, L.par, oy, t);
      ctx.restore();
      if (i === 2 && th.props.includes('mist')) this.drawMist(ctx, cam, t);
    });
    this.drawWeather(ctx, false, cam);
  }
  drawVortex(ctx, x, y, S, t) {
    drawGlow(ctx, x, y, S.r * 6, S.halo, 0.4);
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(1, 0.45);
    for (let arm = 0; arm < 5; arm++) {
      ctx.beginPath();
      for (let i = 0; i < 70; i++) {
        const f = i / 70;
        const a = arm * (TAU / 5) + f * 5 - t * 0.5;
        const r = 20 + f * S.r * 5;
        const px = Math.cos(a) * r, py = Math.sin(a) * r;
        i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      }
      ctx.strokeStyle = rgba(arm % 2 ? '#b060ff' : '#ff60c0', 0.18);
      ctx.lineWidth = 18;
      ctx.stroke();
      ctx.strokeStyle = rgba('#ffffff', 0.08);
      ctx.lineWidth = 3;
      ctx.stroke();
    }
    ctx.restore();
    drawGlow(ctx, x, y, S.r * 1.4, '#ffffff', 0.5);
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#000000';
    ctx.beginPath(); ctx.ellipse(x, y, S.r * 0.45, S.r * 0.22, 0, 0, TAU); ctx.fill();
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = rgba('#f0d0ff', 0.9); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(x, y, S.r * 0.47, S.r * 0.24, 0, 0, TAU); ctx.stroke();
  }
  drawRays(ctx, sx, sy, t) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.translate(sx, sy);
    for (let i = 0; i < 9; i++) {
      const a = PI * 0.5 + (i - 4) * 0.2 + Math.sin(t * 0.15 + i) * 0.04;
      const len = 900, w = 30 + (i % 3) * 25;
      ctx.save(); ctx.rotate(a - PI / 2);
      const g = ctx.createLinearGradient(0, 0, 0, len);
      g.addColorStop(0, rgba(this.th.sun.color, 0.12 + 0.05 * Math.sin(t * 0.6 + i * 2)));
      g.addColorStop(1, rgba(this.th.sun.color, 0));
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(6, 0); ctx.lineTo(w, len); ctx.lineTo(-w, len); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }
  drawClouds(ctx, cam, par, alpha) {
    const t = this.t;
    ctx.fillStyle = rgba(this.th.mist, alpha);
    for (let i = 0; i < 7; i++) {
      let x = ((i * 420 - cam.x * par + t * 8 * (1 + i % 3)) % (W + 600)); if (x < -300) x += W + 600;
      const y = H * (0.3 + (i % 4) * 0.08);
      this.cloudShape(ctx, x - 300, y, 90 + (i % 3) * 30);
    }
  }
  cloudShape(ctx, x, y, s) {
    // 祥云 — stacked arcs with curl
    ctx.beginPath();
    ctx.arc(x, y, s * 0.5, PI, TAU);
    ctx.arc(x + s * 0.6, y - s * 0.1, s * 0.4, PI, TAU);
    ctx.arc(x + s * 1.1, y + s * 0.05, s * 0.3, PI, TAU);
    ctx.lineTo(x + s * 1.4, y + s * 0.12);
    ctx.lineTo(x - s * 0.5, y + s * 0.12);
    ctx.closePath(); ctx.fill();
  }
  drawWaterfall(ctx, cam, par, oy, t) {
    // 水帘洞 — glowing cascade
    const wx = 900 - ((cam.x * par) % LW);
    for (const base of [wx, wx + LW]) {
      if (base < -200 || base > W + 200) continue;
      const top = H * 0.38 + oy, bot = H * 0.78 + oy;
      const g = ctx.createLinearGradient(0, top, 0, bot);
      g.addColorStop(0, rgba('#ffd2a0', 0.0)); g.addColorStop(0.1, rgba('#ffd2a0', 0.35)); g.addColorStop(1, rgba('#ff9a60', 0.15));
      ctx.fillStyle = g;
      ctx.fillRect(base - 30, top, 60, bot - top);
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 9; i++) {
        const x = base - 26 + i * 6.5;
        const off = ((t * 260 + i * 53) % 80);
        ctx.strokeStyle = rgba('#fff0d0', 0.18);
        ctx.lineWidth = 1.5;
        ctx.setLineDash([24, 56]); ctx.lineDashOffset = -off;
        ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x, bot); ctx.stroke();
      }
      ctx.setLineDash([]);
      drawGlow(ctx, base, bot, 90, '#ffb080', 0.35);
      ctx.globalCompositeOperation = 'source-over';
    }
  }
  drawWater(ctx, cam, sx) {
    const y0 = H * 0.7, t = this.t;
    const g = ctx.createLinearGradient(0, y0, 0, H);
    g.addColorStop(0, rgba('#3a7a7a', 0.0)); g.addColorStop(0.2, rgba('#1a4a50', 0.8)); g.addColorStop(1, '#06161a');
    ctx.fillStyle = g; ctx.fillRect(0, y0, W, H - y0);
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 26; i++) {
      const y = y0 + 8 + i * 6;
      const w = 30 + i * 6 + Math.sin(t * 1.5 + i) * 10;
      const x = sx + Math.sin(t * 0.8 + i * 1.7) * (6 + i);
      ctx.fillStyle = rgba('#d8fff8', 0.22 * (1 - i / 26));
      ctx.fillRect(x - w / 2, y, w, 1.5);
    }
    ctx.globalCompositeOperation = 'source-over';
  }
  drawLava(ctx, cam, t) {
    const y0 = H * 0.76;
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createLinearGradient(0, y0 - 80, 0, H);
    g.addColorStop(0, rgba('#ff4a10', 0)); g.addColorStop(0.5, rgba('#ff5a10', 0.35)); g.addColorStop(1, rgba('#ffaa30', 0.6));
    ctx.fillStyle = g; ctx.fillRect(0, y0 - 80, W, H);
    for (let i = 0; i < 6; i++) {
      const x = ((i * 260 - cam.x * 0.3) % (W + 300) + W + 300) % (W + 300) - 150;
      drawGlow(ctx, x, y0 + 20 + Math.sin(t + i) * 6, 160, '#ff6a20', 0.3 + 0.15 * Math.sin(t * 2 + i));
    }
    ctx.globalCompositeOperation = 'source-over';
  }
  drawMist(ctx, cam, t) {
    const c = this.th.mist;
    for (let i = 0; i < 3; i++) {
      const y = H * (0.66 + i * 0.07);
      const x = ((t * (10 + i * 6) - cam.x * (0.3 + i * 0.1)) % W + W) % W;
      const g = ctx.createLinearGradient(0, y - 40, 0, y + 40);
      g.addColorStop(0, rgba(c, 0)); g.addColorStop(0.5, rgba(c, 0.09)); g.addColorStop(1, rgba(c, 0));
      ctx.fillStyle = g;
      ctx.fillRect(0, y - 40, W, 80);
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = rgba(c, 0.08);
      for (let k = -1; k < 3; k++) { ctx.beginPath(); ctx.ellipse(x + k * W * 0.5, y, 260, 22, 0, 0, TAU); ctx.fill(); }
      ctx.globalAlpha = 1;
    }
  }

  // world-space ground (call inside camera transform)
  drawGround(ctx, cam, viewL, viewR) {
    const gd = this.th.ground;
    const g = ctx.createLinearGradient(0, GROUND, 0, GROUND + 200);
    g.addColorStop(0, gd.top); g.addColorStop(1, gd.bottom);
    ctx.fillStyle = g;
    ctx.fillRect(viewL - 10, GROUND, viewR - viewL + 20, 400);
    // grass/detail strip
    let sx = Math.floor(viewL / LW) * LW;
    for (; sx < viewR; sx += LW) ctx.drawImage(this.gstrip, sx, GROUND - 60);
    // glowing edge
    ctx.globalCompositeOperation = 'lighter';
    const eg = ctx.createLinearGradient(0, GROUND - 2, 0, GROUND + 26);
    eg.addColorStop(0, rgba(gd.edge, 0.55)); eg.addColorStop(0.15, rgba(gd.edge, 0.18)); eg.addColorStop(1, rgba(gd.edge, 0));
    ctx.fillStyle = eg;
    ctx.fillRect(viewL - 10, GROUND - 1, viewR - viewL + 20, 28);
    if (gd.detail === 'cracks') {
      // lava cracks
      for (let x = Math.floor(viewL / 180) * 180; x < viewR; x += 180) {
        const a = 0.35 + 0.25 * Math.sin(this.t * 2 + x);
        ctx.strokeStyle = rgba('#ff6a1a', a); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x, GROUND + 8); ctx.lineTo(x + 30, GROUND + 26); ctx.lineTo(x + 18, GROUND + 50); ctx.lineTo(x + 50, GROUND + 80); ctx.stroke();
      }
    }
    ctx.globalCompositeOperation = 'source-over';
  }
  drawFront(ctx, cam) {
    this.drawWeather(ctx, true, cam);
    let ox = -((cam.x * 1.35) % LW);
    if (ox > 0) ox -= LW;
    const oy = H - 200 - (cam.y - 360) * 1.3;
    ctx.globalAlpha = 0.92;
    ctx.drawImage(this.fg, ox, oy);
    ctx.drawImage(this.fg, ox + LW, oy);
    ctx.globalAlpha = 1;
  }
  drawGrade(ctx) {
    const th = this.th;
    ctx.globalCompositeOperation = 'soft-light';
    ctx.fillStyle = rgba(th.grade, th.gradeA * 3);
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over';
  }
}
