'use strict';
/* ============================================================
 *  UI — Calligraphy Ink HUD, Boss Bars, Cinematics & Modals
 * ============================================================ */

const UI = {
  _hoverBtn: null,

  roundPath(ctx, x, y, w, h, r) {
    r = Math.min(r, w * 0.5, h * 0.5);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  },

  hit(x, y, w, h) {
    const mx = Input.mouse.x, my = Input.mouse.y;
    return mx >= x && mx <= x + w && my >= y && my <= y + h;
  },

  drawPanel(ctx, x, y, w, h, opts = {}) {
    const r = opts.radius ?? 8;
    const bg = opts.bg || 'rgba(12, 9, 16, 0.90)';
    const border = opts.border || '#d8a64e';
    const corners = opts.corners !== false;
    ctx.save();
    if (opts.alpha !== undefined) ctx.globalAlpha = opts.alpha;

    // soft outer drop glow
    if (opts.glow) {
      ctx.shadowColor = opts.glow;
      ctx.shadowBlur = opts.glowBlur || 18;
    }

    this.roundPath(ctx, x, y, w, h, r);
    if (opts.gradTop && opts.gradBot) {
      const g = ctx.createLinearGradient(x, y, x, y + h);
      g.addColorStop(0, opts.gradTop);
      g.addColorStop(1, opts.gradBot);
      ctx.fillStyle = g;
    } else {
      ctx.fillStyle = bg;
    }
    ctx.fill();
    ctx.shadowBlur = 0;

    // subtle inner highlight sheen
    const sheen = ctx.createLinearGradient(x, y, x, y + Math.min(90, h));
    sheen.addColorStop(0, 'rgba(255, 232, 185, 0.08)');
    sheen.addColorStop(1, 'rgba(255, 232, 185, 0)');
    this.roundPath(ctx, x + 1, y + 1, w - 2, h - 2, Math.max(1, r - 1));
    ctx.fillStyle = sheen;
    ctx.fill();

    // outer + inner hairline frame
    ctx.strokeStyle = rgba(border, opts.borderAlpha ?? 0.62);
    ctx.lineWidth = opts.lineWidth || 1.5;
    this.roundPath(ctx, x, y, w, h, r);
    ctx.stroke();

    ctx.strokeStyle = rgba(border, 0.16);
    ctx.lineWidth = 1;
    this.roundPath(ctx, x + 4, y + 4, w - 8, h - 8, Math.max(1, r - 2));
    ctx.stroke();

    // antique corner filigree brackets
    if (corners) {
      const cs = Math.min(12, w * 0.12, h * 0.12);
      ctx.strokeStyle = border;
      ctx.lineWidth = 2;
      const drawCorner = (cx, cy, dx, dy) => {
        ctx.beginPath();
        ctx.moveTo(cx + dx * cs, cy);
        ctx.lineTo(cx, cy);
        ctx.lineTo(cx, cy + dy * cs);
        ctx.stroke();
      };
      drawCorner(x + 2, y + 2, 1, 1);
      drawCorner(x + w - 2, y + 2, -1, 1);
      drawCorner(x + 2, y + h - 2, 1, -1);
      drawCorner(x + w - 2, y + h - 2, -1, -1);
    }

    if (opts.title) {
      ctx.fillStyle = opts.titleColor || '#ffe8b2';
      ctx.font = `bold 20px ${FONT_KAI}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(opts.title, x + w / 2, y + 26);
      this.drawDivider(ctx, x + 28, y + 46, w - 56, border);
    }
    ctx.restore();
  },

  drawDivider(ctx, x, y, w, color = '#d8a64e') {
    ctx.save();
    const g = ctx.createLinearGradient(x, y, x + w, y);
    g.addColorStop(0, rgba(color, 0));
    g.addColorStop(0.5, rgba(color, 0.78));
    g.addColorStop(1, rgba(color, 0));
    ctx.strokeStyle = g;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w, y);
    ctx.stroke();
    // center diamond
    const cx = x + w * 0.5;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(cx, y - 4);
    ctx.lineTo(cx + 5, y);
    ctx.lineTo(cx, y + 4);
    ctx.lineTo(cx - 5, y);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  },

  drawSeal(ctx, x, y, size, ch, opts = {}) {
    ctx.save();
    ctx.translate(x, y);
    if (opts.angle) ctx.rotate(opts.angle);
    if (opts.alpha !== undefined) ctx.globalAlpha = opts.alpha;
    const h = size * 0.5;
    const isGold = !!opts.gold;
    const bg = opts.color || (isGold ? '#b47a18' : '#b8221a');
    const fg = opts.textColor || (isGold ? '#fff6d4' : '#fff0e6');

    if (opts.glow) {
      ctx.shadowColor = bg;
      ctx.shadowBlur = 14;
    }
    this.roundPath(ctx, -h, -h, size, size, size * 0.14);
    ctx.fillStyle = bg;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Carved inner border
    ctx.strokeStyle = rgba(fg, 0.72);
    ctx.lineWidth = Math.max(1.2, size * 0.055);
    this.roundPath(ctx, -h + size * 0.09, -h + size * 0.09, size * 0.82, size * 0.82, size * 0.08);
    ctx.stroke();

    ctx.fillStyle = fg;
    ctx.font = `${Math.round(size * 0.62)}px ${FONT_BRUSH}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(ch, 0, size * 0.04);
    ctx.restore();
  },

  drawBtn(ctx, x, y, w, h, label, opts = {}) {
    const hovered = !opts.disabled && (opts.hovered ?? this.hit(x, y, w, h));
    const active = !!opts.active;
    const color = opts.color || '#ffb84d';
    ctx.save();
    if (opts.disabled) ctx.globalAlpha = 0.45;

    const topC = active ? mix('#281810', color, 0.25) : hovered ? mix('#1c1522', color, 0.16) : '#120e18';
    const botC = active ? '#120b09' : '#0a080e';
    this.drawPanel(ctx, x, y, w, h, {
      radius: opts.radius ?? 6,
      gradTop: topC,
      gradBot: botC,
      border: active || hovered ? color : '#7a6345',
      borderAlpha: active ? 0.95 : hovered ? 0.88 : 0.48,
      glow: active || hovered ? color : null,
      glowBlur: active ? 16 : 12,
      corners: hovered || active,
      lineWidth: active ? 2 : 1.4,
    });

    // accent side bar if active
    if (active) {
      ctx.fillStyle = color;
      ctx.fillRect(x + 2, y + 6, 4, h - 12);
    }

    const fs = opts.fontSize || 20;
    ctx.fillStyle = opts.disabled ? '#7a7268' : (active || hovered ? '#fff5dc' : '#ded2bd');
    ctx.font = `bold ${fs}px ${opts.font || FONT_KAI}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x + w * 0.5, y + h * (opts.sub ? 0.4 : 0.51));

    if (opts.sub) {
      ctx.fillStyle = rgba(color, 0.85);
      ctx.font = `12px ${FONT_UI}`;
      ctx.fillText(opts.sub, x + w * 0.5, y + h * 0.74);
    }
    if (opts.badge) {
      ctx.fillStyle = rgba('#000000', 0.65);
      this.roundPath(ctx, x + 8, y + h * 0.5 - 10, 32, 20, 4);
      ctx.fill();
      ctx.strokeStyle = rgba(color, 0.5);
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = '#ffe2a6';
      ctx.font = `bold 11px ${FONT_NUM}`;
      ctx.fillText(opts.badge, x + 24, y + h * 0.5 + 0.5);
    }
    ctx.restore();
    return { x, y, w, h, hovered, clicked: hovered && Input.mouse.clicked && !opts.disabled };
  },

  drawItemIcon(ctx, item, x, y, size) {
    const qColor = QUALITIES[item.q].color;
    ctx.save();
    this.roundPath(ctx, x, y, size, size, 6);
    const g = ctx.createRadialGradient(x + size * 0.5, y + size * 0.45, 2, x + size * 0.5, y + size * 0.5, size * 0.7);
    g.addColorStop(0, rgba(qColor, 0.24));
    g.addColorStop(1, '#0d0a12');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = rgba(qColor, 0.88);
    ctx.lineWidth = item.q >= 3 ? 2 : 1.5;
    ctx.stroke();

    // procedural slot artwork
    const cx = x + size * 0.5, cy = y + size * 0.5;
    const s = size * 0.3;
    ctx.strokeStyle = '#fff5dc';
    ctx.fillStyle = qColor;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (item.slot === 'weapon') {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-0.65);
      ctx.lineWidth = 3;
      ctx.strokeStyle = qColor;
      ctx.beginPath(); ctx.moveTo(-s * 1.15, 0); ctx.lineTo(s * 0.9, 0); ctx.stroke();
      ctx.fillStyle = '#fff4da';
      ctx.beginPath();
      ctx.moveTo(s * 0.65, -s * 0.28);
      ctx.lineTo(s * 1.35, 0);
      ctx.lineTo(s * 0.65, s * 0.28);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#ffd878';
      ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.moveTo(s * 0.35, -s * 0.45); ctx.lineTo(s * 0.35, s * 0.45); ctx.stroke();
      ctx.restore();
    } else if (item.slot === 'armor') {
      ctx.fillStyle = rgba(qColor, 0.38);
      ctx.strokeStyle = qColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - s * 0.9, cy - s * 0.65);
      ctx.lineTo(cx - s * 0.35, cy - s * 0.9);
      ctx.lineTo(cx, cy - s * 0.58);
      ctx.lineTo(cx + s * 0.35, cy - s * 0.9);
      ctx.lineTo(cx + s * 0.9, cy - s * 0.65);
      ctx.lineTo(cx + s * 0.7, cy + s * 0.85);
      ctx.lineTo(cx, cy + s * 1.05);
      ctx.lineTo(cx - s * 0.7, cy + s * 0.85);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#fff4da';
      ctx.beginPath(); ctx.arc(cx, cy - s * 0.05, s * 0.22, 0, TAU); ctx.fill();
    } else {
      // Jade / orb talisman
      ctx.strokeStyle = qColor;
      ctx.lineWidth = 2.6;
      ctx.beginPath(); ctx.arc(cx, cy + s * 0.08, s * 0.78, 0, TAU); ctx.stroke();
      ctx.strokeStyle = rgba('#fff5dc', 0.85);
      ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.arc(cx, cy + s * 0.08, s * 0.35, 0, TAU); ctx.stroke();
      ctx.fillStyle = '#ffd878';
      ctx.beginPath(); ctx.arc(cx, cy - s * 0.76, s * 0.2, 0, TAU); ctx.fill();
    }

    if (item.enh > 0) {
      ctx.fillStyle = 'rgba(0,0,0,0.78)';
      ctx.fillRect(x + size - 24, y + 2, 22, 14);
      ctx.fillStyle = '#ffd868';
      ctx.font = `bold 11px ${FONT_NUM}`;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'top';
      ctx.fillText('+' + item.enh, x + size - 4, y + 3);
    }
    ctx.restore();
  },

  /* ============================================================
   *  IN-GAME HUD
   * ============================================================ */
  drawHUD(ctx, G) {
    const p = G.player;
    const prof = p.profile;

    // 1. Top-Left Hero Status Plate (x: 16..340, zero overlap with center Boss bar)
    this.drawPanel(ctx, 16, 14, 324, 96, {
      radius: 10,
      bg: 'rgba(10, 8, 15, 0.78)',
      border: p.awakenT > 0 ? '#ffd868' : p.hero.color,
      borderAlpha: p.awakenT > 0 ? 0.95 : 0.55,
      glow: p.awakenT > 0 ? '#ff9d2e' : null,
      corners: true,
    });

    // Portrait medallion
    drawPortrait(ctx, p.heroId, 54, 62, 32, p.t, { awaken: p.awakenT > 0 });
    if (p.awakenT > 0) {
      ctx.save();
      ctx.translate(54, 62);
      ctx.rotate(p.t * 1.4);
      ctx.strokeStyle = rgba('#ffd868', 0.85);
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 6]);
      ctx.beginPath(); ctx.arc(0, 0, 37, 0, TAU); ctx.stroke();
      ctx.restore();
    }

    // Level badge
    ctx.save();
    ctx.fillStyle = '#18101c';
    ctx.strokeStyle = '#ffd868';
    ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.arc(76, 85, 12, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffe9b0';
    ctx.font = `bold 11px ${FONT_NUM}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(prof.lv, 76, 85.5);
    ctx.restore();

    // Name, Title & XP sliver
    ctx.save();
    ctx.fillStyle = '#fff3d6';
    ctx.font = `bold 16px ${FONT_KAI}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(p.hero.name, 96, 29);

    ctx.fillStyle = rgba(p.hero.accent, 0.85);
    ctx.font = `11px ${FONT_UI}`;
    ctx.fillText(p.hero.title, 156, 29);

    const need = xpNeed(prof.lv);
    const xpPct = clamp(prof.xp / need, 0, 1);
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(224, 26, 102, 5);
    ctx.fillStyle = '#ffd668';
    ctx.fillRect(224, 26, 102 * xpPct, 5);

    // HP Bar
    const bx = 96, bw = 230;
    this._drawBar(ctx, bx, 40, bw, 18, p.hp / p.maxHp, p.hpTrail / p.maxHp,
      '#b81822', '#ff5432', '#fff0b8',
      `气血 ${Math.ceil(p.hp)} / ${p.maxHp}`);

    // MP Bar
    this._drawBar(ctx, bx, 63, bw - 18, 12, p.mp / p.maxMp, null,
      '#1255a8', '#38d0ff', null,
      `法力 ${Math.floor(p.mp)} / ${p.maxMp}`, 10);

    // Ember / Awaken Bar
    const isAwk = p.awakenT > 0;
    const ePct = isAwk ? clamp(p.awakenT / 9, 0, 1) : clamp(p.ember / 100, 0, 1);
    const ready = !isAwk && p.ember >= 100;
    this._drawBar(ctx, bx, 79, bw - 36, 10, ePct, null,
      isAwk ? '#ff6418' : '#78280e',
      isAwk || ready ? '#ffe058' : '#ff8a28',
      null,
      isAwk ? `梦烬觉醒 ${p.awakenT.toFixed(1)}s` : (ready ? '梦烬已满 [Space 觉醒!]' : `梦烬 ${Math.floor(p.ember)}%`), 9);

    if (ready) {
      const pulse = 0.5 + 0.5 * Math.sin(p.t * 9);
      ctx.strokeStyle = rgba('#ffe478', 0.5 + 0.5 * pulse);
      ctx.lineWidth = 2;
      ctx.strokeRect(bx - 1, 78, bw - 34, 12);
    }

    // Active status chips below portrait
    let chipX = 18;
    if (p.shieldT > 0) {
      this._drawChip(ctx, chipX, 118, `护体结界 ${p.shieldT.toFixed(1)}s`, '#50ffc8');
      chipX += 116;
    }
    if (prof.treasure && TREASURES[prof.treasure]) {
      const tr = TREASURES[prof.treasure];
      this._drawChip(ctx, chipX, 118, `法宝·${tr.name}`, tr.color);
    }
    ctx.restore();

    // 2. Top-Center Boss Health Bar (x: 374..906, clear margins on both sides)
    if (G.boss && !G.boss.dead && !G.bossIntro) {
      const b = G.boss;
      const bW = 500, bX = (W - bW) * 0.5, bY = 16;
      this.drawPanel(ctx, bX - 16, bY - 4, bW + 32, 70, {
        radius: 8,
        bg: 'rgba(12, 8, 16, 0.82)',
        border: b.stunT > 0 ? '#ffd868' : b.color,
        borderAlpha: 0.8,
        glow: b.color,
        glowBlur: 12,
        corners: true,
      });

      ctx.save();
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'left';
      ctx.fillStyle = '#ffeec6';
      ctx.font = `bold 17px ${FONT_KAI}`;
      const bossLabel = `${b.title} · ${b.name}`;
      ctx.fillText(bossLabel, bX, bY + 12);

      if (b.phase > 1) {
        const lw = ctx.measureText(bossLabel).width;
        ctx.fillStyle = '#ff6a40';
        ctx.font = `bold 13px ${FONT_KAI}`;
        ctx.fillText(b.phase >= 3 ? '[终极相]' : '[二相狂暴]', bX + lw + 12, bY + 12);
      }

      ctx.textAlign = 'right';
      ctx.fillStyle = '#f2d9b8';
      ctx.font = `bold 13px ${FONT_NUM}`;
      ctx.fillText(`${Math.ceil(b.hp)} / ${b.maxHp}`, bX + bW, bY + 12);

      // HP track + trail + gradient + phase ticks
      const hpPct = clamp(b.hp / b.maxHp, 0, 1);
      const trPct = clamp(G.bossHpTrail / b.maxHp, 0, 1);
      this._drawBar(ctx, bX, bY + 24, bW, 18, hpPct, trPct, '#6c0d18', b.color, '#ffe8b8', '');
      for (const mark of [0.25, 0.5, 0.75]) {
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(bX + bW * mark, bY + 24, 2, 18);
      }

      // Poise bar
      const poisePct = b.stunT > 0 ? clamp(b.stunT / 2.0, 0, 1) : clamp(b.poise / b.maxPoise, 0, 1);
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.fillRect(bX, bY + 46, bW, 6);
      ctx.fillStyle = b.stunT > 0 ? '#fff088' : '#e8a238';
      ctx.fillRect(bX, bY + 46, bW * poisePct, 6);
      if (b.stunT > 0) {
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffe878';
        ctx.font = `bold 11px ${FONT_UI}`;
        ctx.fillText('护体破防！承受伤害提升 25%', W * 0.5, bY + 57);
      }
      ctx.restore();
    }

    // 3. Top-Right Stage Info, Rooms & Currency
    this.drawPanel(ctx, W - 266, 14, 248, 86, {
      radius: 8,
      bg: 'rgba(10, 8, 15, 0.76)',
      border: G.nightmare ? '#ff5858' : '#c89a48',
      borderAlpha: 0.6,
      corners: true,
    });
    ctx.save();
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffe8bc';
    ctx.font = `bold 15px ${FONT_KAI}`;
    ctx.fillText(`${G.def.num} · ${G.def.name}`, W - 252, 31);
    if (G.nightmare) {
      ctx.fillStyle = '#ff6a60';
      ctx.font = `bold 11px ${FONT_UI}`;
      ctx.textAlign = 'right';
      ctx.fillText('[梦魇]', W - 28, 31);
    }

    // Room progress nodes
    const totalRooms = G.def.rooms.length;
    for (let i = 0; i < totalRooms; i++) {
      const rx = W - 244 + i * 32;
      const ry = 53;
      const active = i === G.roomIdx;
      const passed = i < G.roomIdx;
      const isBossR = i === totalRooms - 1;
      ctx.fillStyle = passed ? '#68e898' : active ? '#ffd868' : 'rgba(255,255,255,0.16)';
      ctx.beginPath(); ctx.arc(rx, ry, active ? 7 : 5, 0, TAU); ctx.fill();
      if (isBossR) {
        ctx.strokeStyle = '#ff6a4a';
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(rx, ry, 9, 0, TAU); ctx.stroke();
      }
      if (i < totalRooms - 1) {
        ctx.fillStyle = passed ? '#68e898' : 'rgba(255,255,255,0.18)';
        ctx.fillRect(rx + 8, ry - 1, 16, 2);
      }
    }

    // Coins & Souls
    ctx.textAlign = 'right';
    ctx.font = `bold 13px ${FONT_NUM}`;
    ctx.fillStyle = '#ffd868';
    ctx.fillText(`灵石 ${App.save.coins}`, W - 28, 53);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#7beeff';
    ctx.fillText(`炼魂 ${App.save.souls}`, W - 252, 79);

    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(235, 222, 198, 0.7)';
    ctx.font = `11px ${FONT_UI}`;
    ctx.fillText('[B]行囊  [Esc]暂停', W - 28, 79);
    ctx.restore();

    // 4. Right-Center Dynamic Combo Counter
    if (p.combo > 0) {
      const pop = 1 + Math.max(0, p.comboTimer - 3.0) * 1.4;
      const cx = W - 40, cy = 195;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(pop, pop);
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';

      const col = p.combo >= 30 ? '#ff6438' : p.combo >= 15 ? '#ffd850' : '#fff0c8';
      ctx.shadowColor = col;
      ctx.shadowBlur = 14;
      ctx.fillStyle = col;
      ctx.font = `italic bold 48px ${FONT_NUM}`;
      ctx.fillText(`${p.combo}`, -38, 0);
      ctx.shadowBlur = 0;

      ctx.fillStyle = '#fff4da';
      ctx.font = `20px ${FONT_BRUSH}`;
      ctx.fillText('连击', 0, 8);

      const rankTxt = p.combo >= 50 ? '斗战胜佛' : p.combo >= 30 ? '神鬼莫测' : p.combo >= 15 ? '行云流水' : '锋芒初露';
      ctx.fillStyle = rgba(col, 0.9);
      ctx.font = `14px ${FONT_KAI}`;
      ctx.fillText(rankTxt, 0, 30);

      const pct = clamp(p.comboTimer / 3.2, 0, 1);
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.fillRect(-130, 42, 130, 3);
      ctx.fillStyle = col;
      ctx.fillRect(-130 + 130 * (1 - pct), 42, 130 * pct, 3);
      ctx.restore();
    }

    // 5. Toasts
    if (G.toasts.length > 0) {
      let ty = 264;
      for (const ts of G.toasts) {
        const a = clamp(ts.t * 4, 0, 1) * clamp((ts.life - ts.t) * 2.5, 0, 1);
        const slide = (1 - clamp(ts.t * 5, 0, 1)) * 40;
        ctx.save();
        ctx.globalAlpha = a;
        this.drawPanel(ctx, W - 328 + slide, ty, 310, ts.sub ? 48 : 34, {
          radius: 6, bg: 'rgba(12, 10, 16, 0.88)', border: ts.color, corners: false,
        });
        ctx.fillStyle = ts.color;
        ctx.fillRect(W - 324 + slide, ty + 6, 4, (ts.sub ? 48 : 34) - 12);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#fff5dc';
        ctx.font = `bold 14px ${FONT_UI}`;
        ctx.fillText(ts.title, W - 312 + slide, ty + 15);
        if (ts.sub) {
          ctx.fillStyle = 'rgba(225,215,195,0.82)';
          ctx.font = `12px ${FONT_UI}`;
          ctx.fillText(ts.sub, W - 312 + slide, ty + 34);
        }
        ctx.restore();
        ty += ts.sub ? 54 : 40;
      }
    }

    // 6. Bottom-Center Tactile Skill & Treasure Deck
    const sk = p.hero.skills;
    const tr = prof.treasure ? TREASURES[prof.treasure] : null;
    const deck = [
      { kind: 'skill', id: 's1', def: sk[0], cd: p.cds.s1, maxCd: sk[0].cd, w: 62 },
      { kind: 'skill', id: 's2', def: sk[1], cd: p.cds.s2, maxCd: sk[1].cd, w: 62 },
      { kind: 'skill', id: 's3', def: sk[2], cd: p.cds.s3, maxCd: sk[2].cd, w: 62 },
      { kind: 'ult',   id: 'ult', def: sk[3], w: 74 },
      { kind: 'treasure', id: 'treasure', def: tr, cd: p.cds.treasure, maxCd: tr ? tr.cd : 1, w: 62 },
    ];
    const gap = 14;
    const totalW = deck.reduce((s, d) => s + d.w, 0) + gap * (deck.length - 1);
    let dx = (W - totalW) * 0.5;
    const baseY = H - 104;

    for (const slot of deck) {
      const sw = slot.w;
      const sy = slot.kind === 'ult' ? baseY - 10 : baseY;
      this._drawSkillSlot(ctx, p, slot, dx, sy, sw);
      dx += sw + gap;
    }

    // Micro hint line cleanly separated below skill names
    ctx.save();
    ctx.fillStyle = 'rgba(232, 218, 195, 0.72)';
    ctx.font = `11px ${FONT_UI}`;
    ctx.textAlign = 'center';
    ctx.fillText('[A/D]移动  [J]四连斩  [W+J]挑飞  [空中S+J]下劈  [K]跳  [L/Shift]极限闪避  [B]行囊', W * 0.5, H - 11);
    ctx.restore();
  },

  _drawBar(ctx, x, y, w, h, pct, trailPct, c1, c2, borderC, label, fontSize = 11) {
    pct = clamp(pct, 0, 1);
    ctx.save();
    this.roundPath(ctx, x, y, w, h, Math.min(4, h * 0.35));
    ctx.fillStyle = 'rgba(4, 3, 8, 0.85)';
    ctx.fill();

    if (trailPct !== null && trailPct > pct) {
      const tw = w * clamp(trailPct, 0, 1);
      ctx.fillStyle = 'rgba(255, 240, 200, 0.72)';
      this.roundPath(ctx, x, y, Math.max(h * 0.4, tw), h, Math.min(4, h * 0.35));
      ctx.fill();
    }

    if (pct > 0.002) {
      const fw = Math.max(4, w * pct);
      const g = ctx.createLinearGradient(x, y, x + fw, y);
      g.addColorStop(0, c1);
      g.addColorStop(1, c2);
      ctx.fillStyle = g;
      this.roundPath(ctx, x, y, fw, h, Math.min(4, h * 0.35));
      ctx.fill();

      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.fillRect(x + 2, y + 1, Math.max(0, fw - 4), Math.max(1, h * 0.32));
    }

    if (borderC) {
      ctx.strokeStyle = rgba(borderC, 0.45);
      ctx.lineWidth = 1;
      this.roundPath(ctx, x, y, w, h, Math.min(4, h * 0.35));
      ctx.stroke();
    }

    if (label) {
      ctx.fillStyle = '#fff8ea';
      ctx.font = `bold ${fontSize}px ${FONT_UI}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0,0,0,0.85)';
      ctx.shadowBlur = 3;
      ctx.fillText(label, x + w * 0.5, y + h * 0.52);
    }
    ctx.restore();
  },

  _drawChip(ctx, x, y, txt, color) {
    ctx.save();
    ctx.fillStyle = 'rgba(12, 10, 18, 0.84)';
    this.roundPath(ctx, x, y, 108, 22, 4);
    ctx.fill();
    ctx.strokeStyle = rgba(color, 0.7);
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.font = `11px ${FONT_UI}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(txt, x + 54, y + 11);
    ctx.restore();
  },

  _drawSkillSlot(ctx, p, slot, x, y, size) {
    ctx.save();
    if (slot.kind === 'ult') {
      const cx = x + size * 0.5, cy = y + size * 0.5, r = size * 0.5;
      const isAwk = p.awakenT > 0;
      const ready = p.ember >= 100 || isAwk;
      const pct = isAwk ? clamp(p.awakenT / 9, 0, 1) : clamp(p.ember / 100, 0, 1);

      if (ready) {
        drawGlow(ctx, cx, cy, r * 1.45, slot.def.color, 0.55 + 0.25 * Math.sin(p.t * 8));
      }
      ctx.fillStyle = '#0e0a14';
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.fill();

      // Ember radial progress fill
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r - 3, -Math.PI * 0.5, -Math.PI * 0.5 + TAU * pct);
      ctx.closePath();
      ctx.fillStyle = rgba(slot.def.color, ready ? 0.45 : 0.22);
      ctx.fill();

      ctx.strokeStyle = ready ? '#ffe478' : rgba(slot.def.color, 0.65);
      ctx.lineWidth = ready ? 2.6 : 1.8;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.stroke();

      ctx.fillStyle = ready ? '#fff6d8' : 'rgba(240,225,195,0.65)';
      ctx.font = `36px ${FONT_BRUSH}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(slot.def.glyph, cx, cy + 2);

      // Hotkey + short label
      ctx.fillStyle = ready ? '#ffe888' : '#b8aa95';
      ctx.font = `bold 11px ${FONT_NUM}`;
      ctx.fillText('Space', cx, y - 8);
      ctx.font = `11px ${FONT_UI}`;
      ctx.fillText(isAwk ? '觉醒中' : slot.def.name, cx, y + size + 11);
      ctx.restore();
      return;
    }

    const def = slot.def;
    if (!def) {
      // Unowned treasure placeholder
      this.roundPath(ctx, x, y, size, size, 8);
      ctx.fillStyle = 'rgba(10,8,14,0.65)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(180,155,110,0.28)';
      ctx.lineWidth = 1.4;
      ctx.stroke();
      ctx.fillStyle = 'rgba(180,165,140,0.45)';
      ctx.font = `12px ${FONT_KAI}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('未佩', x + size * 0.5, y + size * 0.42);
      ctx.fillText('法宝', x + size * 0.5, y + size * 0.65);
      ctx.fillStyle = '#8b7f6e';
      ctx.font = `bold 11px ${FONT_NUM}`;
      ctx.fillText('E', x + 10, y + 10);
      ctx.restore();
      return;
    }

    const cd = slot.cd || 0;
    const noMp = def.mp && p.mp < def.mp;
    const ready = cd <= 0 && !noMp;

    this.roundPath(ctx, x, y, size, size, 8);
    const g = ctx.createLinearGradient(x, y, x, y + size);
    g.addColorStop(0, ready ? mix('#1c1624', def.color, 0.24) : '#0e0b13');
    g.addColorStop(1, '#08060c');
    ctx.fillStyle = g;
    ctx.fill();

    ctx.strokeStyle = ready ? rgba(def.color, 0.9) : 'rgba(140,130,120,0.38)';
    ctx.lineWidth = ready ? 2 : 1.4;
    ctx.stroke();

    // Glyph
    ctx.fillStyle = ready ? '#fff4da' : (noMp ? '#6aa4e0' : 'rgba(210,200,185,0.45)');
    ctx.font = `32px ${FONT_BRUSH}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(def.glyph, x + size * 0.5, y + size * 0.5 + 1);

    // Cooldown wipe
    if (cd > 0) {
      const frac = clamp(cd / Math.max(0.1, slot.maxCd), 0, 1);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.68)';
      this.roundPath(ctx, x + 2, y + size * (1 - frac), size - 4, size * frac - 2, 4);
      ctx.fill();
      ctx.fillStyle = '#fff5d8';
      ctx.font = `bold 18px ${FONT_NUM}`;
      ctx.fillText(cd >= 10 ? Math.ceil(cd) : cd.toFixed(1), x + size * 0.5, y + size * 0.52);
    }

    // Hotkey badge top-left
    ctx.fillStyle = 'rgba(0,0,0,0.78)';
    this.roundPath(ctx, x - 3, y - 5, 19, 17, 4);
    ctx.fill();
    ctx.strokeStyle = rgba(def.color, 0.65);
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = '#ffe8a8';
    ctx.font = `bold 11px ${FONT_NUM}`;
    ctx.fillText(def.key || 'E', x + 6.5, y + 4);

    // MP tag top-right
    if (def.mp) {
      ctx.fillStyle = noMp ? '#ff7068' : '#78d8ff';
      ctx.font = `bold 10px ${FONT_NUM}`;
      ctx.textAlign = 'right';
      ctx.fillText(def.mp, x + size - 4, y + 9);
    }

    // Name below
    ctx.textAlign = 'center';
    ctx.fillStyle = ready ? '#f0e4cc' : '#8d8374';
    ctx.font = `11px ${FONT_UI}`;
    ctx.fillText(def.name, x + size * 0.5, y + size + 11);
    ctx.restore();
  },

  /* ============================================================
   *  CINEMATICS — Stage Banner, Boss Intro, Ult Cut-in
   * ============================================================ */
  drawStageBanner(ctx, G) {
    const t = 3.0 - G.titleBannerT;
    const a = clamp(t * 2.2, 0, 1) * clamp(G.titleBannerT * 1.4, 0, 1);
    ctx.save();
    ctx.globalAlpha = a;
    const cy = H * 0.34;
    const bandG = ctx.createLinearGradient(0, cy - 84, 0, cy + 84);
    bandG.addColorStop(0, 'rgba(6, 4, 10, 0)');
    bandG.addColorStop(0.5, 'rgba(6, 4, 10, 0.78)');
    bandG.addColorStop(1, 'rgba(6, 4, 10, 0)');
    ctx.fillStyle = bandG;
    ctx.fillRect(0, cy - 86, W, 172);

    this.drawDivider(ctx, W * 0.25, cy - 60, W * 0.5, G.th.rim);
    this.drawDivider(ctx, W * 0.25, cy + 64, W * 0.5, G.th.rim);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = rgba(G.th.rim, 0.95);
    ctx.font = `bold 18px ${FONT_KAI}`;
    ctx.fillText(G.def.num + (G.nightmare ? '  ·  梦魇劫境' : ''), W * 0.5, cy - 36);

    ctx.shadowColor = rgba(G.th.rim, 0.7);
    ctx.shadowBlur = 18;
    ctx.fillStyle = '#fff5dc';
    ctx.font = `62px ${FONT_BRUSH}`;
    ctx.fillText(G.def.name, W * 0.5, cy + 6);
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#d6c8b2';
    ctx.font = `18px ${FONT_KAI}`;
    ctx.fillText(G.def.subtitle, W * 0.5, cy + 44);

    this.drawSeal(ctx, W * 0.5 + 210, cy + 6, 38, '劫', { angle: -0.1 });
    ctx.restore();
  },

  drawBossIntro(ctx, intro) {
    const p = clamp(intro.t / intro.dur, 0, 1);
    const fade = clamp(intro.t * 4, 0, 1) * clamp((intro.dur - intro.t) * 3.5, 0, 1);
    const barH = 82 * clamp(intro.t * 4, 0, 1);
    ctx.save();
    // Letterbox bars
    ctx.fillStyle = '#050408';
    ctx.fillRect(0, 0, W, barH);
    ctx.fillRect(0, H - barH, W, barH);

    ctx.globalAlpha = fade;
    const sweep = ctx.createLinearGradient(0, H * 0.56, W, H * 0.56);
    sweep.addColorStop(0, 'rgba(0,0,0,0)');
    sweep.addColorStop(0.5, 'rgba(8, 6, 12, 0.86)');
    sweep.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = sweep;
    ctx.fillRect(0, H * 0.54, W, 170);

    const slideX = (1 - Ease.outCubic(clamp(intro.t * 2.2, 0, 1))) * 90;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = intro.color;
    ctx.font = `bold 20px ${FONT_KAI}`;
    ctx.fillText(intro.title, 120 - slideX, H * 0.59);

    ctx.shadowColor = intro.color;
    ctx.shadowBlur = 22;
    ctx.fillStyle = '#fff5dc';
    ctx.font = `68px ${FONT_BRUSH}`;
    ctx.fillText(intro.name, 118 - slideX, H * 0.66);
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#dfd0b8';
    ctx.font = `18px ${FONT_KAI}`;
    ctx.fillText(intro.quote, 120 + slideX * 0.4, H * 0.73);

    this.drawSeal(ctx, 84, H * 0.65, 44, '妖', { color: '#b42018', glow: true, angle: -0.08 });

    if (p > 0.35) {
      ctx.textAlign = 'right';
      ctx.fillStyle = 'rgba(255,240,200,0.6)';
      ctx.font = `13px ${FONT_UI}`;
      ctx.fillText('[Enter] 跳过演武', W - 32, H - 38);
    }
    ctx.restore();
  },

  drawUltCutin(ctx, u) {
    const p = clamp(u.t / u.dur, 0, 1);
    const enter = Ease.outCubic(clamp(p * 3.5, 0, 1));
    const exit = clamp((1 - p) * 4, 0, 1);
    ctx.save();
    ctx.fillStyle = rgba('#040208', 0.72 * exit);
    ctx.fillRect(0, 0, W, H);

    // Diagonal ink-gold cut-in banner
    ctx.save();
    ctx.translate(W * 0.5, H * 0.5);
    ctx.rotate(-0.12);
    const bh = 250 * enter * exit;
    const g = ctx.createLinearGradient(-W, 0, W, 0);
    g.addColorStop(0, '#07050c');
    g.addColorStop(0.5, mix('#140b18', u.color, 0.36));
    g.addColorStop(1, '#07050c');
    ctx.fillStyle = g;
    ctx.fillRect(-W, -bh * 0.5, W * 2, bh);

    ctx.strokeStyle = '#ffd868';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-W, -bh * 0.5); ctx.lineTo(W, -bh * 0.5);
    ctx.moveTo(-W, bh * 0.5); ctx.lineTo(W, bh * 0.5);
    ctx.stroke();

    // Speed lines
    ctx.strokeStyle = rgba(u.color, 0.35);
    ctx.lineWidth = 2;
    for (let i = -5; i <= 5; i++) {
      const ox = ((u.t * 1600 + i * 240) % 1600) - 800;
      ctx.beginPath();
      ctx.moveTo(ox - 180, i * 20);
      ctx.lineTo(ox + 180, i * 20);
      ctx.stroke();
    }
    ctx.restore();

    // Giant hero bust portrait on left
    ctx.save();
    ctx.globalAlpha = exit;
    const px = lerp(120, 330, enter);
    drawPortrait(ctx, u.heroId, px, H * 0.5, 138, u.t * 5, { awaken: true });
    ctx.restore();

    // Giant brush skill name on right
    const hero = HEROES[u.heroId];
    ctx.save();
    ctx.globalAlpha = exit;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    const tx = lerp(W * 0.58, W * 0.44, enter);
    ctx.fillStyle = '#ffe8a8';
    ctx.font = `bold 22px ${FONT_KAI}`;
    ctx.fillText(`${hero.name} · 梦烬奥义`, tx, H * 0.42);

    ctx.shadowColor = u.color;
    ctx.shadowBlur = 28;
    ctx.fillStyle = '#ffffff';
    ctx.font = `86px ${FONT_BRUSH}`;
    ctx.fillText(u.name, tx - 6, H * 0.53);
    ctx.restore();
    ctx.restore();
  },

  /* ============================================================
   *  BAG / EQUIPMENT / ENHANCEMENT WORKSHOP MODAL
   * ============================================================ */
  BagModal: {
    open: false,
    heroId: 'wukong',
    selType: 'bag', // 'bag' | 'equip'
    selBagIdx: 0,
    selSlot: 'weapon',
    msg: '',
    msgT: 0,
    msgCol: '#ffd868',
    _hits: [],

    show(heroId) {
      this.open = true;
      this.heroId = heroId || App.save.heroId;
      this.selType = App.save.bag.length > 0 ? 'bag' : 'equip';
      this.selBagIdx = 0;
      this.selSlot = 'weapon';
      this.msg = '';
      this.msgT = 0;
      this._hits = [];
    },
    close() {
      this.open = false;
      this._hits = [];
    },
    flash(txt, col = '#ffd868') {
      this.msg = txt;
      this.msgCol = col;
      this.msgT = 2.4;
    },
    selectedItem() {
      const prof = App.save.heroes[this.heroId];
      if (this.selType === 'equip') return prof.equip[this.selSlot] || null;
      return App.save.bag[this.selBagIdx] || null;
    },
    computedStats(heroId) {
      const prof = App.save.heroes[heroId];
      const base = heroBaseStats(HEROES[heroId], prof.lv);
      const eq = prof.equip || {};
      let { hp, mp, atk, def, crit, spd } = base;
      const legends = [];
      for (const s of ['weapon', 'armor', 'acc']) {
        const it = eq[s];
        if (!it) continue;
        const mv = LootGen.effectiveMain(it);
        if (it.mainStat === 'hp') hp += mv;
        else if (it.mainStat === 'atk') atk += mv;
        else if (it.mainStat === 'def') def += mv;
        for (const af of it.affixes || []) {
          if (af.key === 'hp') hp += af.val;
          else if (af.key === 'mp') mp += af.val;
          else if (af.key === 'atk') atk += af.val;
          else if (af.key === 'def') def += af.val;
          else if (af.key === 'crit') crit += af.val;
          else if (af.key === 'spd') spd += af.val;
        }
        if (it.legend) legends.push(it.legend);
      }
      return { hp: Math.round(hp), mp: Math.round(mp), atk: Math.round(atk), def: Math.round(def), crit: clamp(crit, 0, 0.85), spd: Math.round(spd), legends };
    },
    equipSelected(playerRef) {
      const prof = App.save.heroes[this.heroId];
      if (this.selType === 'bag') {
        const item = App.save.bag[this.selBagIdx];
        if (!item) return;
        const old = prof.equip[item.slot];
        prof.equip[item.slot] = item;
        App.save.bag.splice(this.selBagIdx, 1);
        if (old) App.save.bag.push(old);
        if (this.selBagIdx >= App.save.bag.length) this.selBagIdx = Math.max(0, App.save.bag.length - 1);
        Snd.play('uiok');
        this.flash(`已装备「${item.name}」`, QUALITIES[item.q].color);
      } else {
        const item = prof.equip[this.selSlot];
        if (!item) return;
        if (App.save.bag.length >= 40) {
          Snd.play('hurt');
          this.flash('行囊已满，请先出售或分解多余装备！', '#ff7068');
          return;
        }
        prof.equip[this.selSlot] = null;
        App.save.bag.push(item);
        Snd.play('ui');
        this.flash(`已卸下「${item.name}」`, '#dcdcdc');
      }
      if (playerRef) playerRef.recomputeStats(false);
      App.persist();
    },
    enhanceSelected(playerRef) {
      const item = this.selectedItem();
      if (!item) return;
      if ((item.enh || 0) >= 9) {
        Snd.play('ui');
        this.flash('此法器已达 +9 巅峰品阶！', '#ffd868');
        return;
      }
      const cost = LootGen.enhanceCost(item);
      if (App.save.coins < cost.coins || App.save.souls < cost.souls) {
        Snd.play('hurt');
        this.flash(`材料不足：需 ${cost.coins} 灵石、${cost.souls} 炼魂`, '#ff7068');
        return;
      }
      App.save.coins -= cost.coins;
      App.save.souls -= cost.souls;
      item.enh = (item.enh || 0) + 1;
      Snd.play('levelup');
      this.flash(`淬炼成功！「${item.name}」升至 +${item.enh}`, '#ffd868');
      if (playerRef) playerRef.recomputeStats(false);
      App.persist();
    },
    sellSelected() {
      if (this.selType !== 'bag') {
        this.flash('已穿戴装备需先卸下方可出售', '#ffaa55');
        return;
      }
      const item = App.save.bag[this.selBagIdx];
      if (!item) return;
      const val = LootGen.sellValue(item);
      App.save.bag.splice(this.selBagIdx, 1);
      App.save.coins += val;
      if (this.selBagIdx >= App.save.bag.length) this.selBagIdx = Math.max(0, App.save.bag.length - 1);
      Snd.play('coin');
      this.flash(`售出「${item.name}」，获得 ${val} 灵石`, '#ffd868');
      App.persist();
    },
    salvageLow() {
      let count = 0, gainCoins = 0, gainSouls = 0;
      for (let i = App.save.bag.length - 1; i >= 0; i--) {
        const it = App.save.bag[i];
        if (it.q <= 1 && (it.enh || 0) === 0) {
          gainCoins += LootGen.sellValue(it);
          gainSouls += it.q === 1 ? 6 : 2;
          App.save.bag.splice(i, 1);
          count++;
        }
      }
      if (count === 0) {
        Snd.play('ui');
        this.flash('行囊内没有未强化的 凡/灵 品质装备', '#ccc');
        return;
      }
      App.save.coins += gainCoins;
      App.save.souls += gainSouls;
      this.selBagIdx = Math.min(this.selBagIdx, Math.max(0, App.save.bag.length - 1));
      Snd.play('loot');
      this.flash(`熔炼 ${count} 件凡灵装备：+${gainCoins} 灵石，+${gainSouls} 炼魂`, '#7beeff');
      App.persist();
    },

    update(dt, playerRef) {
      if (!this.open) return false;
      if (this.msgT > 0) this.msgT = Math.max(0, this.msgT - dt);

      if (Input.hit('pause') || Input.hit('bag') || Input.hit('back')) {
        Snd.play('uiback');
        this.close();
        return true;
      }
      if (Input.hit('confirm')) {
        this.equipSelected(playerRef);
        return true;
      }
      if (Input.hit('sell')) {
        this.sellSelected();
        return true;
      }
      if (Input.hit('left') && App.save.bag.length > 0 && this.selType === 'bag') {
        this.selBagIdx = Math.max(0, this.selBagIdx - 1);
        Snd.play('ui', { vol: 0.45 });
      }
      if (Input.hit('right') && App.save.bag.length > 0 && this.selType === 'bag') {
        this.selBagIdx = Math.min(App.save.bag.length - 1, this.selBagIdx + 1);
        Snd.play('ui', { vol: 0.45 });
      }
      if (Input.hit('up') && App.save.bag.length > 0 && this.selType === 'bag') {
        this.selBagIdx = Math.max(0, this.selBagIdx - 6);
        Snd.play('ui', { vol: 0.45 });
      }
      if (Input.hit('down') && App.save.bag.length > 0 && this.selType === 'bag') {
        this.selBagIdx = Math.min(App.save.bag.length - 1, this.selBagIdx + 6);
        Snd.play('ui', { vol: 0.45 });
      }

      if (Input.mouse.clicked) {
        for (const h of this._hits) {
          if (UI.hit(h.x, h.y, h.w, h.h)) {
            h.fn(playerRef);
            return true;
          }
        }
      }
      return true;
    },

    draw(ctx, playerRef) {
      if (!this.open) return;
      this._hits = [];
      const addHit = (x, y, w, h, fn) => this._hits.push({ x, y, w, h, fn });

      ctx.save();
      ctx.fillStyle = 'rgba(4, 3, 8, 0.78)';
      ctx.fillRect(0, 0, W, H);

      const px = 74, py = 42, pw = W - 148, ph = H - 84;
      UI.drawPanel(ctx, px, py, pw, ph, {
        radius: 12, bg: 'rgba(13, 10, 18, 0.96)', border: '#e2ae52', glow: '#a86a18',
        title: `行囊法宝 · 炼器阁 (${HEROES[this.heroId].name})`,
      });

      // Top-right close & currencies
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.font = `bold 14px ${FONT_NUM}`;
      ctx.fillStyle = '#ffd868';
      ctx.fillText(`灵石 ${App.save.coins}`, px + pw - 210, py + 28);
      ctx.fillStyle = '#7beeff';
      ctx.fillText(`炼魂 ${App.save.souls}`, px + pw - 115, py + 28);
      const closeBtn = UI.drawBtn(ctx, px + pw - 96, py + 12, 76, 30, '关闭', { fontSize: 14, color: '#ff8a7a' });
      addHit(closeBtn.x, closeBtn.y, closeBtn.w, closeBtn.h, () => { Snd.play('uiback'); this.close(); });

      // Column 1: Hero Stats + Equipped Gear + Treasures (x: px+20, w: 326)
      const c1x = px + 20, c1y = py + 60, c1w = 330;
      UI.drawPanel(ctx, c1x, c1y, c1w, 250, { radius: 8, bg: 'rgba(20,15,26,0.85)', border: HEROES[this.heroId].color, borderAlpha: 0.45, corners: false });
      drawPortrait(ctx, this.heroId, c1x + 56, c1y + 56, 38, performance.now() * 0.001, {});
      const prof = App.save.heroes[this.heroId];
      const st = this.computedStats(this.heroId);

      ctx.textAlign = 'left';
      ctx.fillStyle = '#fff3d6';
      ctx.font = `bold 20px ${FONT_KAI}`;
      ctx.fillText(`${HEROES[this.heroId].name}  Lv.${prof.lv}`, c1x + 106, c1y + 36);
      ctx.fillStyle = HEROES[this.heroId].accent;
      ctx.font = `13px ${FONT_UI}`;
      ctx.fillText(HEROES[this.heroId].title, c1x + 106, c1y + 58);
      ctx.fillStyle = '#cbbca4';
      ctx.font = `12px ${FONT_NUM}`;
      ctx.fillText(`修为 ${prof.xp} / ${xpNeed(prof.lv)}`, c1x + 106, c1y + 80);

      const statRows = [
        ['气血', st.hp, '#ff7868'], ['法力', st.mp, '#68d4ff'],
        ['攻击', st.atk, '#ffd468'], ['防御', st.def, '#78e8a8'],
        ['暴击', Math.round(st.crit * 100) + '%', '#ff9e48'], ['身法', st.spd, '#b69eff'],
      ];
      statRows.forEach(([k, v, c], idx) => {
        const sx = c1x + 18 + (idx % 2) * 155;
        const sy = c1y + 116 + Math.floor(idx / 2) * 28;
        ctx.fillStyle = '#a89c8a';
        ctx.font = `13px ${FONT_UI}`;
        ctx.fillText(k, sx, sy);
        ctx.fillStyle = c;
        ctx.font = `bold 15px ${FONT_NUM}`;
        ctx.fillText(String(v), sx + 48, sy);
      });

      if (st.legends.length > 0) {
        ctx.fillStyle = '#ffaa30';
        ctx.font = `12px ${FONT_UI}`;
        ctx.fillText('梦烬特技: ' + st.legends.map(l => l.name).join(' · '), c1x + 18, c1y + 214);
      } else {
        ctx.fillStyle = 'rgba(200,190,175,0.55)';
        ctx.font = `12px ${FONT_UI}`;
        ctx.fillText('装备「梦烬」品质器物可觉醒传世特技', c1x + 18, c1y + 214);
      }

      // 3 Equipped Slots + Active 法宝
      const eqY = c1y + 264;
      const slotOrder = ['weapon', 'armor', 'acc'];
      slotOrder.forEach((slotKey, i) => {
        const sx = c1x + i * 112, sy = eqY, sw = 104, sh = 104;
        const sel = this.selType === 'equip' && this.selSlot === slotKey;
        const eqIt = prof.equip[slotKey];
        const hov = UI.hit(sx, sy, sw, sh);
        UI.drawPanel(ctx, sx, sy, sw, sh, {
          radius: 8,
          bg: sel ? 'rgba(42, 30, 18, 0.92)' : 'rgba(18, 14, 24, 0.88)',
          border: sel ? '#ffd868' : hov ? '#ffe8b8' : '#6e5a40',
          glow: sel ? '#ffb848' : null,
          corners: sel,
        });
        if (eqIt) {
          UI.drawItemIcon(ctx, eqIt, sx + 23, sy + 12, 58);
          ctx.fillStyle = QUALITIES[eqIt.q].color;
          ctx.font = `11px ${FONT_UI}`;
          ctx.textAlign = 'center';
          ctx.fillText(eqIt.name.slice(0, 7), sx + sw * 0.5, sy + 86);
        } else {
          ctx.fillStyle = 'rgba(200,185,160,0.42)';
          ctx.font = `14px ${FONT_KAI}`;
          ctx.textAlign = 'center';
          ctx.fillText(SLOTS[slotKey].name, sx + sw * 0.5, sy + 44);
          ctx.font = `11px ${FONT_UI}`;
          ctx.fillText('未装备', sx + sw * 0.5, sy + 66);
        }
        addHit(sx, sy, sw, sh, () => {
          this.selType = 'equip';
          this.selSlot = slotKey;
          Snd.play('ui', { vol: 0.5 });
        });
      });

      // Owned 法宝 selector strip below equipped gear
      const trY = eqY + 118;
      UI.drawPanel(ctx, c1x, trY, c1w, 174, { radius: 8, bg: 'rgba(18,14,24,0.85)', border: '#a88246', borderAlpha: 0.45, corners: false });
      ctx.fillStyle = '#ffe4a8';
      ctx.font = `bold 14px ${FONT_KAI}`;
      ctx.textAlign = 'left';
      ctx.fillText('佩带法宝 (点击切换)', c1x + 14, trY + 20);
      const tIds = Object.keys(TREASURES);
      tIds.forEach((tid, idx) => {
        const tx = c1x + 14 + idx * 61;
        const ty = trY + 38;
        const owned = App.save.treasures.includes(tid);
        const active = prof.treasure === tid;
        const tr = TREASURES[tid];
        UI.drawPanel(ctx, tx, ty, 54, 54, {
          radius: 8,
          bg: active ? mix('#201812', tr.color, 0.25) : owned ? '#14101c' : '#09070c',
          border: active ? '#ffd868' : owned ? tr.color : '#443c48',
          glow: active ? tr.color : null,
          corners: active,
        });
        ctx.fillStyle = owned ? tr.color : 'rgba(140,130,145,0.35)';
        ctx.font = `28px ${FONT_BRUSH}`;
        ctx.textAlign = 'center';
        ctx.fillText(tr.glyph, tx + 27, ty + 29);
        if (owned) {
          addHit(tx, ty, 54, 54, () => {
            prof.treasure = prof.treasure === tid ? null : tid;
            Snd.play('uiok');
            this.flash(prof.treasure ? `已佩带法宝「${tr.name}」` : '已收起法宝', tr.color);
            App.persist();
          });
        }
      });
      const curTr = prof.treasure ? TREASURES[prof.treasure] : null;
      ctx.textAlign = 'left';
      ctx.fillStyle = curTr ? curTr.color : '#8c8070';
      ctx.font = `bold 13px ${FONT_UI}`;
      ctx.fillText(curTr ? `当前: ${curTr.name} (冷却 ${curTr.cd}s)` : '击败各回劫主可解锁专属法宝', c1x + 14, trY + 114);
      if (curTr) {
        ctx.fillStyle = '#d4c6b0';
        ctx.font = `12px ${FONT_UI}`;
        this._wrapText(ctx, curTr.desc, c1x + 14, trY + 136, c1w - 28, 17);
      }

      // Column 2: Bag Grid (40 slots, 6x7 -> 40 fits easily!)
      const c2x = c1x + c1w + 18, c2y = c1y, c2w = 424;
      UI.drawPanel(ctx, c2x, c2y, c2w, 556, { radius: 8, bg: 'rgba(18,14,24,0.85)', border: '#a88246', borderAlpha: 0.45, corners: false });
      ctx.textAlign = 'left';
      ctx.fillStyle = '#ffe4a8';
      ctx.font = `bold 15px ${FONT_KAI}`;
      ctx.fillText(`乾坤行囊  (${App.save.bag.length} / 40)`, c2x + 16, c2y + 22);

      const salvBtn = UI.drawBtn(ctx, c2x + c2w - 148, c2y + 8, 134, 28, '熔炼凡/灵散件', { fontSize: 12, color: '#7beeff' });
      addHit(salvBtn.x, salvBtn.y, salvBtn.w, salvBtn.h, () => this.salvageLow());

      const cols = 6, cell = 60, gap = 7;
      for (let i = 0; i < 40; i++) {
        const r = Math.floor(i / cols), c = i % cols;
        const bx = c2x + 15 + c * (cell + gap);
        const by = c2y + 44 + r * (cell + gap);
        const item = App.save.bag[i];
        const sel = this.selType === 'bag' && this.selBagIdx === i;
        if (item) {
          UI.drawItemIcon(ctx, item, bx, by, cell);
          if (sel) {
            ctx.strokeStyle = '#ffd868';
            ctx.lineWidth = 2.6;
            UI.roundPath(ctx, bx - 2, by - 2, cell + 4, cell + 4, 7);
            ctx.stroke();
          }
          addHit(bx, by, cell, cell, () => {
            this.selType = 'bag';
            this.selBagIdx = i;
            Snd.play('ui', { vol: 0.5 });
          });
        } else {
          UI.roundPath(ctx, bx, by, cell, cell, 6);
          ctx.fillStyle = 'rgba(255,255,255,0.03)';
          ctx.fill();
          ctx.strokeStyle = 'rgba(255,255,255,0.08)';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      // Column 3: Inspector + Actions
      const c3x = c2x + c2w + 18, c3y = c1y, c3w = px + pw - 20 - c3x;
      UI.drawPanel(ctx, c3x, c3y, c3w, 556, { radius: 8, bg: 'rgba(20,15,28,0.9)', border: '#cfa04c', borderAlpha: 0.55, corners: true });
      const selIt = this.selectedItem();
      if (selIt) {
        const Q = QUALITIES[selIt.q];
        UI.drawItemIcon(ctx, selIt, c3x + 20, c3y + 20, 68);
        ctx.textAlign = 'left';
        ctx.fillStyle = Q.color;
        ctx.font = `bold 20px ${FONT_KAI}`;
        ctx.fillText(`${selIt.name}${selIt.enh ? ' +' + selIt.enh : ''}`, c3x + 100, c3y + 38);
        ctx.fillStyle = '#cfc2ad';
        ctx.font = `13px ${FONT_UI}`;
        ctx.fillText(`${Q.name}品 ${SLOTS[selIt.slot].name} · 需求等级 Lv.${selIt.lv}`, c3x + 100, c3y + 64);

        UI.drawDivider(ctx, c3x + 18, c3y + 102, c3w - 36, Q.color);

        const eff = LootGen.effectiveMain(selIt);
        const curEq = prof.equip[selIt.slot];
        ctx.fillStyle = '#fff5dc';
        ctx.font = `bold 18px ${FONT_UI}`;
        ctx.fillText(`${SLOTS[selIt.slot].label}  +${eff}`, c3x + 22, c3y + 130);

        if (this.selType === 'bag' && curEq) {
          const delta = eff - LootGen.effectiveMain(curEq);
          if (delta !== 0) {
            ctx.fillStyle = delta > 0 ? '#68ff98' : '#ff7068';
            ctx.font = `bold 14px ${FONT_NUM}`;
            ctx.fillText(delta > 0 ? `(${'+' + delta} 提升)` : `(${delta})`, c3x + 165, c3y + 130);
          }
        }

        let ay = c3y + 164;
        for (const af of selIt.affixes || []) {
          ctx.fillStyle = '#8ce0ff';
          ctx.font = `14px ${FONT_UI}`;
          ctx.fillText(`◆ ${af.text}`, c3x + 24, ay);
          ay += 24;
        }
        if (selIt.legend) {
          ay += 6;
          ctx.fillStyle = '#ffaa30';
          ctx.font = `bold 14px ${FONT_UI}`;
          ctx.fillText(`★ ${selIt.legend.name}`, c3x + 24, ay);
          ctx.fillStyle = '#f0dec0';
          ctx.font = `12px ${FONT_UI}`;
          this._wrapText(ctx, selIt.legend.desc, c3x + 24, ay + 22, c3w - 48, 18);
        }

        // Action Buttons at bottom of inspector
        const cost = LootGen.enhanceCost(selIt);
        const eqLabel = this.selType === 'bag' ? '装备此器 [Enter]' : '卸下入囊 [Enter]';
        const b1 = UI.drawBtn(ctx, c3x + 20, c3y + 370, c3w - 40, 44, eqLabel, { color: Q.color, fontSize: 17 });
        addHit(b1.x, b1.y, b1.w, b1.h, (pr) => this.equipSelected(pr));

        const enhLabel = (selIt.enh || 0) >= 9 ? '已臻绝巅 (+9)' : `淬炼强化 +${(selIt.enh || 0) + 1}`;
        const enhSub = (selIt.enh || 0) >= 9 ? '' : `${cost.coins} 灵石  ·  ${cost.souls} 炼魂`;
        const b2 = UI.drawBtn(ctx, c3x + 20, c3y + 424, c3w - 40, 52, enhLabel, { sub: enhSub, color: '#ffd868', fontSize: 16, disabled: (selIt.enh || 0) >= 9 });
        addHit(b2.x, b2.y, b2.w, b2.h, (pr) => this.enhanceSelected(pr));

        if (this.selType === 'bag') {
          const val = LootGen.sellValue(selIt);
          const b3 = UI.drawBtn(ctx, c3x + 20, c3y + 488, c3w - 40, 42, `出售法器 (+${val} 灵石) [X]`, { color: '#ff8a68', fontSize: 15 });
          addHit(b3.x, b3.y, b3.w, b3.h, () => this.sellSelected());
        }
      } else {
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(205,190,170,0.5)';
        ctx.font = `16px ${FONT_KAI}`;
        ctx.fillText('点击左侧装备槽或右侧行囊', c3x + c3w * 0.5, c3y + 220);
        ctx.fillText('查看属性并淬炼强化法器', c3x + c3w * 0.5, c3y + 248);
      }

      // Flash message
      if (this.msgT > 0 && this.msg) {
        ctx.textAlign = 'center';
        ctx.fillStyle = this.msgCol;
        ctx.font = `bold 15px ${FONT_UI}`;
        ctx.fillText(this.msg, px + pw * 0.5, py + ph - 20);
      }
      ctx.restore();
    },

    _wrapText(ctx, text, x, y, maxW, lh) {
      let line = '';
      for (const ch of text) {
        const test = line + ch;
        if (ctx.measureText(test).width > maxW) {
          ctx.fillText(line, x, y);
          line = ch;
          y += lh;
        } else {
          line = test;
        }
      }
      if (line) ctx.fillText(line, x, y);
    },
  },

  /* ============================================================
   *  SETTINGS MODAL
   * ============================================================ */
  SettingsModal: {
    open: false,
    confirmReset: false,
    _hits: [],

    show() { this.open = true; this.confirmReset = false; this._hits = []; },
    close() { this.open = false; this.confirmReset = false; },

    update(dt) {
      if (!this.open) return false;
      if (Input.hit('pause') || Input.hit('back')) {
        Snd.play('uiback');
        this.close();
        return true;
      }
      if (Input.mouse.clicked) {
        for (const h of this._hits) {
          if (UI.hit(h.x, h.y, h.w, h.h)) {
            h.fn(Input.mouse.x);
            return true;
          }
        }
      }
      return true;
    },

    draw(ctx) {
      if (!this.open) return;
      this._hits = [];
      const addHit = (x, y, w, h, fn) => this._hits.push({ x, y, w, h, fn });

      ctx.save();
      ctx.fillStyle = 'rgba(4, 3, 8, 0.78)';
      ctx.fillRect(0, 0, W, H);

      const pw = 560, ph = 440, px = (W - pw) * 0.5, py = (H - ph) * 0.5;
      UI.drawPanel(ctx, px, py, pw, ph, { radius: 12, border: '#e2ae52', glow: '#b87a20', title: '天音玉律 · 系统设置' });

      const bars = [
        ['总音量 (Master)', 'master'],
        ['丝竹配乐 (Music)', 'music'],
        ['神兵音效 (SFX)', 'sfx'],
      ];
      bars.forEach(([label, key], i) => {
        const by = py + 82 + i * 64;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#efe2c8';
        ctx.font = `15px ${FONT_UI}`;
        ctx.fillText(label, px + 44, by);

        const val = Snd.settings[key];
        ctx.textAlign = 'right';
        ctx.fillStyle = '#ffd868';
        ctx.font = `bold 15px ${FONT_NUM}`;
        ctx.fillText(Math.round(val * 100) + '%', px + pw - 44, by);

        const sx = px + 44, sy = by + 18, sw = pw - 88, sh = 14;
        UI.roundPath(ctx, sx, sy, sw, sh, 6);
        ctx.fillStyle = '#191420';
        ctx.fill();
        ctx.fillStyle = '#ffb848';
        UI.roundPath(ctx, sx, sy, Math.max(8, sw * val), sh, 6);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,216,104,0.5)';
        ctx.lineWidth = 1;
        UI.roundPath(ctx, sx, sy, sw, sh, 6);
        ctx.stroke();

        addHit(sx, sy - 8, sw, sh + 16, (mx) => {
          Snd.settings[key] = clamp((mx - sx) / sw, 0, 1);
          Snd.applyVolumes();
          Snd.play('ui', { vol: 0.6 });
        });
      });

      const bMute = UI.drawBtn(ctx, px + 44, py + 278, 224, 42, Snd.settings.muted ? '当前：已静音 [M]' : '当前：声音开启 [M]', { color: '#6ad8ff', fontSize: 15 });
      addHit(bMute.x, bMute.y, bMute.w, bMute.h, () => {
        Snd.settings.muted = !Snd.settings.muted;
        Snd.applyVolumes();
        Snd.play('uiok');
      });

      const bFs = UI.drawBtn(ctx, px + pw - 268, py + 278, 224, 42, '切换全屏模式 [F]', { color: '#ffd868', fontSize: 15 });
      addHit(bFs.x, bFs.y, bFs.w, bFs.h, () => {
        if (App && App.toggleFullscreen) App.toggleFullscreen();
      });

      const bReset = UI.drawBtn(ctx, px + 44, py + 336, 224, 42,
        this.confirmReset ? '再次点击确认清零存档！' : '清除本地存档', { color: '#ff5e54', fontSize: 15 });
      addHit(bReset.x, bReset.y, bReset.w, bReset.h, () => {
        if (!this.confirmReset) {
          this.confirmReset = true;
          Snd.play('warn');
        } else {
          Save.clear();
          App.resetSave();
          this.confirmReset = false;
          Snd.play('gong');
          this.close();
          App.enterScene(new TitleScene());
        }
      });

      const bDone = UI.drawBtn(ctx, px + pw - 268, py + 336, 224, 42, '返回 [Esc]', { color: '#78e8a8', fontSize: 15 });
      addHit(bDone.x, bDone.y, bDone.w, bDone.h, () => { Snd.play('uiback'); this.close(); });
      ctx.restore();
    },
  },

  /* ============================================================
   *  CONTROLS / COMBAT MANUAL MODAL
   * ============================================================ */
  ControlsModal: {
    open: false,
    _hits: [],
    show() { this.open = true; this._hits = []; },
    close() { this.open = false; },
    update() {
      if (!this.open) return false;
      if (Input.hit('pause') || Input.hit('back') || Input.hit('confirm')) {
        Snd.play('uiback');
        this.close();
        return true;
      }
      if (Input.mouse.clicked) {
        for (const h of this._hits) if (UI.hit(h.x, h.y, h.w, h.h)) { h.fn(); return true; }
      }
      return true;
    },
    draw(ctx) {
      if (!this.open) return;
      this._hits = [];
      ctx.save();
      ctx.fillStyle = 'rgba(4, 3, 8, 0.78)';
      ctx.fillRect(0, 0, W, H);
      const pw = 680, ph = 500, px = (W - pw) * 0.5, py = (H - ph) * 0.5;
      UI.drawPanel(ctx, px, py, pw, ph, { radius: 12, border: '#e2ae52', title: '武学秘籍 · 操作与战斗机制' });

      const rows = [
        ['A / D 或 ← / →', '左右腾挪走位（支持手柄摇杆与十字键）'],
        ['K / W / ↑', '纵跃与二段轻功跳跃（S + K 可穿落高台）'],
        ['J', '四段连招神兵斩击；空中 J 为飞燕旋击'],
        ['W + J', '升龙挑飞技：将敌妖震入浮空接续空战连击'],
        ['空中 S + J', '千钧下劈：高速坠击大地并引爆震波'],
        ['L / Shift', '瞬影疾闪（无敌帧）：迎击刹那触发【极限闪避】时停回血回梦烬'],
        ['U / I / O', '角色三大绝技（消耗法力，自带霸体或远程破敌）'],
        ['E / H', '祭出已佩带的【先天法宝】（葫芦、珍珠伞、剑阵等）'],
        ['Space (空格)', '梦烬满格时觉醒奥义大招，9秒内攻暴移速全增！'],
        ['B', '随时开启乾坤行囊：换装、淬炼+9强化、分解、切换法宝'],
      ];
      rows.forEach(([k, v], i) => {
        const ry = py + 76 + i * 36;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ffd868';
        ctx.font = `bold 14px ${FONT_NUM}`;
        ctx.fillText(k, px + 36, ry);
        ctx.fillStyle = '#eae0ce';
        ctx.font = `14px ${FONT_UI}`;
        ctx.fillText(v, px + 190, ry);
      });

      const b = UI.drawBtn(ctx, W * 0.5 - 90, py + ph - 58, 180, 40, '已知晓 [Esc]', { color: '#ffd868', fontSize: 16 });
      this._hits.push({ x: b.x, y: b.y, w: b.w, h: b.h, fn: () => { Snd.play('uiback'); this.close(); } });
      ctx.restore();
    },
  },

  /* ============================================================
   *  PAUSE MODAL
   * ============================================================ */
  PauseModal: {
    open: false,
    idx: 0,
    _hits: [],
    show() { this.open = true; this.idx = 0; this._hits = []; },
    close() { this.open = false; },
    update(actions) {
      if (!this.open) return false;
      if (Input.hit('pause') || Input.hit('back')) { Snd.play('uiback'); this.close(); return true; }
      if (Input.hit('up')) { this.idx = (this.idx + 4) % 5; Snd.play('ui', { vol: 0.5 }); }
      if (Input.hit('down')) { this.idx = (this.idx + 1) % 5; Snd.play('ui', { vol: 0.5 }); }
      if (Input.hit('confirm')) {
        this._trigger(this.idx, actions);
        return true;
      }
      if (Input.mouse.clicked) {
        for (const h of this._hits) if (UI.hit(h.x, h.y, h.w, h.h)) { h.fn(); return true; }
      }
      return true;
    },
    _trigger(i, actions) {
      Snd.play('uiok');
      if (i === 0) this.close();
      else if (i === 1) { this.close(); actions.openBag(); }
      else if (i === 2) { UI.ControlsModal.show(); }
      else if (i === 3) { UI.SettingsModal.show(); }
      else if (i === 4) { this.close(); actions.toMap(); }
    },
    draw(ctx, actions) {
      if (!this.open) return;
      this._hits = [];
      ctx.save();
      ctx.fillStyle = 'rgba(4, 3, 8, 0.72)';
      ctx.fillRect(0, 0, W, H);
      const pw = 360, ph = 390, px = (W - pw) * 0.5, py = (H - ph) * 0.5;
      UI.drawPanel(ctx, px, py, pw, ph, { radius: 12, border: '#e2ae52', title: '暂歇神思' });

      const labels = ['继续征战', '行囊整备 [B]', '武学操作指南', '音效与系统设置', '撤回九州堪舆图'];
      labels.forEach((lbl, i) => {
        const b = UI.drawBtn(ctx, px + 44, py + 76 + i * 56, pw - 88, 44, lbl, {
          active: this.idx === i,
          color: i === 4 ? '#ff7e68' : '#ffd868',
          fontSize: 17,
        });
        if (b.hovered) this.idx = i;
        this._hits.push({ x: b.x, y: b.y, w: b.w, h: b.h, fn: () => this._trigger(i, actions) });
      });
      ctx.restore();
    },
  },
};
