'use strict';
/* ============================================================
 *  FX — glow sprites, particles, weapon trails, floating text,
 *        reusable world effects, post-processing
 * ============================================================ */
const GlowCache = {};
function glowTex(color) {
  let c = GlowCache[color];
  if (c) return c;
  c = makeCanvas(128, 128);
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, rgba(color, 1));
  gr.addColorStop(0.18, rgba(color, 0.72));
  gr.addColorStop(0.42, rgba(color, 0.26));
  gr.addColorStop(0.7, rgba(color, 0.07));
  gr.addColorStop(1, rgba(color, 0));
  g.fillStyle = gr;
  g.fillRect(0, 0, 128, 128);
  return (GlowCache[color] = c);
}
function drawGlow(ctx, x, y, r, color, a = 1) {
  if (a <= 0.004 || r <= 0.5) return;
  ctx.globalAlpha = a > 1 ? 1 : a;
  ctx.drawImage(glowTex(color), x - r, y - r, r * 2, r * 2);
  ctx.globalAlpha = 1;
}

/* ---------------- particles ---------------- */
const Parts = {
  list: [],
  max: 2200,
  spawn(type, x, y, o = {}) {
    if (this.list.length >= this.max) return null;
    const p = {
      type, x, y,
      vx: o.vx || 0, vy: o.vy || 0,
      life: o.life || 0.6, t: 0,
      size: o.size || 4, color: o.color || '#ffffff',
      grav: o.grav || 0, drag: o.drag || 0,
      rot: o.rot !== undefined ? o.rot : Math.random() * TAU, vr: o.vr || 0,
      add: o.add !== undefined ? o.add : true,
      grow: o.grow || 0, alpha: o.alpha !== undefined ? o.alpha : 1,
      wob: o.wob || 0, seed: Math.random() * 100, floor: o.floor || false,
      lw: o.lw || 3, ch: o.ch || '', screen: o.screen || false,
    };
    this.list.push(p);
    return p;
  },
  clear() { this.list.length = 0; },
  update(dt) {
    const L = this.list;
    for (let i = L.length - 1; i >= 0; i--) {
      const p = L[i];
      p.t += dt;
      if (p.t >= p.life) { L[i] = L[L.length - 1]; L.pop(); continue; }
      if (p.drag) { const d = Math.exp(-p.drag * dt); p.vx *= d; p.vy *= d; }
      p.vy += p.grav * dt;
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.rot += p.vr * dt;
      if (p.wob) p.x += Math.sin(p.t * 4 + p.seed) * p.wob * dt;
      if (p.floor && p.y > GROUND) { p.y = GROUND; p.vy *= -0.3; p.vx *= 0.6; }
    }
  },
  draw(ctx, screenPass = false) {
    const L = this.list;
    // normal-blend pass
    for (let i = 0; i < L.length; i++) { const p = L[i]; if (!p.add && p.screen === screenPass) this.drawOne(ctx, p); }
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < L.length; i++) { const p = L[i]; if (p.add && p.screen === screenPass) this.drawOne(ctx, p); }
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  },
  drawOne(ctx, p) {
    const u = p.t / p.life, k = 1 - u;
    switch (p.type) {
      case 'spark': {
        const sp = Math.hypot(p.vx, p.vy);
        const l = Math.min(60, sp * 0.03 + 2);
        const nx = p.vx / (sp || 1), ny = p.vy / (sp || 1);
        ctx.globalAlpha = p.alpha * k;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.size * (0.4 + k * 0.6);
        ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - nx * l, p.y - ny * l); ctx.stroke();
        break;
      }
      case 'ember':
        drawGlow(ctx, p.x, p.y, p.size * (2.2 + Math.sin(p.t * 9 + p.seed) * 0.4) * (0.5 + k * 0.5), p.color, p.alpha * (u < 0.15 ? u / 0.15 : k));
        break;
      case 'glow':
        drawGlow(ctx, p.x, p.y, p.size * (1 + p.grow * u), p.color, p.alpha * k * k);
        break;
      case 'smoke': {
        ctx.globalAlpha = p.alpha * k * (u < 0.1 ? u / 0.1 : 1);
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (1 + p.grow * u), 0, TAU); ctx.fill();
        break;
      }
      case 'ring': {
        const r = p.size + p.grow * Ease.outCubic(u);
        ctx.globalAlpha = p.alpha * k;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = Math.max(0.5, p.lw * k);
        ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, TAU); ctx.stroke();
        break;
      }
      case 'ellipse': { // flattened ground ring
        const r = p.size + p.grow * Ease.outCubic(u);
        ctx.globalAlpha = p.alpha * k;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = Math.max(0.5, p.lw * k);
        ctx.beginPath(); ctx.ellipse(p.x, p.y, r, r * 0.22, 0, 0, TAU); ctx.stroke();
        break;
      }
      case 'shard': {
        ctx.save();
        ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.globalAlpha = p.alpha * Math.min(1, k * 2);
        ctx.fillStyle = p.color;
        const s = p.size;
        ctx.beginPath(); ctx.moveTo(-s, -s * 0.4); ctx.lineTo(s, 0); ctx.lineTo(-s * 0.6, s * 0.5); ctx.closePath(); ctx.fill();
        ctx.restore();
        break;
      }
      case 'petal': {
        ctx.save();
        ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.globalAlpha = p.alpha * Math.min(1, k * 3) * (u < 0.1 ? u / 0.1 : 1);
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.ellipse(0, 0, p.size, p.size * 0.45 * Math.abs(Math.sin(p.t * 3 + p.seed)) + 0.5, 0, 0, TAU); ctx.fill();
        ctx.restore();
        break;
      }
      case 'streak': {
        ctx.globalAlpha = p.alpha * k;
        ctx.strokeStyle = p.color; ctx.lineWidth = p.size;
        const l = p.lw * 10;
        const a = Math.atan2(p.vy, p.vx);
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - Math.cos(a) * l, p.y - Math.sin(a) * l); ctx.stroke();
        break;
      }
      case 'glyph': {
        ctx.save();
        ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.globalAlpha = p.alpha * k;
        ctx.fillStyle = p.color;
        ctx.font = `${p.size | 0}px ${FONT_KAI}`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(p.ch, 0, 0);
        ctx.restore();
        break;
      }
      case 'square': {
        ctx.globalAlpha = p.alpha * k;
        ctx.fillStyle = p.color;
        const s = p.size * (0.5 + k * 0.5);
        ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s);
        break;
      }
      default: break;
    }
    ctx.globalAlpha = 1;
  },
};

