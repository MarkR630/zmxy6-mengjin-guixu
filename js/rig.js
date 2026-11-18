'use strict';
/* ============================================================
 *  RIG — high-craft procedural skeletal characters (volumetric
 *  ink-cel shading + rim light + ornate armor & weapons +
 *  verlet cloth simulation + dharma halos + portraits)
 * ============================================================ */
// pose: [lean, yoff, head, aF1, aF2, aB1, aB2, lF1, lF2, lB1, lB2, wpn]
const PN = 12;
function poseLerp(a, b, t, out) {
  out = out || new Array(PN);
  for (let i = 0; i < PN; i++) out[i] = a[i] + (b[i] - a[i]) * t;
  return out;
}
function P(lean, head, aF1, aF2, aB1, aB2, lF1, lF2, lB1, lB2, wpn, yoff = 0) {
  return [lean, yoff, head, aF1, aF2, aB1, aB2, lF1, lF2, lB1, lB2, wpn];
}

/* ---------- canonical poses ---------- */
const POSES = {
  idle:     P(0.1, -0.05, 0.55, 1.1, -0.25, 0.5, 0.38, -0.3, -0.28, -0.25, 2.3),
  idleSw:   P(0.08, -0.05, 0.3, 0.9, -0.3, 0.6, 0.35, -0.3, -0.25, -0.25, 1.9),
  idleCast: P(0.02, -0.1, 0.4, 1.4, -0.2, 0.4, 0.2, -0.15, -0.15, -0.1, 2.9),
  jump:     P(0.15, -0.1, 1.2, 0.8, -0.8, 0.9, 1.0, -1.5, 0.3, -1.1, 2.6),
  fall:     P(0.05, 0.05, 1.6, 0.4, -1.0, 0.6, 0.45, -0.7, -0.25, -0.5, 2.2),
  dash:     P(0.62, 0.15, 1.9, 0.1, -1.1, 0.2, 1.05, -0.4, -0.95, -0.35, 1.7),
  hurt:     P(-0.35, -0.4, -0.6, 0.6, -1.2, 0.5, 0.15, -0.3, -0.5, -0.2, 3.6),
  down:     P(-1.45, -0.2, -2.6, 0.4, -2.9, 0.4, -1.3, -0.2, -1.6, -0.3, 4.5, 14),
  cast:     P(0.12, -0.1, 1.55, 0.0, -0.4, 0.4, 0.5, -0.4, -0.4, -0.2, 2.9),
  castUp:   P(-0.05, -0.3, 2.9, 0.1, 2.6, 0.2, 0.2, -0.2, -0.2, -0.1, 3.1),
  slam:     P(0.55, 0.2, 1.2, 0.0, 0.2, 0.5, 0.9, -0.9, -0.6, -0.3, 0.9),
  victory:  P(-0.05, -0.2, 2.8, 0.2, -0.3, 0.6, 0.1, -0.1, -0.15, -0.05, 3.14),
};

/* ---------- style library ---------- */
function makeStyle(o) {
  return Object.assign({
    scale: 1, thigh: 27, shin: 27, torso: 34, uarm: 21, farm: 19, headR: 11,
    sw: 10, hw: 8, armW: [4.8, 3.5], legW: [6.4, 4.1], belly: 0,
    body: '#1a1414', dark: '#0c0909', accent: '#e8b850', trim: '#f0c050',
    eye: '#ffd060', eyeGlow: '#ffaa22',
    weapon: null, head: null, torsoX: null, robe: null, back: null, noRim: false, foot: 8,
    armor: false,
  }, o);
}