/* --------- particle burst helpers --------- */
const FX = {
  hitSpark(x, y, dir, color, power = 1) {
    const n = (8 + power * 8) | 0;
    for (let i = 0; i < n; i++) {
      const a = (dir > 0 ? 0 : PI) + rand(-1.1, 1.1);
      const sp = rand(300, 900) * power;
      Parts.spawn('spark', x, y, { vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 80, life: rand(0.15, 0.35), size: rand(1.5, 3.2), color: i % 3 ? color : '#ffffff', drag: 5, grav: 600 });
    }
    Parts.spawn('glow', x, y, { size: 70 * power, color, life: 0.14, grow: 0.4 });
    Parts.spawn('glow', x, y, { size: 30 * power, color: '#ffffff', life: 0.08 });
    Parts.spawn('ring', x, y, { size: 6, grow: 50 * power, color, life: 0.22, lw: 3 });
  },
  slashMark(x, y, dir, color, len = 90) {
    // a thin diagonal flash line across the hit point
    const a = rand(-0.9, 0.9) + (dir > 0 ? 0 : PI);
    Parts.spawn('streak', x + Math.cos(a) * len * 0.5, y + Math.sin(a) * len * 0.5, { vx: Math.cos(a) * 1, vy: Math.sin(a) * 1, size: 3, lw: len / 10, color: '#ffffff', life: 0.12 });
    Parts.spawn('streak', x + Math.cos(a) * len * 0.5, y + Math.sin(a) * len * 0.5, { vx: Math.cos(a) * 1, vy: Math.sin(a) * 1, size: 8, lw: len / 10, color, life: 0.16, alpha: 0.6 });
  },
  dust(x, y, n = 6, color = '#8a7a66', spread = 1) {
    for (let i = 0; i < n; i++) {
      Parts.spawn('smoke', x + rand(-10, 10) * spread, y - rand(0, 6), { vx: rand(-140, 140) * spread, vy: rand(-80, -10), life: rand(0.4, 0.8), size: rand(6, 12), grow: 1.6, color, alpha: 0.35, add: false, drag: 3 });
    }
  },
  embers(x, y, n, color, spread = 30, up = 120) {
    for (let i = 0; i < n; i++) {
      Parts.spawn('ember', x + rand(-spread, spread), y + rand(-spread, spread), { vx: rand(-60, 60), vy: rand(-up * 1.5, -up * 0.3), life: rand(0.6, 1.4), size: rand(2, 4.5), color, drag: 1.2, wob: 40 });
    }
  },
  explosion(x, y, r, color, inner = '#ffffff') {
    Parts.spawn('glow', x, y, { size: r * 2.2, color, life: 0.35, grow: 0.3 });
    Parts.spawn('glow', x, y, { size: r * 1.0, color: inner, life: 0.18 });
    Parts.spawn('ring', x, y, { size: r * 0.2, grow: r * 1.4, color, life: 0.4, lw: 8 });
    Parts.spawn('ring', x, y, { size: r * 0.1, grow: r * 0.9, color: inner, life: 0.25, lw: 3 });
    for (let i = 0; i < 24; i++) {
      const a = rand(TAU), sp = rand(200, 700) * (r / 80);
      Parts.spawn('spark', x, y, { vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: rand(0.25, 0.6), size: rand(2, 4), color: i % 2 ? color : inner, drag: 3, grav: 300 });
    }
    for (let i = 0; i < 10; i++) {
      const a = rand(TAU), sp = rand(40, 160);
      Parts.spawn('smoke', x, y, { vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 40, life: rand(0.6, 1.1), size: r * rand(0.2, 0.35), grow: 1.4, color: '#1a1414', alpha: 0.45, add: false, drag: 2 });
    }
  },
  groundRing(x, color, r = 120, life = 0.4) {
    Parts.spawn('ellipse', x, GROUND, { size: 10, grow: r, color, life, lw: 6 });
  },
  inkBurst(x, y, n = 12, color = '#0a0808', size = 14) {
    for (let i = 0; i < n; i++) {
      const a = rand(TAU), sp = rand(60, 260);
      Parts.spawn('smoke', x, y, { vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 30, life: rand(0.5, 1), size: rand(size * 0.5, size), grow: 1.2, color, alpha: 0.6, add: false, drag: 3 });
    }
  },
  debris(x, y, n, color = '#3a2e26') {
    for (let i = 0; i < n; i++) {
      Parts.spawn('shard', x + rand(-20, 20), y, { vx: rand(-300, 300), vy: rand(-650, -200), life: rand(0.6, 1.2), size: rand(3, 7), grav: 1800, vr: rand(-12, 12), color, add: false, floor: true });
    }
  },
};

/* ---------------- weapon trail ---------------- */
class Trail {
  constructor(color, life = 0.16, core = '#ffffff') {
    this.pts = []; this.color = color; this.life = life; this.core = core; this.width = 1;
  }
  add(px, py, ang, r0, r1, dir) {
    const last = this.pts[this.pts.length - 1];
    if (last && last.dir === dir && last.t < 0.03) {
      const da = ang - last.ang;
      const steps = Math.min(10, Math.ceil(Math.abs(da) / 0.09));
      for (let i = 1; i < steps; i++) {
        const f = i / steps;
        this.pts.push({ px: lerp(last.px, px, f), py: lerp(last.py, py, f), ang: last.ang + da * f, r0: lerp(last.r0, r0, f), r1: lerp(last.r1, r1, f), dir, t: lerp(last.t, 0, f) });
      }
    }
    this.pts.push({ px, py, ang, r0, r1, dir, t: 0 });
  }
  update(dt) {
    for (const p of this.pts) p.t += dt;
    while (this.pts.length && this.pts[0].t > this.life) this.pts.shift();
  }
  draw(ctx) {
    const P = this.pts;
    if (P.length < 2) return;
    ctx.globalCompositeOperation = 'lighter';
    const tip = (p, r) => [p.px + p.dir * Math.sin(p.ang) * r, p.py + Math.cos(p.ang) * r];
    for (let i = 0; i < P.length - 1; i++) {
      const a = P[i], b = P[i + 1];
      const k = Math.pow(1 - b.t / this.life, 1.6);
      if (k <= 0) continue;
      const [ax0, ay0] = tip(a, a.r0), [ax1, ay1] = tip(a, a.r1);
      const [bx0, by0] = tip(b, b.r0), [bx1, by1] = tip(b, b.r1);
      ctx.globalAlpha = k * 0.55;
      ctx.fillStyle = this.color;
      ctx.beginPath(); ctx.moveTo(ax0, ay0); ctx.lineTo(ax1, ay1); ctx.lineTo(bx1, by1); ctx.lineTo(bx0, by0); ctx.closePath(); ctx.fill();
    }
    // bright edge
    ctx.lineCap = 'round';
    for (let i = 0; i < P.length - 1; i++) {
      const a = P[i], b = P[i + 1];
      const k = Math.pow(1 - b.t / this.life, 2);
      const [ax, ay] = tip(a, a.r1), [bx, by] = tip(b, b.r1);
      ctx.globalAlpha = k * 0.9;
      ctx.strokeStyle = this.core;
      ctx.lineWidth = 1 + 4 * k * this.width;
      ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }
}

/* ---------------- floating combat text ---------------- */
const Floaters = {
  list: [],
  add(x, y, text, o = {}) {
    this.list.push({ x: x + rand(-14, 14), y, text: String(text), t: 0, life: o.life || 0.9, color: o.color || '#ffffff', size: o.size || 26, crit: !!o.crit, vy: o.vy || -70, vx: rand(-30, 30), font: o.font || FONT_NUM, outline: o.outline || '#1a0a05' });
    if (this.list.length > 80) this.list.shift();
  },
  update(dt) {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const f = this.list[i];
      f.t += dt; f.y += f.vy * dt; f.x += f.vx * dt; f.vy *= Math.exp(-2.5 * dt);
      if (f.t > f.life) this.list.splice(i, 1);
    }
  },
  draw(ctx) {
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const f of this.list) {
      const u = f.t / f.life;
      let s = f.t < 0.1 ? Ease.outBack(f.t / 0.1) * 1.45 : lerp(1.45, 1, Math.min(1, (f.t - 0.1) / 0.15));
      if (!f.crit) s *= 0.85;
      const a = u > 0.65 ? 1 - (u - 0.65) / 0.35 : 1;
      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.scale(s, s);
      if (f.crit) ctx.rotate(-0.08);
      ctx.globalAlpha = a;
      ctx.font = `italic ${f.size}px ${f.font}`;
      ctx.lineWidth = 5; ctx.lineJoin = 'round';
      ctx.strokeStyle = f.outline;
      ctx.strokeText(f.text, 0, 0);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, 0, 0);
      if (f.crit) {
        ctx.font = `${f.size * 0.7}px ${FONT_BRUSH}`;
        ctx.strokeText('暴', -f.text.length * f.size * 0.36 - 16, -4);
        ctx.fillStyle = '#ff4a2a';
        ctx.fillText('暴', -f.text.length * f.size * 0.36 - 16, -4);
      }
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  },
};