const STYLES = {
  wukong: makeStyle({
    body: '#1e1410', dark: '#0d0806', accent: '#f0b840', trim: '#ffd868',
    eye: '#fff4a8', eyeGlow: '#ffae20', armor: true,
    weapon: { type: 'staff', len: 140, grip: 0.42, width: 4.5, color: '#f4c654', cap: '#ff5228', glow: '#ffb020' },
    head(ctx, J, S, pass, col, t, o) {
      const h = J.head, r = S.headR;
      // sculpted monkey muzzle + cheek fur + ear
      ctx.beginPath(); ctx.ellipse(h.x + 6.5, h.y + 3.4, 6.8, 5.4, 0.15, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.arc(h.x - 7.5, h.y + 0.5, 4.0, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.moveTo(h.x - 9, h.y - 6); ctx.lineTo(h.x - 16, h.y - 4.5); ctx.lineTo(h.x - 10, h.y - 0.5); ctx.fill();
      if (pass === 'body') {
        // warm facial peach-ink undertone
        ctx.fillStyle = rgba('#5a3222', 0.55);
        ctx.beginPath(); ctx.ellipse(h.x + 5.5, h.y + 2.8, 5.2, 4.2, 0.15, 0, TAU); ctx.fill();
        // 紧箍咒 / 凤翅紫金冠 crown
        ctx.strokeStyle = '#ffd258'; ctx.lineWidth = 2.8;
        ctx.beginPath(); ctx.arc(h.x, h.y, r + 0.6, -2.75, -0.4); ctx.stroke();
        // twin ornate crown side-wings (凤翅)
        ctx.fillStyle = '#e8b038';
        ctx.beginPath();
        ctx.moveTo(h.x - 3, h.y - r + 1);
        ctx.quadraticCurveTo(h.x - 13, h.y - r - 6, h.x - 17, h.y - r + 1);
        ctx.quadraticCurveTo(h.x - 9, h.y - r + 3, h.x - 2, h.y - r + 2);
        ctx.fill();
        // crimson forehead gem
        ctx.fillStyle = '#ff3828';
        ctx.beginPath(); ctx.arc(h.x + 4, h.y - r + 0.5, 2.4, 0, TAU); ctx.fill();
        // 雉鸡双翎 (long ornate banded pheasant feathers)
        const sway = Math.sin(t * 3.1) * 4.5 + (o.sway || 0);
        ctx.lineCap = 'round';
        for (let k = 0; k < 2; k++) {
          const ox = k * 4.5, oy = k * 1.5;
          const x0 = h.x + 1 + ox, y0 = h.y - r;
          const cx1 = h.x - 8 + ox, cy1 = h.y - r - 38;
          const cx2 = h.x - 32 + ox + sway, cy2 = h.y - r - 56;
          const x1 = h.x - 58 + sway * 2.1 + ox, y1 = h.y - r - 32 + sway + oy;
          ctx.strokeStyle = k ? '#c87020' : '#ffcf54';
          ctx.lineWidth = 2.1;
          ctx.beginPath(); ctx.moveTo(x0, y0); ctx.bezierCurveTo(cx1, cy1, cx2, cy2, x1, y1); ctx.stroke();
          // glowing ember tip & dark bands along feather
          ctx.strokeStyle = rgba('#3a1408', 0.85);
          ctx.lineWidth = 1.6;
          ctx.setLineDash([4, 6]);
          ctx.beginPath(); ctx.moveTo(x0, y0); ctx.bezierCurveTo(cx1, cy1, cx2, cy2, x1, y1); ctx.stroke();
          ctx.setLineDash([]);
          ctx.globalCompositeOperation = 'lighter';
          drawGlow(ctx, x1, y1, 7, '#ff9830', 0.65);
          ctx.globalCompositeOperation = 'source-over';
        }
      }
    },
    torsoX(ctx, J, S, pass, col, t) {
      if (pass !== 'body') return;
      const n = J.neck, hp = J.hip, f = J.fwd;
      // 锁子黄金甲 chest armor plating
      const cg = ctx.createLinearGradient(n.x - 8, n.y, hp.x + 8, hp.y);
      cg.addColorStop(0, '#c89230'); cg.addColorStop(0.5, '#6a4416'); cg.addColorStop(1, '#2a180a');
      ctx.fillStyle = cg;
      ctx.beginPath();
      ctx.moveTo(n.x - f.x * 8, n.y + 2);
      ctx.lineTo(n.x + f.x * 8, n.y + 3);
      ctx.lineTo(lerp(n.x, hp.x, 0.62) + f.x * 9, lerp(n.y, hp.y, 0.62));
      ctx.lineTo(lerp(n.x, hp.x, 0.65) - f.x * 8, lerp(n.y, hp.y, 0.65));
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#ffd668'; ctx.lineWidth = 1.3;
      ctx.stroke();
      // shoulder吞肩兽 pauldron
      ctx.fillStyle = '#d49a34';
      ctx.beginPath(); ctx.ellipse(J.sh.x - f.x * 1, J.sh.y + 2, 7.5, 5, J.lean - 0.15, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#ffe588'; ctx.lineWidth = 1.2; ctx.stroke();
      // tiger-skin skirt with fur pattern
      ctx.fillStyle = '#9a561a';
      ctx.beginPath();
      ctx.moveTo(hp.x - f.x * 10.5, hp.y - f.y * 10 - 3);
      ctx.lineTo(hp.x + f.x * 10.5, hp.y + f.y * 10 - 3);
      ctx.lineTo(hp.x + f.x * 13 + 3, hp.y + 14);
      ctx.lineTo(hp.x - f.x * 13 - 4, hp.y + 12);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#180a04'; ctx.lineWidth = 1.7;
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath(); ctx.moveTo(hp.x + i * 6.5, hp.y); ctx.lineTo(hp.x + i * 6.5 + 2.5, hp.y + 9.5); ctx.stroke();
      }
      // golden waist buckle & gem
      ctx.strokeStyle = '#ffd258'; ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.moveTo(hp.x - f.x * 10, hp.y - f.y * 10 - 3); ctx.lineTo(hp.x + f.x * 10, hp.y + f.y * 10 - 3); ctx.stroke();
      ctx.fillStyle = '#ff4422';
      ctx.beginPath(); ctx.arc(hp.x + f.x * 5, hp.y - 3, 2.3, 0, TAU); ctx.fill();
    },
    cloth: { kind: 'scarf', color: '#b81a24', color2: '#ff6a3a', n: 10, seg: 7, width: 6 },
  }),

  bajie: makeStyle({
    scale: 1.13, thigh: 23, shin: 23, torso: 34, uarm: 20, farm: 18, headR: 12.8,
    sw: 12.5, hw: 11.5, armW: [5.8, 4.4], legW: [7.2, 5.0], belly: 1.05,
    body: '#171420', dark: '#0b0910', accent: '#68b4e8', trim: '#92d8ff',
    eye: '#d6f6ff', eyeGlow: '#5ac8ff', armor: true,
    weapon: { type: 'rake', len: 122, grip: 0.36, width: 4.3, color: '#d4e8f6', cap: '#5aa8e0', glow: '#5ac8ff' },
    head(ctx, J, S, pass, col) {
      const h = J.head;
      // snout + curved tusks
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(h.x + 7, h.y - 1, 11.5, 10.5, 4.5); else ctx.rect(h.x + 7, h.y - 1, 11.5, 10.5);
      ctx.fill();
      // floppy ear
      ctx.beginPath(); ctx.moveTo(h.x - 3, h.y - 10); ctx.quadraticCurveTo(h.x + 9, h.y - 17, h.x + 7, h.y - 4); ctx.lineTo(h.x - 2, h.y - 4); ctx.fill();
      // monk helmet cap
      ctx.beginPath(); ctx.arc(h.x - 1, h.y - 3, 12.8, PI * 1.05, PI * 1.85); ctx.lineTo(h.x - 1, h.y - 3); ctx.fill();
      if (pass === 'body') {
        // snout nostrils & ivory tusk
        ctx.fillStyle = '#3c3048';
        ctx.beginPath(); ctx.arc(h.x + 15.5, h.y + 3, 1.3, 0, TAU); ctx.arc(h.x + 15.5, h.y + 6.5, 1.3, 0, TAU); ctx.fill();
        ctx.fillStyle = '#f4eedc';
        ctx.beginPath(); ctx.moveTo(h.x + 9, h.y + 9); ctx.quadraticCurveTo(h.x + 15, h.y + 11, h.x + 14, h.y + 4); ctx.lineTo(h.x + 11, h.y + 8); ctx.fill();
        // cap silver-azure rim + jewel
        ctx.strokeStyle = '#6ab2e8'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(h.x - 1, h.y - 3, 12.8, PI * 1.05, PI * 1.85); ctx.stroke();
        ctx.fillStyle = '#5ac8ff';
        ctx.beginPath(); ctx.arc(h.x + 6, h.y - 11, 2.2, 0, TAU); ctx.fill();
      }
    },
    torsoX(ctx, J, S, pass, col) {
      if (pass !== 'body') return;
      const n = J.neck, hp = J.hip, f = J.fwd;
      // 天蓬玄铁重甲 chest + shoulder plate
      const ag = ctx.createLinearGradient(n.x, n.y, hp.x, hp.y);
      ag.addColorStop(0, '#3a4a66'); ag.addColorStop(0.55, '#1d2436'); ag.addColorStop(1, '#10121e');
      ctx.fillStyle = ag;
      ctx.beginPath();
      ctx.moveTo(n.x - f.x * 10, n.y + 3);
      ctx.lineTo(n.x + f.x * 10, n.y + 4);
      ctx.lineTo(hp.x + f.x * 17, hp.y - 7);
      ctx.lineTo(hp.x - f.x * 10, hp.y - 6);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#70b4e8'; ctx.lineWidth = 1.4; ctx.stroke();
      // heavy pauldron
      ctx.fillStyle = '#486082';
      ctx.beginPath(); ctx.ellipse(J.sh.x, J.sh.y + 2, 8.5, 5.5, J.lean, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#92d8ff'; ctx.lineWidth = 1.2; ctx.stroke();
      // armored sash belt over belly
      ctx.strokeStyle = '#4a8ec2'; ctx.lineWidth = 3.2;
      ctx.beginPath(); ctx.moveTo(hp.x - f.x * 11.5, hp.y - 6); ctx.quadraticCurveTo(hp.x + f.x * 17, hp.y - 1, hp.x + f.x * 21, hp.y - 9); ctx.stroke();
    },
    cloth: { kind: 'sash', color: '#24486e', color2: '#5ac8ff', n: 7, seg: 6, width: 4.5, anchor: 'hip' },
  }),

  sha: makeStyle({
    scale: 1.07, headR: 11.6, sw: 11.5, hw: 9.2, armW: [5.2, 3.9], legW: [6.4, 4.3],
    body: '#0f1816', dark: '#070b0a', accent: '#3ae0b0', trim: '#88ffe0',
    eye: '#d0fff4', eyeGlow: '#3ae0b0', armor: true,
    weapon: { type: 'spade', len: 132, grip: 0.4, width: 4.2, color: '#b4f2e2', cap: '#3ae0b0', glow: '#3ae0b0' },
    head(ctx, J, S, pass, col) {
      const h = J.head;
      // wild hair mane
      ctx.beginPath(); ctx.moveTo(h.x - 4, h.y - 10); ctx.lineTo(h.x - 18, h.y - 16); ctx.lineTo(h.x - 10, h.y - 6); ctx.lineTo(h.x - 21, h.y - 3); ctx.lineTo(h.x - 10, h.y + 2); ctx.fill();
      // sculpted thick beard
      ctx.beginPath(); ctx.moveTo(h.x - 2, h.y + 5); ctx.lineTo(h.x + 9.5, h.y + 6); ctx.lineTo(h.x + 8, h.y + 18); ctx.lineTo(h.x + 3.5, h.y + 13); ctx.lineTo(h.x, h.y + 19); ctx.lineTo(h.x - 3.5, h.y + 11); ctx.fill();
      if (pass === 'body') {
        // crimson headband + gold clasp
        ctx.strokeStyle = '#c83428'; ctx.lineWidth = 2.8;
        ctx.beginPath(); ctx.arc(h.x, h.y, 11.8, -2.65, -0.25); ctx.stroke();
        ctx.fillStyle = '#3ae0b0';
        ctx.beginPath(); ctx.arc(h.x + 8, h.y - 7.5, 2.1, 0, TAU); ctx.fill();
      }
    },
    torsoX(ctx, J, S, pass, col, t) {
      if (pass !== 'body') return;
      const n = J.neck, hp = J.hip, f = J.fwd;
      // jade-bronze monastic chest armor
      const sg = ctx.createLinearGradient(n.x, n.y, hp.x, hp.y);
      sg.addColorStop(0, '#204a42'); sg.addColorStop(1, '#0b1815');
      ctx.fillStyle = sg;
      ctx.beginPath();
      ctx.moveTo(n.x - f.x * 8, n.y + 2); ctx.lineTo(n.x + f.x * 8, n.y + 2);
      ctx.lineTo(hp.x + f.x * 7, hp.y - 4); ctx.lineTo(hp.x - f.x * 8, hp.y - 4);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = rgba('#3ae0b0', 0.65); ctx.lineWidth = 1.2; ctx.stroke();
      // 9 骷髅念珠 skull necklace with glowing jade eye dots
      for (let i = 0; i < 7; i++) {
        const a = (i / 6) * PI;
        const x = n.x + f.x * Math.cos(a) * 9.5 - 0.5, y = n.y + 5 + Math.sin(a) * 8;
        ctx.fillStyle = '#dcd6c2';
        ctx.beginPath(); ctx.arc(x, y, 2.7, 0, TAU); ctx.fill();
        ctx.fillStyle = '#142a24';
        ctx.fillRect(x - 1, y - 0.5, 1, 1); ctx.fillRect(x + 0.5, y - 0.5, 1, 1);
      }
      // waist jade-plate & crimson cord
      ctx.strokeStyle = '#c03a2a'; ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.moveTo(hp.x - f.x * 9, hp.y - 3); ctx.lineTo(hp.x + f.x * 9, hp.y - 3); ctx.stroke();
    },
    cloth: { kind: 'sash', color: '#7a1a14', color2: '#d84a32', n: 8, seg: 6, width: 5, anchor: 'hip' },
  }),

  tang: makeStyle({
    headR: 11, sw: 10, hw: 9.5,
    body: '#221810', dark: '#110c07', accent: '#ffd060', trim: '#ffe898',
    eye: '#fff8d0', eyeGlow: '#ffd060',
    weapon: { type: 'tin', len: 122, grip: 0.46, width: 3.7, color: '#f6d068', cap: '#fff0b0', glow: '#ffd060' },
    halo: '#ffd870',
    head(ctx, J, S, pass, col) {
      const h = J.head;
      // 毗卢帽 ornate 5-petal golden crown
      for (let i = 0; i < 5; i++) {
        const a = -PI * 0.92 + i * (PI * 0.84 / 4);
        const x = h.x + Math.cos(a) * 9.5, y = h.y + Math.sin(a) * 9.5;
        ctx.save(); ctx.translate(x, y); ctx.rotate(a + PI / 2);
        ctx.fillStyle = pass === 'body' ? (i === 2 ? '#ffe078' : '#e0a838') : col;
        ctx.beginPath(); ctx.moveTo(-3.8, 2); ctx.quadraticCurveTo(-3.8, -7.5, 0, -9.8); ctx.quadraticCurveTo(3.8, -7.5, 3.8, 2); ctx.fill();
        if (pass === 'body') { ctx.strokeStyle = '#fff2b0'; ctx.lineWidth = 0.8; ctx.stroke(); }
        ctx.restore();
      }
      ctx.fillStyle = col;
    },
    robe: { color: '#941c16', color2: '#4e0c0a', trim: '#f4c654' },
    torsoX(ctx, J, S, pass, col) {
      if (pass !== 'body') return;
      // 锦襕袈裟 diagonal brocade kasaya sash
      const n = J.neck, hp = J.hip, f = J.fwd;
      const kg = ctx.createLinearGradient(n.x - 10, n.y, hp.x + 10, hp.y);
      kg.addColorStop(0, '#c0281e'); kg.addColorStop(1, '#781410');
      ctx.fillStyle = kg;
      ctx.beginPath();
      ctx.moveTo(n.x - f.x * 9.5, n.y + 1); ctx.lineTo(n.x + f.x * 4.5, n.y);
      ctx.lineTo(hp.x + f.x * 10.5, hp.y - 4); ctx.lineTo(hp.x - f.x * 3.5, hp.y + 2); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#f8d068'; ctx.lineWidth = 1.6; ctx.stroke();
      // golden dharma clasp at chest
      const cx = lerp(n.x, hp.x, 0.32), cy = lerp(n.y, hp.y, 0.32);
      ctx.fillStyle = '#ffe078';
      ctx.beginPath(); ctx.arc(cx + f.x * 2, cy, 3.2, 0, TAU); ctx.fill();
      ctx.fillStyle = '#ff4a28';
      ctx.beginPath(); ctx.arc(cx + f.x * 2, cy, 1.4, 0, TAU); ctx.fill();
    },
    cloth: { kind: 'sash', color: '#a8241c', color2: '#f6cc5c', n: 9, seg: 7, width: 5.2, anchor: 'hip' },
  }),

  bailong: makeStyle({
    headR: 10.5, sw: 9.8, hw: 7.8, armW: [4.4, 3.3], legW: [5.8, 3.9],
    body: '#223040', dark: '#101822', accent: '#78dcff', trim: '#d8f6ff',
    eye: '#ecfbff', eyeGlow: '#6ad0ff', armor: true,
    weapon: { type: 'sword', len: 76, grip: 0.12, width: 3.6, color: '#eefaff', cap: '#7cd8ff', glow: '#6ad0ff' },
    head(ctx, J, S, pass, col) {
      const h = J.head;
      // sculpted hair mass
      ctx.beginPath(); ctx.arc(h.x - 2, h.y - 1, 11.6, PI * 0.55, PI * 1.9); ctx.fill();
      if (pass === 'body') {
        // glowing crystal dragon horns with branching tines
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#9ae8ff'; ctx.lineWidth = 2.4;
        ctx.beginPath(); ctx.moveTo(h.x - 1, h.y - 10); ctx.quadraticCurveTo(h.x - 7, h.y - 21, h.x - 16, h.y - 24); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(h.x - 6, h.y - 16); ctx.lineTo(h.x - 3, h.y - 23); ctx.stroke();
        ctx.strokeStyle = '#62bce6'; ctx.lineWidth = 1.9;
        ctx.beginPath(); ctx.moveTo(h.x + 3.5, h.y - 9); ctx.quadraticCurveTo(h.x + 2, h.y - 18, h.x - 4.5, h.y - 21); ctx.stroke();
        // silver hair clasp
        ctx.fillStyle = '#e8f4fc';
        ctx.fillRect(h.x - 10.5, h.y - 6.5, 4.5, 2.8);
      }
    },
    torsoX(ctx, J, S, pass, col) {
      if (pass !== 'body') return;
      const n = J.neck, hp = J.hip, f = J.fwd;
      // white-silver dragonscale coat lapel + azure trim
      const dg = ctx.createLinearGradient(n.x, n.y, hp.x, hp.y);
      dg.addColorStop(0, '#eef6fc'); dg.addColorStop(1, '#84a8c4');
      ctx.fillStyle = dg;
      ctx.beginPath(); ctx.moveTo(n.x - f.x * 3, n.y); ctx.lineTo(n.x + f.x * 7, n.y + 1); ctx.lineTo(hp.x + f.x * 2, hp.y - 2); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#7cd8ff'; ctx.lineWidth = 1.2; ctx.stroke();
      // sleek dragon-wing shoulder pauldron
      ctx.fillStyle = '#5a7e9e';
      ctx.beginPath(); ctx.ellipse(J.sh.x, J.sh.y + 2, 7, 4.2, J.lean - 0.1, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#c6ecff'; ctx.lineWidth = 1.1; ctx.stroke();
    },
    cloth: { kind: 'hair', color: '#d8eaf6', color2: '#ffffff', n: 10, seg: 7, width: 5.5, anchor: 'head' },
  }),

  /* ------------- enemies ------------- */
  imp: makeStyle({
    scale: 0.86, headR: 10, sw: 9, hw: 7, body: '#180c0c', dark: '#0a0505', accent: '#ff7020',
    eye: '#ffc048', eyeGlow: '#ff5a10',
    weapon: { type: 'spear', len: 98, grip: 0.5, width: 2.7, color: '#422c26', cap: '#ff8030', glow: '#ff5a10' },
    head(ctx, J, S, pass, col) {
      const h = J.head;
      ctx.beginPath(); ctx.moveTo(h.x - 2, h.y - 8); ctx.quadraticCurveTo(h.x - 8, h.y - 21, h.x - 17, h.y - 18); ctx.lineTo(h.x - 6, h.y - 4); ctx.fill();
      ctx.beginPath(); ctx.moveTo(h.x + 3, h.y - 9); ctx.quadraticCurveTo(h.x + 4, h.y - 21, h.x - 2, h.y - 25); ctx.lineTo(h.x + 7, h.y - 6); ctx.fill();
      ctx.beginPath(); ctx.moveTo(h.x + 6, h.y + 2); ctx.lineTo(h.x + 14, h.y + 5); ctx.lineTo(h.x + 5, h.y + 8); ctx.fill();
    },
    torsoX(ctx, J, S, pass, col, t) {
      if (pass !== 'body') return;
      ctx.strokeStyle = rgba('#ff6a1a', 0.8 + 0.2 * Math.sin(t * 6)); ctx.lineWidth = 1.4;
      const n = J.neck, hp = J.hip;
      ctx.beginPath();
      ctx.moveTo(lerp(n.x, hp.x, 0.2), lerp(n.y, hp.y, 0.2));
      ctx.lineTo(lerp(n.x, hp.x, 0.45) + 4, lerp(n.y, hp.y, 0.45));
      ctx.lineTo(lerp(n.x, hp.x, 0.7) - 2, lerp(n.y, hp.y, 0.7));
      ctx.stroke();
    },
  }),
  skeleton: makeStyle({
    scale: 0.96, headR: 9.5, sw: 8, hw: 6, armW: [2.7, 2.2], legW: [3.1, 2.4], noTorso: true, noRim: true,
    body: '#d6ccb4', dark: '#8c8472', accent: '#3ae8d8', eye: '#80fff0', eyeGlow: '#20d0c0',
    weapon: { type: 'sword', len: 56, grip: 0.12, width: 3.3, color: '#9a9a90', cap: '#4e3c2c', glow: '#20d0c0', dull: true },
    head(ctx, J, S, pass, col) {
      const h = J.head;
      ctx.fillRect(h.x - 2, h.y + 4, 10, 6);
      ctx.fillStyle = '#0a0a0a';
      ctx.beginPath(); ctx.arc(h.x + 4, h.y - 1, 2.9, 0, TAU); ctx.fill();
      ctx.fillRect(h.x + 1, h.y + 7, 7, 1.3);
      ctx.fillStyle = col;
    },
    torsoX(ctx, J, S, pass, col) {
      const n = J.neck, hp = J.hip, f = J.fwd;
      ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(n.x, n.y); ctx.lineTo(hp.x, hp.y); ctx.stroke();
      ctx.lineWidth = 2;
      for (let i = 0; i < 4; i++) {
        const k = 0.15 + i * 0.15;
        const x = lerp(n.x, hp.x, k), y = lerp(n.y, hp.y, k);
        ctx.beginPath(); ctx.ellipse(x + f.x * 2, y, 8 - i, 2.4, J.lean, PI, TAU); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(x + f.x * 2, y, 8 - i, 2.4, J.lean, 0, PI); ctx.stroke();
      }
      ctx.beginPath(); ctx.ellipse(hp.x, hp.y, 7, 3.5, 0, 0, TAU); ctx.stroke();
    },
  }),
  soldier: makeStyle({
    scale: 1.07, headR: 10.6, sw: 11, hw: 8.6, armW: [5.1, 3.9], legW: [6.3, 4.4],
    body: '#2a2644', dark: '#151328', accent: '#f0c860', trim: '#ffe698',
    eye: '#ffeba8', eyeGlow: '#ffc040', armor: true,
    weapon: { type: 'halberd', len: 132, grip: 0.4, width: 3.3, color: '#f0cc6a', cap: '#ff4232', glow: '#ffc040' },
    head(ctx, J, S, pass, col) {
      const h = J.head;
      ctx.beginPath(); ctx.arc(h.x, h.y - 1, 12.2, PI, TAU); ctx.lineTo(h.x + 14.5, h.y + 1); ctx.lineTo(h.x - 13.5, h.y + 1); ctx.fill();
      if (pass === 'body') {
        ctx.fillStyle = '#e0b854'; ctx.fillRect(h.x - 13.5, h.y - 1, 28, 2.6);
        ctx.fillStyle = '#d42c26';
        ctx.beginPath(); ctx.moveTo(h.x, h.y - 13); ctx.quadraticCurveTo(h.x - 14, h.y - 26, h.x - 23, h.y - 12); ctx.quadraticCurveTo(h.x - 10, h.y - 16, h.x, h.y - 13); ctx.fill();
        ctx.fillStyle = '#0a0814'; ctx.fillRect(h.x + 1, h.y + 1, 10, 6);
      }
    },
    torsoX(ctx, J, S, pass) {
      if (pass !== 'body') return;
      const n = J.neck, hp = J.hip, f = J.fwd;
      ctx.strokeStyle = '#e0b854'; ctx.lineWidth = 1.7;
      for (let i = 1; i < 4; i++) {
        const k = i / 4;
        ctx.beginPath(); ctx.moveTo(lerp(n.x, hp.x, k) - f.x * 9, lerp(n.y, hp.y, k)); ctx.lineTo(lerp(n.x, hp.x, k) + f.x * 9, lerp(n.y, hp.y, k)); ctx.stroke();
      }
      ctx.fillStyle = '#524b72';
      ctx.beginPath(); ctx.ellipse(J.sh.x, J.sh.y + 2, 7.5, 5, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#f0c860'; ctx.lineWidth = 1.1; ctx.stroke();
    },
  }),
  brute: makeStyle({
    scale: 1.56, headR: 9.2, sw: 15.5, hw: 11.5, thigh: 24, shin: 22, torso: 36, uarm: 24, farm: 22,
    armW: [7.8, 6.6], legW: [8.4, 6.2], belly: 0.82,
    body: '#180d0a', dark: '#0a0504', accent: '#ff7020', eye: '#ffd040', eyeGlow: '#ff6a10', armor: true,
    weapon: { type: 'club', len: 88, grip: 0.12, width: 7.4, color: '#2e1c16', cap: '#ff7222', glow: '#ff5a10' },
    head(ctx, J, S, pass, col) {
      const h = J.head;
      ctx.beginPath(); ctx.moveTo(h.x - 6, h.y - 6); ctx.lineTo(h.x - 13, h.y - 17); ctx.lineTo(h.x - 2, h.y - 9); ctx.fill();
      ctx.beginPath(); ctx.moveTo(h.x + 3, h.y + 3); ctx.lineTo(h.x + 13, h.y + 4); ctx.lineTo(h.x + 4, h.y + 10); ctx.fill();
    },
    torsoX(ctx, J, S, pass, col, t) {
      if (pass !== 'body') return;
      const n = J.neck, hp = J.hip;
      ctx.strokeStyle = rgba('#ff5a10', 0.72 + 0.28 * Math.sin(t * 4)); ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(lerp(n.x, hp.x, 0.1) + 3, lerp(n.y, hp.y, 0.1));
      ctx.lineTo(lerp(n.x, hp.x, 0.35) + 9, lerp(n.y, hp.y, 0.35));
      ctx.lineTo(lerp(n.x, hp.x, 0.55) + 2, lerp(n.y, hp.y, 0.55));
      ctx.lineTo(lerp(n.x, hp.x, 0.85) + 10, lerp(n.y, hp.y, 0.85));
      ctx.stroke();
    },
  }),
  yaksha: makeStyle({
    scale: 1.18, headR: 10.5, sw: 12, hw: 8.5, armW: [5.5, 4.2], legW: [6.4, 4.2],
    body: '#121826', dark: '#080c14', accent: '#60e6ff', trim: '#b8f4ff',
    eye: '#d6f8ff', eyeGlow: '#40d8ff', armor: true,
    weapon: { type: 'spade', len: 122, grip: 0.42, width: 3.6, color: '#86e2ff', cap: '#40d8ff', glow: '#40d8ff' },
    head(ctx, J, S, pass) {
      const h = J.head;
      ctx.beginPath(); ctx.moveTo(h.x - 4, h.y - 8); ctx.lineTo(h.x - 16, h.y - 22); ctx.lineTo(h.x + 1, h.y - 10); ctx.fill();
      ctx.beginPath(); ctx.moveTo(h.x + 5, h.y - 8); ctx.lineTo(h.x + 12, h.y - 20); ctx.lineTo(h.x + 8, h.y - 5); ctx.fill();
    },
    torsoX(ctx, J, S, pass) {
      if (pass !== 'body') return;
      ctx.strokeStyle = rgba('#40d8ff', 0.75); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.ellipse(J.sh.x, J.sh.y + 3, 7, 4.5, J.lean, 0, TAU); ctx.stroke();
    },
  }),
};
STYLES.archer = makeStyle(Object.assign({}, STYLES.skeleton, { weapon: { type: 'bow', len: 62, grip: 0.5, width: 2.2, color: '#786648', cap: '#80fff0', glow: '#20d0c0' } }));
STYLES.archerGold = makeStyle(Object.assign({}, STYLES.soldier, { weapon: { type: 'bow', len: 68, grip: 0.5, width: 2.5, color: '#f0ca68', cap: '#fff2a8', glow: '#ffc040' } }));

/* ---------- forward kinematics ---------- */
function solveRig(pose, S, grounded) {
  const lean = pose[0];
  const J = { lean };
  const up = { x: Math.sin(lean), y: -Math.cos(lean) };
  J.fwd = { x: Math.cos(lean), y: Math.sin(lean) };
  const hip = { x: 0, y: 0 };
  const limb = (o, a1, a2, l1, l2) => {
    const j1 = { x: o.x + Math.sin(a1) * l1, y: o.y + Math.cos(a1) * l1 };
    const j2 = { x: j1.x + Math.sin(a1 + a2) * l2, y: j1.y + Math.cos(a1 + a2) * l2 };
    return [j1, j2];
  };
  J.hip = hip;
  J.neck = { x: hip.x + up.x * S.torso, y: hip.y + up.y * S.torso };
  J.head = { x: J.neck.x + Math.sin(lean + pose[2]) * (S.headR + 3), y: J.neck.y - Math.cos(lean + pose[2]) * (S.headR + 3) };
  J.sh = { x: lerp(J.neck.x, hip.x, 0.08), y: lerp(J.neck.y, hip.y, 0.08) };
  [J.elF, J.hand] = limb(J.sh, pose[3] + lean, pose[4], S.uarm, S.farm);
  [J.elB, J.handB] = limb(J.sh, pose[5] + lean, pose[6], S.uarm, S.farm);
  [J.knF, J.anF] = limb(hip, pose[7], pose[8], S.thigh, S.shin);
  [J.knB, J.anB] = limb(hip, pose[9], pose[10], S.thigh, S.shin);
  let oy;
  if (grounded) oy = -Math.max(J.anF.y, J.anB.y) - 2.5;
  else oy = -(S.thigh + S.shin) * 0.92;
  oy += pose[1];
  for (const k of ['hip', 'neck', 'head', 'sh', 'elF', 'hand', 'elB', 'handB', 'knF', 'anF', 'knB', 'anB']) J[k].y += oy;
  const wa = pose[11];
  J.wdx = Math.sin(wa); J.wdy = Math.cos(wa); J.wa = wa;
  return J;
}

function limbPath(ctx, x1, y1, x2, y2, w1, w2) {
  const dx = x2 - x1, dy = y2 - y1;
  const L = Math.hypot(dx, dy) || 1;
  const nx = -dy / L, ny = dx / L;
  const a = Math.atan2(dy, dx);
  ctx.moveTo(x1 + nx * w1, y1 + ny * w1);
  ctx.lineTo(x2 + nx * w2, y2 + ny * w2);
  ctx.arc(x2, y2, w2, a + PI / 2, a - PI / 2, true);
  ctx.lineTo(x1 - nx * w1, y1 - ny * w1);
  ctx.arc(x1, y1, w1, a - PI / 2, a + PI / 2, true);
}

function drawLimbPair(ctx, o, j1, j2, wa, wb, wc, foot, cuffColor) {
  ctx.beginPath();
  limbPath(ctx, o.x, o.y, j1.x, j1.y, wa, wb * 0.95);
  ctx.fill();
  ctx.beginPath();
  limbPath(ctx, j1.x, j1.y, j2.x, j2.y, wb, wc);
  ctx.fill();
  if (cuffColor) {
    // armor cuff / bracer or greave trim near wrist/ankle
    const mx = lerp(j1.x, j2.x, 0.58), my = lerp(j1.y, j2.y, 0.58);
    const dx = j2.x - j1.x, dy = j2.y - j1.y, L = Math.hypot(dx, dy) || 1;
    const nx = -dy / L, ny = dx / L;
    ctx.strokeStyle = cuffColor;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(mx - nx * wb, my - ny * wb);
    ctx.lineTo(mx + nx * wb, my + ny * wb);
    ctx.stroke();
  }
  if (foot) {
    ctx.beginPath();
    ctx.moveTo(j2.x - 3.5, j2.y - 3);
    ctx.lineTo(j2.x + foot, j2.y + 1.2);
    ctx.lineTo(j2.x + foot - 1.2, j2.y + 3.4);
    ctx.lineTo(j2.x - 4.5, j2.y + 3.4);
    ctx.closePath();
    ctx.fill();
  }
}

function drawTorso(ctx, J, S, pass, baseCol) {
  const f = J.fwd, hp = J.hip, n = J.neck;
  const hw = S.hw, sw = S.sw;
  ctx.beginPath();
  ctx.moveTo(hp.x - f.x * hw, hp.y - f.y * hw);
  ctx.quadraticCurveTo(lerp(hp.x, n.x, 0.5) - f.x * (sw + 1.4), lerp(hp.y, n.y, 0.5) - f.y * (sw + 1.4), n.x - f.x * sw, n.y - f.y * sw);
  ctx.quadraticCurveTo(n.x, n.y - 4.5, n.x + f.x * sw * 0.88, n.y + f.y * sw * 0.88);
  const bx = lerp(hp.x, n.x, 0.4) + f.x * (sw + S.belly * 16), by = lerp(hp.y, n.y, 0.4) + f.y * (sw + S.belly * 16);
  ctx.quadraticCurveTo(bx, by, hp.x + f.x * hw, hp.y + f.y * hw);
  ctx.quadraticCurveTo(hp.x, hp.y + 6, hp.x - f.x * hw, hp.y - f.y * hw);
  if (pass === 'body' && baseCol === S.body) {
    const g = ctx.createLinearGradient(n.x - 10, n.y, hp.x + 12, hp.y);
    g.addColorStop(0, mix(S.body, S.accent || '#ffffff', 0.14));
    g.addColorStop(0.65, S.body);
    g.addColorStop(1, S.dark);
    ctx.fillStyle = g;
  }
  ctx.fill();
}

function drawRobe(ctx, J, S, pass, col) {
  const hp = J.hip;
  const kF = J.knF, kB = J.knB;
  const bottom = Math.max(kF.y, kB.y) + 15;
  ctx.beginPath();
  ctx.moveTo(hp.x - S.hw - 1, hp.y - 4);
  ctx.lineTo(hp.x + S.hw + 1, hp.y - 4);
  ctx.quadraticCurveTo(Math.max(kF.x, kB.x) + 6, lerp(hp.y, bottom, 0.5), Math.max(kF.x, kB.x) + 10, bottom);
  ctx.lineTo(Math.min(kF.x, kB.x) - 10, bottom + 2.5);
  ctx.quadraticCurveTo(Math.min(kF.x, kB.x) - 6, lerp(hp.y, bottom, 0.5), hp.x - S.hw - 1, hp.y - 4);
  if (pass === 'body' && col === S.robe.color && S.robe.color2) {
    const g = ctx.createLinearGradient(hp.x, hp.y, hp.x, bottom);
    g.addColorStop(0, S.robe.color);
    g.addColorStop(1, S.robe.color2);
    ctx.fillStyle = g;
  }
  ctx.fill();
  return bottom;
}

function drawWeapon(ctx, J, S, t, glowMul = 1) {
  const w = S.weapon;
  if (!w) return;
  const dx = J.wdx, dy = J.wdy, px = -dy, py = dx;
  const hx = J.hand.x, hy = J.hand.y;
  const back = w.len * w.grip, fwd = w.len * (1 - w.grip);
  const bx = hx - dx * back, by = hy - dy * back, tx = hx + dx * fwd, ty = hy + dy * fwd;
  ctx.lineCap = 'round';
  const glow = (wd, a) => {
    if (w.dull) return;
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = rgba(w.glow, a * glowMul);
    ctx.lineWidth = wd;
    ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(tx, ty); ctx.stroke();
    ctx.globalCompositeOperation = 'source-over';
  };
  switch (w.type) {
    case 'staff': {
      glow(w.width * 4.4, 0.22);
      // crimson-iron core shaft
      ctx.strokeStyle = '#5c140e'; ctx.lineWidth = w.width;
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(tx, ty); ctx.stroke();
      // golden end caps + etched bands
      ctx.strokeStyle = w.color; ctx.lineWidth = w.width + 2.4;
      ctx.beginPath(); ctx.moveTo(tx - dx * 24, ty - dy * 24); ctx.lineTo(tx, ty); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(bx + dx * 24, by + dy * 24); ctx.lineTo(bx, by); ctx.stroke();
      ctx.strokeStyle = w.cap; ctx.lineWidth = 2.0;
      for (const k of [10, 20]) {
        ctx.beginPath(); ctx.moveTo(tx - dx * k - px * 4, ty - dy * k - py * 4); ctx.lineTo(tx - dx * k + px * 4, ty - dy * k + py * 4); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(bx + dx * k - px * 4, by + dy * k - py * 4); ctx.lineTo(bx + dx * k + px * 4, by + dy * k + py * 4); ctx.stroke();
      }
      // glowing center rune ring
      ctx.strokeStyle = '#fff0a0'; ctx.lineWidth = 1.4;
      const mx = lerp(bx, tx, 0.45), my = lerp(by, ty, 0.45);
      ctx.beginPath(); ctx.moveTo(mx - px * 4, my - py * 4); ctx.lineTo(mx + px * 4, my + py * 4); ctx.stroke();
      ctx.globalCompositeOperation = 'lighter';
      drawGlow(ctx, tx, ty, 19, w.glow, 0.7 * glowMul);
      drawGlow(ctx, bx, by, 14, w.glow, 0.45 * glowMul);
      ctx.globalCompositeOperation = 'source-over';
      break;
    }
    case 'rake': {
      glow(w.width * 3.8, 0.18);
      ctx.strokeStyle = '#3c3028'; ctx.lineWidth = w.width;
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(tx, ty); ctx.stroke();
      // dragon-collar gem
      ctx.fillStyle = w.cap;
      ctx.beginPath(); ctx.arc(tx - dx * 4, ty - dy * 4, 4.5, 0, TAU); ctx.fill();
      // crescent rake crossbeam
      const hw = 19;
      ctx.strokeStyle = w.color; ctx.lineWidth = 5.2;
      ctx.beginPath(); ctx.moveTo(tx - px * hw, ty - py * hw); ctx.quadraticCurveTo(tx + dx * 4, ty + dy * 4, tx + px * hw, ty + py * hw); ctx.stroke();
      // 9 gleaming curved teeth
      ctx.strokeStyle = '#eef8ff'; ctx.lineWidth = 2.4;
      for (let i = 0; i < 9; i++) {
        const k = -hw + (i * hw * 2) / 8;
        const sx = tx + px * k, sy = ty + py * k;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.quadraticCurveTo(sx + dx * 8, sy + dy * 8, sx + dx * 13 + px * (k * 0.08), sy + dy * 13 + py * (k * 0.08));
        ctx.stroke();
      }
      ctx.globalCompositeOperation = 'lighter';
      drawGlow(ctx, tx, ty, 28, w.glow, 0.6 * glowMul);
      ctx.globalCompositeOperation = 'source-over';
      break;
    }
    case 'spade': {
      glow(w.width * 3.8, 0.18);
      ctx.strokeStyle = '#362d24'; ctx.lineWidth = w.width;
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(tx, ty); ctx.stroke();
      // crimson tassel near neck
      ctx.strokeStyle = '#d42c24'; ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.moveTo(tx - dx * 12, ty - dy * 12); ctx.lineTo(tx - dx * 16 + px * 7, ty - dy * 16 + py * 7 + 4); ctx.stroke();
      // crescent blade at tip
      ctx.fillStyle = w.color;
      ctx.save(); ctx.translate(tx, ty); ctx.rotate(Math.atan2(dy, dx));
      ctx.beginPath(); ctx.arc(4, 0, 16, -PI / 2 - 0.35, PI / 2 + 0.35); ctx.arc(-2, 0, 12.5, PI / 2 + 0.25, -PI / 2 - 0.25, true); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.1; ctx.stroke();
      ctx.restore();
      // spade at butt
      ctx.fillStyle = w.color;
      ctx.save(); ctx.translate(bx, by); ctx.rotate(Math.atan2(-dy, -dx));
      ctx.beginPath(); ctx.moveTo(0, -4.5); ctx.lineTo(15, -9); ctx.lineTo(18, 0); ctx.lineTo(15, 9); ctx.lineTo(0, 4.5); ctx.closePath(); ctx.fill();
      ctx.restore();
      ctx.globalCompositeOperation = 'lighter';
      drawGlow(ctx, tx, ty, 28, w.glow, 0.6 * glowMul);
      ctx.globalCompositeOperation = 'source-over';
      break;
    }
    case 'tin': {
      glow(w.width * 4.2, 0.18);
      ctx.strokeStyle = w.color; ctx.lineWidth = w.width;
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(tx, ty); ctx.stroke();
      // lotus collar
      ctx.fillStyle = '#ffe588';
      ctx.beginPath(); ctx.arc(tx, ty, 4.2, 0, TAU); ctx.fill();
      const cx = tx + dx * 10, cy = ty + dy * 10;
      ctx.strokeStyle = w.color; ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.ellipse(cx, cy, 9.5, 11.5, Math.atan2(dy, dx) + PI / 2, 0, TAU); ctx.stroke();
      ctx.strokeStyle = '#fff4c0'; ctx.lineWidth = 1.5;
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * TAU + t * 2.2;
        ctx.beginPath(); ctx.arc(cx + Math.cos(a) * 9.5, cy + Math.sin(a) * 9.5, 2.5, 0, TAU); ctx.stroke();
      }
      ctx.globalCompositeOperation = 'lighter';
      drawGlow(ctx, cx, cy, 30, w.glow, 0.7 * glowMul);
      ctx.globalCompositeOperation = 'source-over';
      break;
    }
    case 'sword': {
      const gx = hx + dx * 6, gy = hy + dy * 6;
      if (!w.dull) {
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = rgba(w.glow, 0.3 * glowMul); ctx.lineWidth = 13;
        ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(tx, ty); ctx.stroke();
        ctx.globalCompositeOperation = 'source-over';
      }
      ctx.fillStyle = w.color;
      ctx.beginPath();
      ctx.moveTo(gx + px * w.width, gy + py * w.width);
      ctx.lineTo(tx - dx * 9 + px * w.width * 0.8, ty - dy * 9 + py * w.width * 0.8);
      ctx.lineTo(tx, ty);
      ctx.lineTo(tx - dx * 9 - px * w.width * 0.8, ty - dy * 9 - py * w.width * 0.8);
      ctx.lineTo(gx - px * w.width, gy - py * w.width);
      ctx.closePath(); ctx.fill();
      // fuller / blade ridge
      if (!w.dull) {
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(gx + dx * 3, gy + dy * 3); ctx.lineTo(tx - dx * 4, ty - dy * 4); ctx.stroke();
      }
      ctx.strokeStyle = w.cap; ctx.lineWidth = 3.2;
      ctx.beginPath(); ctx.moveTo(gx - px * 8, gy - py * 8); ctx.lineTo(gx + px * 8, gy + py * 8); ctx.stroke();
      ctx.strokeStyle = '#242c36'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(bx, by); ctx.stroke();
      break;
    }
    case 'spear':
    case 'halberd': {
      glow(w.width * 3.2, 0.14);
      ctx.strokeStyle = w.type === 'halberd' ? '#6e4e2a' : w.color; ctx.lineWidth = w.width;
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(tx, ty); ctx.stroke();
      ctx.fillStyle = w.type === 'halberd' ? w.color : w.cap;
      ctx.beginPath();
      ctx.moveTo(tx + dx * 17, ty + dy * 17); ctx.lineTo(tx + px * 4.5, ty + py * 4.5); ctx.lineTo(tx - px * 4.5, ty - py * 4.5); ctx.closePath(); ctx.fill();
      if (w.type === 'halberd') {
        ctx.beginPath();
        ctx.moveTo(tx - dx * 2 + px * 3, ty - dy * 2 + py * 3);
        ctx.quadraticCurveTo(tx + px * 17, ty + py * 17, tx - dx * 12 + px * 14, ty - dy * 12 + py * 14);
        ctx.lineTo(tx - dx * 8 + px * 3, ty - dy * 8 + py * 3); ctx.closePath(); ctx.fill();
        ctx.fillStyle = w.cap;
        ctx.beginPath(); ctx.arc(tx - dx * 8, ty - dy * 8, 3.2, 0, TAU); ctx.fill();
      }
      ctx.globalCompositeOperation = 'lighter';
      drawGlow(ctx, tx + dx * 8, ty + dy * 8, 15, w.glow, 0.65 * glowMul);
      ctx.globalCompositeOperation = 'source-over';
      break;
    }
    case 'club': {
      ctx.strokeStyle = w.color; ctx.lineWidth = w.width;
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(tx, ty); ctx.stroke();
      ctx.lineWidth = w.width * 2.3;
      ctx.beginPath(); ctx.moveTo(tx - dx * 36, ty - dy * 36); ctx.lineTo(tx, ty); ctx.stroke();
      ctx.strokeStyle = rgba(w.cap, 0.9); ctx.lineWidth = 1.6;
      for (let i = 0; i < 4; i++) {
        const k = 8 + i * 7.5;
        ctx.beginPath(); ctx.moveTo(tx - dx * k - px * 7.5, ty - dy * k - py * 7.5); ctx.lineTo(tx - dx * k + px * 7.5, ty - dy * k + py * 7.5); ctx.stroke();
      }
      break;
    }
    case 'bow': {
      ctx.strokeStyle = w.color; ctx.lineWidth = 2.8;
      const a = Math.atan2(dy, dx);
      ctx.beginPath(); ctx.arc(hx - dx * 8, hy - dy * 8, 27, a - 1.12, a + 1.12); ctx.stroke();
      ctx.strokeStyle = rgba('#ffffff', 0.55); ctx.lineWidth = 0.9;
      const e1x = hx - dx * 8 + Math.cos(a - 1.12) * 27, e1y = hy - dy * 8 + Math.sin(a - 1.12) * 27;
      const e2x = hx - dx * 8 + Math.cos(a + 1.12) * 27, e2y = hy - dy * 8 + Math.sin(a + 1.12) * 27;
      ctx.beginPath(); ctx.moveTo(e1x, e1y); ctx.lineTo(hx - dx * 14, hy - dy * 14); ctx.lineTo(e2x, e2y); ctx.stroke();
      break;
    }
    default: break;
  }
}

/* draw complete rigged character. returns solved joints (local). */
function drawRig(ctx, x, y, dir, pose, S, o = {}) {
  const J = solveRig(pose, S, o.grounded !== false);
  const t = o.t || 0;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(dir * S.scale * (o.sx || 1), S.scale * (o.sy || 1));
  if (o.alpha !== undefined) ctx.globalAlpha = o.alpha;
  // sacred dharma halo (back)
  if (S.halo && !o.flat) {
    ctx.globalCompositeOperation = 'lighter';
    drawGlow(ctx, J.head.x - 3, J.head.y - 2, 38, S.halo, 0.36);
    ctx.strokeStyle = rgba(S.halo, 0.72); ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.arc(J.head.x - 3, J.head.y - 2, 18, 0, TAU); ctx.stroke();
    ctx.strokeStyle = rgba('#fff6c8', 0.45); ctx.lineWidth = 1.2;
    ctx.setLineDash([4, 5]);
    ctx.beginPath(); ctx.arc(J.head.x - 3, J.head.y - 2, 23, t * 0.8, t * 0.8 + TAU); ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalCompositeOperation = 'source-over';
  }
  const passes = [];
  if (o.rim && !S.noRim && !o.flat) passes.push('rim');
  passes.push('body');
  for (const pass of passes) {
    ctx.save();
    let col, dk;
    if (pass === 'rim') { ctx.translate(o.rimDx || -1.7, -1.9); col = dk = o.rim; }
    else { col = o.tint || S.body; dk = o.tint ? o.tint : S.dark; }
    if (o.flat) { col = dk = o.flat; }
    const cuff = pass === 'body' && !o.flat && !o.tint && S.armor ? S.accent : null;
    // back arm
    ctx.fillStyle = dk;
    drawLimbPair(ctx, J.sh, J.elB, J.handB, S.armW[0], S.armW[0] * 0.85, S.armW[1], 0, cuff);
    // back leg
    drawLimbPair(ctx, J.hip, J.knB, J.anB, S.legW[0], S.legW[0] * 0.8, S.legW[1], S.foot, cuff);
    // torso
    ctx.fillStyle = col;
    if (!S.noTorso) drawTorso(ctx, J, S, pass, col);
    if (S.torsoX) { ctx.save(); S.torsoX(ctx, J, S, o.flat ? 'flat' : pass, col, t); ctx.restore(); ctx.fillStyle = col; }
    // front leg
    drawLimbPair(ctx, J.hip, J.knF, J.anF, S.legW[0], S.legW[0] * 0.8, S.legW[1], S.foot, cuff);
    // robe over legs
    if (S.robe) {
      ctx.fillStyle = pass === 'body' && !o.flat && !o.tint ? S.robe.color : col;
      drawRobe(ctx, J, S, pass, pass === 'body' && !o.flat && !o.tint ? S.robe.color : col);
      if (pass === 'body' && !o.flat && !o.tint) { ctx.strokeStyle = S.robe.trim; ctx.lineWidth = 1.5; ctx.stroke(); }
      ctx.fillStyle = col;
    }
    // head
    ctx.beginPath(); ctx.arc(J.head.x, J.head.y, S.headR, 0, TAU); ctx.fill();
    if (S.head) { ctx.save(); S.head(ctx, J, S, o.flat ? 'flat' : pass, col, t, o); ctx.restore(); ctx.fillStyle = col; }
    // weapon (body pass only)
    if (pass === 'body' && !o.noWeapon) { ctx.save(); drawWeapon(ctx, J, S, t, o.flat ? 0.4 : (o.glowMul || 1)); ctx.restore(); ctx.fillStyle = col; }
    // front arm
    ctx.fillStyle = col;
    drawLimbPair(ctx, J.sh, J.elF, J.hand, S.armW[0], S.armW[0] * 0.85, S.armW[1], 0, cuff);
    ctx.beginPath(); ctx.arc(J.hand.x, J.hand.y, S.armW[1] + 0.9, 0, TAU); ctx.fill();
    ctx.restore();
  }
  // glowing eyes
  if (!o.flat || o.eyes) {
    const ex = J.head.x + S.headR * 0.46, ey = J.head.y - 1.5;
    ctx.globalCompositeOperation = 'lighter';
    drawGlow(ctx, ex, ey, 10, o.eyeGlow || S.eyeGlow, 0.92);
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = o.eye || S.eye;
    ctx.beginPath(); ctx.ellipse(ex, ey, 2.5, 1.25, -0.15, 0, TAU); ctx.fill();
  }
  // flash overlay
  if (o.flash > 0) {
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = Math.min(1, o.flash);
    drawGlow(ctx, J.neck.x, J.neck.y + 10, 74, o.flashColor || '#ffffff', 0.95);
    ctx.globalCompositeOperation = 'source-over';
  }
  ctx.restore();
  return J;
}

/* grounded shadow + optional waking aura */
function drawGroundShadow(ctx, x, y, radius, groundY = GROUND) {
  const h = Math.max(0, groundY - y);
  const k = clamp(1 - h / 280, 0.2, 1);
  ctx.save();
  ctx.fillStyle = rgba('#000000', 0.55 * k);
  ctx.beginPath();
  ctx.ellipse(x, groundY + 2, radius * k, radius * 0.22 * k, 0, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function drawAwakenAura(ctx, x, y, color, t, intensity = 1) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  drawGlow(ctx, x, y - 50, 95 * intensity, color, 0.35 * intensity);
  for (let i = 0; i < 4; i++) {
    const ph = ((t * 2.2 + i * 0.25) % 1);
    const ox = Math.sin(t * 5 + i * 2) * 18;
    const yy = y - 10 - ph * 115;
    ctx.strokeStyle = rgba(color, (1 - ph) * 0.55 * intensity);
    ctx.lineWidth = 3 * (1 - ph);
    ctx.beginPath();
    ctx.moveTo(x + ox - 8, yy + 18);
    ctx.quadraticCurveTo(x + ox + 10, yy, x + ox, yy - 18);
    ctx.stroke();
  }
  ctx.restore();
}

/* local joint -> world */
function rigToWorld(ent, J, pt, S) {
  const s = S.scale;
  return { x: ent.x + ent.dir * pt.x * s, y: ent.y + pt.y * s };
}

/* ---------- verlet cloth (scarf / hair / sash) ---------- */
class Cloth {
  constructor(def, x, y) {
    this.def = def;
    this.p = [];
    for (let i = 0; i < def.n; i++) this.p.push({ x, y: y + i * def.seg, px: x, py: y + i * def.seg });
  }
  reset(x, y) { for (const q of this.p) { q.x = q.px = x; q.y = q.py = y; } }
  update(ax, ay, dt, wind, scale = 1) {
    const P = this.p, seg = this.def.seg * scale;
    P[0].x = ax; P[0].y = ay; P[0].px = ax; P[0].py = ay;
    const g = 900 * dt * dt;
    for (let i = 1; i < P.length; i++) {
      const q = P[i];
      const vx = (q.x - q.px) * 0.9, vy = (q.y - q.py) * 0.9;
      q.px = q.x; q.py = q.y;
      q.x += vx + wind * dt * dt * (0.6 + 0.4 * Math.sin(performance.now() / 300 + i));
      q.y += vy + g;
    }
    for (let it = 0; it < 4; it++) {
      for (let i = 1; i < P.length; i++) {
        const a = P[i - 1], b = P[i];
        const dx = b.x - a.x, dy = b.y - a.y;
        const d = Math.hypot(dx, dy) || 0.001;
        const diff = (d - seg) / d;
        if (i === 1) { b.x -= dx * diff; b.y -= dy * diff; }
        else { a.x += dx * diff * 0.5; a.y += dy * diff * 0.5; b.x -= dx * diff * 0.5; b.y -= dy * diff * 0.5; }
      }
    }
  }
  draw(ctx, scale = 1, colorOverride) {
    const P = this.p, n = P.length, d = this.def;
    const left = [], right = [];
    for (let i = 0; i < n; i++) {
      const a = P[Math.max(0, i - 1)], b = P[Math.min(n - 1, i + 1)];
      let dx = b.x - a.x, dy = b.y - a.y; const L = Math.hypot(dx, dy) || 1; dx /= L; dy /= L;
      const w = d.width * scale * (d.kind === 'hair' ? (1 - i / n) * 1.2 + 0.2 : 1 - (i / n) * 0.55);
      left.push([P[i].x - dy * w, P[i].y + dx * w]);
      right.push([P[i].x + dy * w, P[i].y - dx * w]);
    }
    ctx.beginPath();
    ctx.moveTo(left[0][0], left[0][1]);
    for (let i = 1; i < n; i++) ctx.lineTo(left[i][0], left[i][1]);
    for (let i = n - 1; i >= 0; i--) ctx.lineTo(right[i][0], right[i][1]);
    ctx.closePath();
    if (colorOverride) ctx.fillStyle = colorOverride;
    else {
      const g = ctx.createLinearGradient(P[0].x, P[0].y, P[n - 1].x, P[n - 1].y);
      g.addColorStop(0, d.color); g.addColorStop(1, d.color2);
      ctx.fillStyle = g;
    }
    ctx.fill();
  }
}

/* ---------- portrait (head bust in a circle) ---------- */
function drawPortrait(ctx, heroId, x, y, r, t = 0, opts = {}) {
  const S = STYLES[heroId];
  const hero = HEROES[heroId];
  ctx.save();
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.clip();
  const bg = ctx.createRadialGradient(x, y - r * 0.3, 0, x, y, r);
  bg.addColorStop(0, rgba(hero.color, 0.9)); bg.addColorStop(1, rgba(hero.color2 || '#000000', 0.95));
  ctx.fillStyle = bg; ctx.fillRect(x - r, y - r, r * 2, r * 2);
  const k = (r / 22);
  const pose = POSES.idle.slice(); pose[3] = 0.1; pose[4] = 0.2; pose[11] = 3.0;
  const J = solveRig(pose, S, true);
  ctx.translate(x - J.head.x * k * 0.9, y - J.head.y * k * 0.9 + r * 0.15);
  drawRig(ctx, 0, 0, 1, pose, Object.assign({}, S, { scale: k * 0.9 }), { t, rim: hero.color, rimDx: -1.4, noWeapon: true });
  ctx.restore();
  if (!opts.noRing) {
    ctx.strokeStyle = opts.ring || '#e8c070'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke();
  }
}