/* ---------------- reusable world effects ----------------
 * effect objects: { update(dt) -> alive bool, draw(ctx), layer: 'back'|'front' }
 */
function fxCrescent(x, y, r, a0, a1, dir, color, life = 0.22, thick = 0.35) {
  // a filled crescent sweeping from a0 to a1 (radians, 0 = forward)
  let t = 0;
  const flecks = Array.from({ length: 5 }, (_, i) => ({
    f: (i + 0.5) / 5,
    dr: rand(-6, 10),
    sz: rand(1.5, 3.2),
  }));
  return {
    layer: 'front',
    update(dt) { t += dt; return t < life; },
    draw(ctx) {
      const u = t / life;
      const k = 1 - u;
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(dir, 1);
      ctx.globalCompositeOperation = 'lighter';
      const ea = lerp(a0, a1, Math.min(1, Ease.outCubic(u * 2.2)));
      const sa = lerp(a0, a1, Math.max(0, Ease.inQuad(u)));
      const rr = r * (1 + u * 0.14);
      ctx.globalAlpha = k;
      const g = ctx.createRadialGradient(0, 0, rr * (1 - thick), 0, 0, rr);
      g.addColorStop(0, rgba(color, 0));
      g.addColorStop(0.55, rgba(color, 0.52));
      g.addColorStop(0.9, rgba('#ffffff', 0.96));
      g.addColorStop(1, rgba(color, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      if (a1 > a0) { ctx.arc(0, 0, rr, sa, ea); ctx.arc(0, 0, rr * (1 - thick), ea, sa, true); }
      else { ctx.arc(0, 0, rr, ea, sa); ctx.arc(0, 0, rr * (1 - thick), sa, ea, true); }
      ctx.closePath(); ctx.fill();
      // crisp leading edge + spark flecks
      ctx.strokeStyle = rgba('#ffffff', k * 0.85);
      ctx.lineWidth = 2.2 * k;
      ctx.beginPath();
      if (a1 > a0) ctx.arc(0, 0, rr * 0.96, sa, ea);
      else ctx.arc(0, 0, rr * 0.96, ea, sa);
      ctx.stroke();
      ctx.fillStyle = '#fff6d0';
      for (const fl of flecks) {
        const ang = lerp(sa, ea, fl.f);
        const fr = rr + fl.dr + u * 18;
        ctx.globalAlpha = k * 0.8;
        ctx.beginPath();
        ctx.arc(Math.cos(ang) * fr, Math.sin(ang) * fr, fl.sz * k, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    },
  };
}

function fxThrust(x, y, len, dir, color, life = 0.18) {
  let t = 0;
  return {
    layer: 'front',
    update(dt) { t += dt; return t < life; },
    draw(ctx) {
      const u = t / life;
      const k = 1 - u;
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(dir, 1);
      ctx.globalCompositeOperation = 'lighter';
      const L = len * (0.65 + 0.55 * Ease.outExpo(u));
      const w = 18 * k;
      const g = ctx.createLinearGradient(0, 0, L, 0);
      g.addColorStop(0, rgba(color, 0));
      g.addColorStop(0.35, rgba(color, 0.75 * k));
      g.addColorStop(0.85, rgba('#ffffff', 0.95 * k));
      g.addColorStop(1, rgba('#ffffff', 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(-10, 0);
      ctx.lineTo(L * 0.28, -w);
      ctx.lineTo(L, 0);
      ctx.lineTo(L * 0.28, w);
      ctx.closePath();
      ctx.fill();
      // shock ring around thrust base
      ctx.strokeStyle = rgba('#ffffff', 0.7 * k);
      ctx.lineWidth = 2.2 * k;
      ctx.beginPath();
      ctx.ellipse(L * 0.22, 0, 7 + u * 10, 22 * (0.6 + u * 0.7), 0, 0, TAU);
      ctx.stroke();
      ctx.restore();
    },
  };
}

function fxSlashLine(x, y, ang, len, color, life = 0.14) {
  let t = 0;
  return {
    layer: 'front',
    update(dt) { t += dt; return t < life; },
    draw(ctx) {
      const u = t / life;
      const k = 1 - u;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(ang);
      ctx.globalCompositeOperation = 'lighter';
      const L = len * (0.7 + 0.45 * Ease.outCubic(u));
      ctx.globalAlpha = k;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(-L * 0.5, 0);
      ctx.quadraticCurveTo(0, -6 * k, L * 0.5, 0);
      ctx.quadraticCurveTo(0, 6 * k, -L * 0.5, 0);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(-L * 0.42, 0);
      ctx.quadraticCurveTo(0, -2.6 * k, L * 0.42, 0);
      ctx.quadraticCurveTo(0, 2.6 * k, -L * 0.42, 0);
      ctx.fill();
      ctx.restore();
    },
  };
}

function fxHorizSweep(x, y, len, dir, color, life = 0.16) {
  let t = 0;
  return {
    layer: 'front',
    update(dt) { t += dt; return t < life; },
    draw(ctx) {
      const u = t / life, k = 1 - u;
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(dir, 1);
      ctx.globalCompositeOperation = 'lighter';
      const L = len * (0.55 + 0.55 * Ease.outExpo(u));
      const g = ctx.createLinearGradient(-15, 0, L, 0);
      g.addColorStop(0, rgba(color, 0));
      g.addColorStop(0.3, rgba(color, 0.7 * k));
      g.addColorStop(0.85, rgba('#ffffff', 0.95 * k));
      g.addColorStop(1, rgba('#ffffff', 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(-12, 0);
      ctx.quadraticCurveTo(L * 0.45, -13 * k, L, -2 * k);
      ctx.quadraticCurveTo(L * 0.45, 11 * k, -12, 0);
      ctx.fill();
      ctx.strokeStyle = rgba('#ffffff', 0.85 * k);
      ctx.lineWidth = 2.2 * k;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(L * 0.92, -1);
      ctx.stroke();
      ctx.restore();
    },
  };
}

function fxSpinWheel(x, y, r, dir, color, life = 0.24) {
  let t = 0;
  return {
    layer: 'front',
    update(dt) { t += dt; return t < life; },
    draw(ctx) {
      const u = t / life, k = 1 - u;
      const rot = t * 28 * dir;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = k;
      ctx.strokeStyle = color;
      ctx.lineWidth = 7 * k;
      ctx.beginPath(); ctx.arc(0, 0, r, 0, PI * 1.4); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, r * 0.72, PI, PI * 2.35); ctx.stroke();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5 * k;
      ctx.beginPath(); ctx.arc(0, 0, r * 0.94, 0.2, PI * 1.1); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, r * 0.94, PI + 0.2, TAU + 0.9); ctx.stroke();
      ctx.restore();
    },
  };
}

function fxVertCleave(x, y, h, dir, color, life = 0.18) {
  let t = 0;
  return {
    layer: 'front',
    update(dt) { t += dt; return t < life; },
    draw(ctx) {
      const u = t / life, k = 1 - u;
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(dir, 1);
      ctx.globalCompositeOperation = 'lighter';
      const w = 22 * k;
      const g = ctx.createLinearGradient(0, -h, 0, 12);
      g.addColorStop(0, rgba(color, 0));
      g.addColorStop(0.5, rgba(color, 0.78 * k));
      g.addColorStop(0.95, rgba('#ffffff', 0.95 * k));
      g.addColorStop(1, rgba(color, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(-w * 0.4, -h);
      ctx.lineTo(w * 0.6, -h * 0.35);
      ctx.lineTo(w, 6);
      ctx.lineTo(-w * 0.6, 6);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = rgba('#ffffff', 0.9 * k);
      ctx.lineWidth = 3 * k;
      ctx.beginPath(); ctx.moveTo(2, -h * 0.9); ctx.lineTo(4, 4); ctx.stroke();
      ctx.restore();
    },
  };
}

function fxPillar(x, y, w, h, color, life = 0.32) {
  let t = 0;
  return {
    layer: 'front',
    update(dt) { t += dt; return t < life; },
    draw(ctx) {
      const u = t / life, k = 1 - u;
      const curW = w * (0.6 + 0.5 * Ease.outExpo(Math.min(1, u * 3))) * k;
      const curH = h * Math.min(1, Ease.outExpo(u * 3.5));
      ctx.save();
      ctx.translate(x, y);
      ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createLinearGradient(0, -curH, 0, 0);
      g.addColorStop(0, rgba(color, 0));
      g.addColorStop(0.35, rgba(color, 0.75 * k));
      g.addColorStop(1, rgba('#ffffff', 0.95 * k));
      ctx.fillStyle = g;
      ctx.fillRect(-curW * 0.5, -curH, curW, curH);
      ctx.fillStyle = rgba('#ffffff', 0.9 * k);
      ctx.fillRect(-curW * 0.18, -curH * 0.95, curW * 0.36, curH * 0.95);
      ctx.restore();
    },
  };
}

function fxWarnZone(x, w, life, color = '#ff3030', y0 = GROUND, h = 0) {
  // ground telegraph (flat stripe or full column when h>0)
  let t = 0;
  return {
    layer: 'back',
    update(dt) { t += dt; return t < life; },
    draw(ctx) {
      const u = t / life;
      const pulse = 0.5 + 0.5 * Math.sin(t * 22);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      if (h > 0) {
        const g = ctx.createLinearGradient(0, y0 - h, 0, y0);
        g.addColorStop(0, rgba(color, 0));
        g.addColorStop(1, rgba(color, 0.18 + 0.12 * pulse));
        ctx.fillStyle = g;
        ctx.fillRect(x - w / 2, y0 - h, w, h);
      }
      ctx.fillStyle = rgba(color, 0.25 + 0.25 * pulse);
      ctx.beginPath(); ctx.ellipse(x, y0, w / 2, 9, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = rgba(color, 0.9);
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(x, y0, (w / 2) * u, 9 * u, 0, 0, TAU); ctx.stroke();
      ctx.restore();
    },
  };
}

function fxLine(x1, y1, x2, y2, life, color, width = 2) {
  // laser sight / telegraph line
  let t = 0;
  return {
    layer: 'front',
    update(dt) { t += dt; return t < life; },
    draw(ctx) {
      const pulse = 0.5 + 0.5 * Math.sin(t * 30);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = rgba(color, 0.4 + 0.5 * pulse);
      ctx.lineWidth = width;
      ctx.setLineDash([14, 10]);
      ctx.lineDashOffset = -t * 120;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      ctx.restore();
    },
  };
}

/* ---------------- post processing ---------------- */
const Post = {
  vig: null, grain: null, grainT: 0,
  init() {
    this.vig = makeCanvas(W, H);
    const g = this.vig.getContext('2d');
    const gr = g.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.95);
    gr.addColorStop(0, 'rgba(0,0,0,0)');
    gr.addColorStop(0.7, 'rgba(0,0,0,0.28)');
    gr.addColorStop(1, 'rgba(0,0,0,0.75)');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    this.grain = makeCanvas(256, 256);
    const gg = this.grain.getContext('2d');
    const id = gg.createImageData(256, 256);
    for (let i = 0; i < id.data.length; i += 4) {
      const v = (Math.random() * 255) | 0;
      id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 22;
    }
    gg.putImageData(id, 0, 0);
  },
  draw(ctx, vigStrength = 1) {
    ctx.globalAlpha = vigStrength;
    ctx.drawImage(this.vig, 0, 0);
    ctx.globalAlpha = 0.5;
    ctx.globalCompositeOperation = 'overlay';
    const ox = (Math.random() * 256) | 0, oy = (Math.random() * 256) | 0;
    ctx.save();
    ctx.translate(-ox, -oy);
    for (let x = 0; x < W + 256; x += 256) for (let y = 0; y < H + 256; y += 256) ctx.drawImage(this.grain, x, y);
    ctx.restore();
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  },
};
