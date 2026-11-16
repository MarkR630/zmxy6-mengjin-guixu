'use strict';
/* ============================================================
 *  SCENES — Ink Transition, Title, Prologue, Select, Map,
 *           Play, Result, and Ending Scenes
 * ============================================================ */

/* ---------- Ink-Wash Screen Transition ---------- */
const InkTransition = {
  active: false,
  phase: 'idle', // 'out' | 'in' | 'idle'
  t: 0,
  durOut: 0.28,
  durIn: 0.34,
  nextFn: null,

  start(fn, outDur = 0.28, inDur = 0.34) {
    this.active = true;
    this.phase = 'out';
    this.t = 0;
    this.durOut = outDur;
    this.durIn = inDur;
    this.nextFn = fn;
  },

  update(dt) {
    if (!this.active) return false;
    this.t += dt;
    if (this.phase === 'out' && this.t >= this.durOut) {
      if (this.nextFn) { this.nextFn(); this.nextFn = null; }
      this.phase = 'in';
      this.t = 0;
    } else if (this.phase === 'in' && this.t >= this.durIn) {
      this.active = false;
      this.phase = 'idle';
    }
    return this.phase === 'out';
  },

  draw(ctx) {
    if (!this.active) return;
    const p = this.phase === 'out'
      ? Ease.inCubic(clamp(this.t / this.durOut, 0, 1))
      : 1 - Ease.outCubic(clamp(this.t / this.durIn, 0, 1));
    if (p <= 0.005) return;

    ctx.save();
    ctx.fillStyle = rgba('#050408', p);
    ctx.fillRect(0, 0, W, H);

    // Organic horizontal ink-brush wipe streaks
    ctx.fillStyle = rgba('#0b0812', p * 0.9);
    for (let i = 0; i < 6; i++) {
      const y = i * (H / 5.2);
      const w = W * p * (1.1 + 0.15 * Math.sin(i * 2.1));
      const x = (i % 2 === 0) ? 0 : W - w;
      ctx.fillRect(x, y - 40, w, 130);
    }
    ctx.restore();
  },
};

/* ---------- Showcase Rig Helper for Title / Select / Ending ---------- */
function createShowcase(heroId, scaleMul = 1.85, awaken = false) {
  const hero = HEROES[heroId];
  const baseS = STYLES[heroId];
  const S = Object.assign({}, baseS, { scale: baseS.scale * scaleMul });
  const pose = POSES[hero.idlePose].slice();
  const cloth = S.cloth ? new Cloth(S.cloth, 0, 0) : null;
  return { heroId, hero, S, pose, cloth, t: 0, awaken, flourishT: 0 };
}

function updateShowcase(sh, x, y, dir, dt) {
  sh.t += dt;
  if (sh.flourishT > 0) sh.flourishT = Math.max(0, sh.flourishT - dt);

  const idle = POSES[sh.hero.idlePose].slice();
  idle[1] = Math.sin(sh.t * 2.6) * 1.8;
  idle[3] += Math.sin(sh.t * 2.6) * 0.045;
  if (sh.flourishT > 0) {
    const atkPose = sh.hero.combo[0].pose1;
    const u = Math.sin((sh.flourishT / 0.55) * PI);
    poseLerp(idle, atkPose, clamp(u, 0, 1), sh.pose);
  } else {
    poseLerp(sh.pose, idle, 1 - Math.exp(-10 * dt), sh.pose);
  }

  if (sh.cloth) {
    const J = solveRig(sh.pose, sh.S, true);
    const anc = sh.S.cloth.anchor === 'head' ? J.head : sh.S.cloth.anchor === 'hip' ? J.hip : J.neck;
    const wp = rigToWorld({ x, y, dir }, J, anc, sh.S);
    sh.cloth.update(wp.x, wp.y, dt, -dir * (210 + Math.sin(sh.t * 2) * 55), sh.S.scale);
  }
}

function drawShowcase(ctx, sh, x, y, dir) {
  drawGroundShadow(ctx, x, y, 42 * (sh.S.scale / 1.15), y);
  if (sh.awaken) drawAwakenAura(ctx, x, y, sh.hero.color, sh.t, 1.05);
  if (sh.cloth) sh.cloth.draw(ctx, sh.S.scale);
  drawRig(ctx, x, y, dir, sh.pose, sh.S, {
    t: sh.t,
    grounded: true,
    rim: sh.hero.accent || sh.hero.color,
    glowMul: sh.awaken ? 1.55 : 1.15,
  });
}

/* ============================================================
 *  1. TITLE SCENE
 * ============================================================ */
class TitleScene {
  constructor() {
    this.bg = new Background('void', 7);
    this.cam = { x: W * 0.5, y: 360, zoom: 1 };
    this.t = 0;
    this.idx = 0;
    this.hasContinue = App.save.unlockedStage > 1 || App.save.coins > 120 || App.save.bag.length > 0;
    this.hero = createShowcase('wukong', 2.0, true);
    this.heroX = 955;
    this.heroY = 548;
    this._hits = [];
    Music.play('title');
  }

  menuItems() {
    const list = [];
    if (this.hasContinue) {
      list.push({ id: 'continue', label: '继续西行 · 堪舆图', sub: `已开启第 ${App.save.unlockedStage} 回`, col: '#ffd868' });
    }
    list.push({ id: 'new', label: this.hasContinue ? '重览前尘 · 点将台' : '初入劫途 · 开启新篇', sub: '择五圣出征 破除梦烬', col: '#ff8e38' });
    list.push({ id: 'controls', label: '武学操作指南', sub: '连招 · 浮空 · 极限闪避 · 法宝', col: '#78d8ff' });
    list.push({ id: 'settings', label: '天音玉律设置', sub: '音量 · 全屏 · 存档管理', col: '#d8b6ff' });
    return list;
  }

  activate(id) {
    Snd.play('uiok');
    if (id === 'continue') {
      App.enterScene(new MapScene());
    } else if (id === 'new') {
      if (!App.save.prologueSeen) App.enterScene(new PrologueScene());
      else App.enterScene(new SelectScene());
    } else if (id === 'controls') {
      UI.ControlsModal.show();
    } else if (id === 'settings') {
      UI.SettingsModal.show();
    }
  }

  update(dt) {
    this.t += dt;
    this.bg.update(dt * 0.7);
    updateShowcase(this.hero, this.heroX, this.heroY, -1, dt);

    if (UI.SettingsModal.update(dt) || UI.ControlsModal.update(dt)) return;

    const items = this.menuItems();
    if (Input.hit('up')) {
      this.idx = (this.idx - 1 + items.length) % items.length;
      Snd.play('ui', { vol: 0.5 });
    }
    if (Input.hit('down')) {
      this.idx = (this.idx + 1) % items.length;
      Snd.play('ui', { vol: 0.5 });
    }
    if (Input.hit('confirm')) {
      this.activate(items[this.idx].id);
      return;
    }
    if (Input.mouse.clicked) {
      for (const h of this._hits) {
        if (UI.hit(h.x, h.y, h.w, h.h)) { h.fn(); return; }
      }
      // clicking character plays flourish!
      if (Math.abs(Input.mouse.x - this.heroX) < 110 && Input.mouse.y > 260 && Input.mouse.y < 590) {
        this.hero.flourishT = 0.55;
        Snd.play('swing');
      }
    }
  }

  draw(ctx) {
    this._hits = [];
    this.bg.drawBack(ctx, this.cam);

    // Subtle cosmic taiji / mystic mandala vortex behind Wukong spire
    ctx.save();
    ctx.translate(this.heroX, 390);
    ctx.rotate(this.t * 0.14);
    ctx.strokeStyle = rgba('#ffb040', 0.16);
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, 0, 210, 0, TAU); ctx.stroke();
    ctx.setLineDash([12, 16]);
    ctx.beginPath(); ctx.arc(0, 0, 170, 0, TAU); ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // Jagged obsidian cliff spire under hero
    ctx.save();
    const cg = ctx.createLinearGradient(0, this.heroY - 8, 0, H);
    cg.addColorStop(0, '#221418');
    cg.addColorStop(0.25, '#120b12');
    cg.addColorStop(1, '#060409');
    ctx.fillStyle = cg;
    ctx.beginPath();
    ctx.moveTo(760, H);
    ctx.lineTo(820, this.heroY + 26);
    ctx.lineTo(890, this.heroY);
    ctx.lineTo(1030, this.heroY - 3);
    ctx.lineTo(1110, this.heroY + 34);
    ctx.lineTo(1180, H);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = rgba('#ff9a3c', 0.55);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(820, this.heroY + 26);
    ctx.lineTo(890, this.heroY);
    ctx.lineTo(1030, this.heroY - 3);
    ctx.stroke();
    ctx.restore();

    // Showcase animated Sun Wukong!
    drawShowcase(ctx, this.hero, this.heroX, this.heroY, -1);

    this.bg.drawFront(ctx, this.cam);
    this.bg.drawGrade(ctx);
    Post.draw(ctx, 1.0);

    // Title Typography & Seal on Left
    ctx.save();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    ctx.fillStyle = 'rgba(255, 208, 128, 0.78)';
    ctx.font = `bold 15px ${FONT_KAI}`;
    ctx.fillText('东方墨金横版动作史诗 · 第六季正统续篇', 92, 108);

    // Main Calligraphy Logo
    ctx.shadowColor = 'rgba(255, 118, 28, 0.72)';
    ctx.shadowBlur = 28;
    const tg = ctx.createLinearGradient(90, 130, 90, 235);
    tg.addColorStop(0, '#fffdf2');
    tg.addColorStop(0.55, '#ffd878');
    tg.addColorStop(1, '#d87020');
    ctx.fillStyle = tg;
    ctx.font = `98px ${FONT_BRUSH}`;
    ctx.fillText('造梦西游Ⅵ', 84, 178);
    ctx.shadowBlur = 0;

    // Subtitle: 梦 烬 归 墟
    ctx.fillStyle = '#f5e2c0';
    ctx.font = `bold 34px ${FONT_KAI}`;
    ctx.fillText('梦  烬  归  墟', 92, 248);

    UI.drawSeal(ctx, 370, 246, 40, '归墟', { color: '#b8241a', angle: -0.09, glow: true });
    UI.drawDivider(ctx, 90, 284, 340, '#e0a848');

    // Vertical Menu
    const items = this.menuItems();
    items.forEach((it, i) => {
      const by = 320 + i * 74;
      const b = UI.drawBtn(ctx, 90, by, 350, 60, it.label, {
        active: this.idx === i,
        sub: it.sub,
        color: it.col,
        fontSize: 20,
      });
      if (b.hovered) this.idx = i;
      this._hits.push({ x: b.x, y: b.y, w: b.w, h: b.h, fn: () => this.activate(it.id) });
    });

    // Bottom footer hints
    ctx.fillStyle = 'rgba(220, 208, 186, 0.55)';
    ctx.font = `12px ${FONT_UI}`;
    ctx.fillText('点击屏幕或按 ↑↓ / Enter 键操作   ·   全键盘 / 鼠标 / 手柄兼容   ·   [M] 静音  [F] 全屏', 90, H - 30);
    ctx.restore();

    UI.ControlsModal.draw(ctx);
    UI.SettingsModal.draw(ctx);
  }
}

/* ============================================================
 *  2. PROLOGUE SCENE
 * ============================================================ */
class PrologueScene {
  constructor() {
    this.bg = new Background('ember', 3);
    this.cam = { x: W * 0.5, y: 360, zoom: 1 };
    this.t = 0;
    this.lines = [
      '西游五劫既定，三界暂归宁谧；然历代劫魔残执未散，堕入九幽【归墟】。',
      '千载业火凝作赤金【梦烬】，通臂烬猿、玄渊骨蛟、魔牛、堕落二郎尽皆苏醒……',
      '太初【无相梦主】更于归墟深处重塑因果，欲将取经五圣吞入永恒幻梦。',
      '今师徒再聚花果烬土，或持如意金箍、九齿寒耙，或以禅心剑骨破渊斩妄——',
      '此番西行，不为真经，只为斩尽前尘执念，重定乾坤清明！',
    ];
    Music.play('title');
  }

  finish() {
    App.save.prologueSeen = true;
    App.persist();
    Snd.play('uiok');
    App.enterScene(new SelectScene());
  }

  update(dt) {
    this.t += dt;
    this.bg.update(dt * 0.5);
    if (this.t > 0.6 && (Input.confirm() || Input.hit('pause') || Input.mouse.clicked)) {
      if (this.t < this.lines.length * 1.45) {
        this.t = this.lines.length * 1.45 + 0.5;
        Snd.play('ui');
      } else {
        this.finish();
      }
    }
  }

  draw(ctx) {
    this.bg.drawBack(ctx, this.cam);
    this.bg.drawFront(ctx, this.cam);
    ctx.fillStyle = 'rgba(6, 4, 10, 0.68)';
    ctx.fillRect(0, 0, W, H);
    Post.draw(ctx, 1.2);

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffd868';
    ctx.font = `36px ${FONT_BRUSH}`;
    ctx.fillText('序 · 梦烬前尘', W * 0.5, 118);
    UI.drawDivider(ctx, W * 0.3, 152, W * 0.4, '#e0a848');

    this.lines.forEach((line, i) => {
      const a = clamp((this.t - i * 1.45) * 1.1, 0, 1);
      if (a <= 0) return;
      ctx.globalAlpha = a;
      ctx.fillStyle = i === this.lines.length - 1 ? '#ffe498' : '#efe3ce';
      ctx.font = `${i === this.lines.length - 1 ? 'bold ' : ''}21px ${FONT_KAI}`;
      ctx.fillText(line, W * 0.5, 224 + i * 68);
    });
    ctx.globalAlpha = 0.72 + 0.25 * Math.sin(this.t * 4);
    ctx.fillStyle = '#ffd868';
    ctx.font = `14px ${FONT_UI}`;
    const ready = this.t >= this.lines.length * 1.45;
    ctx.fillText(ready ? '点击或按 [Enter] 步入五圣点将台 →' : '点击或按 [Enter] 显示全文', W * 0.5, H - 72);
    ctx.restore();
  }
}

/* ============================================================
 *  3. HERO SELECT SCENE
 * ============================================================ */
class SelectScene {
  constructor() {
    this.bg = new Background('ember', 23);
    this.cam = { x: W * 0.5, y: 360, zoom: 1 };
    this.t = 0;
    this.heroIdx = Math.max(0, HERO_ORDER.indexOf(App.save.heroId));
    this.skillHover = 0;
    this._hits = [];
    this.rebuildShowcase();
    Music.play('map');
  }

  currentHeroId() { return HERO_ORDER[this.heroIdx]; }

  rebuildShowcase() {
    const id = this.currentHeroId();
    const thMap = { wukong: 'ember', bajie: 'river', sha: 'river', tang: 'heaven', bailong: 'void' };
    this.bg = new Background(thMap[id] || 'ember', 23 + this.heroIdx * 7);
    this.showcase = createShowcase(id, 2.05, false);
    this.showcase.flourishT = 0.45;
  }

  switchHero(idx) {
    this.heroIdx = (idx + HERO_ORDER.length) % HERO_ORDER.length;
    App.save.heroId = this.currentHeroId();
    this.skillHover = 0;
    this.rebuildShowcase();
    Snd.play('uiok');
  }

  update(dt) {
    this.t += dt;
    this.bg.update(dt * 0.6);
    updateShowcase(this.showcase, 325, 536, 1, dt);

    if (UI.BagModal.update(dt, null)) return;
    if (UI.SettingsModal.update(dt)) return;

    if (Input.hit('left')) this.switchHero(this.heroIdx - 1);
    if (Input.hit('right')) this.switchHero(this.heroIdx + 1);
    if (Input.hit('bag')) { UI.BagModal.show(this.currentHeroId()); Snd.play('uiok'); return; }
    if (Input.hit('pause') || Input.hit('back')) {
      Snd.play('uiback');
      App.enterScene(new TitleScene());
      return;
    }
    if (Input.hit('confirm')) {
      App.save.heroId = this.currentHeroId();
      App.persist();
      Snd.play('gong');
      App.enterScene(new MapScene());
      return;
    }

    if (Input.mouse.clicked) {
      for (const h of this._hits) {
        if (UI.hit(h.x, h.y, h.w, h.h)) { h.fn(); return; }
      }
      if (Math.abs(Input.mouse.x - 325) < 120 && Input.mouse.y > 220 && Input.mouse.y < 560) {
        this.showcase.flourishT = 0.55;
        Snd.play('swing');
      }
    }
  }

  draw(ctx) {
    this._hits = [];
    const addHit = (x, y, w, h, fn) => this._hits.push({ x, y, w, h, fn });
    const hid = this.currentHeroId();
    const hero = HEROES[hid];
    const prof = App.save.heroes[hid];
    const st = UI.BagModal.computedStats(hid);

    this.bg.drawBack(ctx, this.cam);
    ctx.fillStyle = 'rgba(6, 5, 11, 0.58)';
    ctx.fillRect(0, 0, W, H);

    // Top Hero Tab Strip (5 Heroes)
    const tabW = 196, tabGap = 14;
    const startX = (W - (tabW * 5 + tabGap * 4)) * 0.5;
    HERO_ORDER.forEach((id, i) => {
      const h = HEROES[id];
      const hp = App.save.heroes[id];
      const tx = startX + i * (tabW + tabGap), ty = 20;
      const active = i === this.heroIdx;
      const b = UI.drawBtn(ctx, tx, ty, tabW, 64, '', {
        active,
        color: h.color,
      });
      drawPortrait(ctx, id, tx + 34, ty + 32, 22, this.t, { awaken: active });
      ctx.save();
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = active ? '#fff6de' : '#d0c4b0';
      ctx.font = `bold 17px ${FONT_KAI}`;
      ctx.fillText(h.name, tx + 66, ty + 23);
      ctx.fillStyle = h.color;
      ctx.font = `12px ${FONT_UI}`;
      ctx.fillText(`Lv.${hp.lv} · ${h.title}`, tx + 66, ty + 45);
      ctx.restore();
      addHit(b.x, b.y, b.w, b.h, () => this.switchHero(i));
    });

    // Left/Center Sacred Pedestal + Animated Rig
    const px = 325, py = 536;
    ctx.save();
    drawGlow(ctx, px, py - 120, 230, hero.color, 0.32);
    // Rotating magic lotus ring under feet
    ctx.translate(px, py + 4);
    ctx.scale(1, 0.28);
    ctx.rotate(this.t * 0.4);
    ctx.strokeStyle = rgba(hero.color, 0.72);
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(0, 0, 128, 0, TAU); ctx.stroke();
    ctx.setLineDash([16, 12]);
    ctx.beginPath(); ctx.arc(0, 0, 100, 0, TAU); ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    drawShowcase(ctx, this.showcase, px, py, 1);

    // Hero Quote under Pedestal
    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = hero.accent;
    ctx.font = `italic 16px ${FONT_KAI}`;
    ctx.fillText(hero.quote, px, 598);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#cbbca6';
    ctx.font = `13px ${FONT_UI}`;
    UI.BagModal._wrapText(ctx, hero.lore, 64, 626, 480, 20);
    ctx.restore();

    // Right Detail Panel
    const rx = 590, ry = 104, rw = 656, rh = 576;
    UI.drawPanel(ctx, rx, ry, rw, rh, {
      radius: 12,
      bg: 'rgba(11, 8, 17, 0.90)',
      border: hero.color,
      glow: hero.color,
      glowBlur: 14,
    });

    ctx.save();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff5dc';
    ctx.font = `52px ${FONT_BRUSH}`;
    ctx.fillText(hero.name, rx + 28, ry + 48);

    ctx.fillStyle = hero.color;
    ctx.font = `bold 20px ${FONT_KAI}`;
    ctx.fillText(`${hero.title}  ·  Lv.${prof.lv}`, rx + 216, ry + 48);

    UI.drawSeal(ctx, rx + rw - 46, ry + 48, 38, hero.name[0], { color: '#b4221a', angle: -0.06 });
    UI.drawDivider(ctx, rx + 28, ry + 84, rw - 56, hero.color);

    // 6-Axis Radar Chart (left inside right panel)
    this._drawRadar(ctx, rx + 132, ry + 188, 76, hero.radar, hero.color);

    // Computed Stats Grid (right of radar)
    const sx0 = rx + 258, sy0 = ry + 126;
    const sList = [
      ['气血上限', st.hp, '#ff7868'],
      ['法力上限', st.mp, '#68d4ff'],
      ['基础攻击', st.atk, '#ffd468'],
      ['护体防御', st.def, '#78e8a8'],
      ['暴击几率', Math.round(st.crit * 100) + '%', '#ff9e48'],
      ['身法移速', st.spd, '#c69eff'],
    ];
    sList.forEach(([k, v, c], idx) => {
      const x = sx0 + (idx % 2) * 188;
      const y = sy0 + Math.floor(idx / 2) * 44;
      ctx.fillStyle = 'rgba(255,255,255,0.04)';
      UI.roundPath(ctx, x, y - 15, 174, 34, 6);
      ctx.fill();
      ctx.fillStyle = '#b4a896';
      ctx.font = `13px ${FONT_UI}`;
      ctx.fillText(k, x + 12, y + 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = c;
      ctx.font = `bold 17px ${FONT_NUM}`;
      ctx.fillText(String(v), x + 162, y + 2);
      ctx.textAlign = 'left';
    });

    // Skills Section
    ctx.fillStyle = '#ffe6ae';
    ctx.font = `bold 15px ${FONT_KAI}`;
    ctx.fillText('绝技神通 (点击或悬停查看详解)', rx + 28, ry + 292);

    hero.skills.forEach((sk, i) => {
      const bx = rx + 28 + i * 152, by = ry + 314, bw = 142, bh = 58;
      const active = this.skillHover === i;
      const b = UI.drawBtn(ctx, bx, by, bw, bh, `${sk.glyph} · ${sk.name}`, {
        active,
        sub: sk.id === 'ult' ? '[Space] 梦烬满' : `[${sk.key}] 法力${sk.mp}`,
        color: sk.color,
        fontSize: 15,
      });
      if (b.hovered) this.skillHover = i;
      addHit(b.x, b.y, b.w, b.h, () => { this.skillHover = i; Snd.play('ui', { vol: 0.5 }); });
    });

    // Selected skill detail box
    const curSk = hero.skills[this.skillHover] || hero.skills[0];
    UI.drawPanel(ctx, rx + 28, ry + 382, rw - 56, 86, {
      radius: 8, bg: 'rgba(18, 14, 26, 0.85)', border: curSk.color, borderAlpha: 0.55, corners: false,
    });
    ctx.fillStyle = curSk.color;
    ctx.font = `bold 16px ${FONT_KAI}`;
    ctx.fillText(`【${curSk.name}】  ${curSk.cd > 0 ? '冷却 ' + curSk.cd + ' 秒' : '觉醒奥义'}`, rx + 46, ry + 404);
    ctx.fillStyle = '#e8dcc8';
    ctx.font = `14px ${FONT_UI}`;
    UI.BagModal._wrapText(ctx, curSk.desc, rx + 46, ry + 432, rw - 92, 20);

    // Bottom Action Buttons
    const nmOn = App.save.nightmare;
    const nmLocked = !App.save.nightmareUnlocked;
    const bBack = UI.drawBtn(ctx, rx + 28, ry + 492, 118, 54, '← 返回', { fontSize: 16, color: '#9c9286' });
    addHit(bBack.x, bBack.y, bBack.w, bBack.h, () => { Snd.play('uiback'); App.enterScene(new TitleScene()); });

    const bBag = UI.drawBtn(ctx, rx + 158, ry + 492, 134, 54, '行囊整备 [B]', { fontSize: 15, color: '#6ad8ff' });
    addHit(bBag.x, bBag.y, bBag.w, bBag.h, () => { Snd.play('uiok'); UI.BagModal.show(hid); });

    const bDiff = UI.drawBtn(ctx, rx + 304, ry + 492, 154, 54,
      nmOn ? '九幽·梦魇模式' : '凡尘·普通难度',
      {
        sub: nmLocked ? '通关五回解锁梦魇' : (nmOn ? '敌威倍增 · 爆率极高' : '点击切换梦魇'),
        color: nmOn ? '#ff5858' : '#78e8a8',
        disabled: nmLocked,
        fontSize: 14,
      });
    if (!nmLocked) {
      addHit(bDiff.x, bDiff.y, bDiff.w, bDiff.h, () => {
        App.save.nightmare = !App.save.nightmare;
        App.persist();
        Snd.play('uiok');
      });
    }

    const bGo = UI.drawBtn(ctx, rx + 470, ry + 492, 158, 54, '九州堪舆 [Enter]', {
      active: true, color: '#ffd868', fontSize: 17,
    });
    addHit(bGo.x, bGo.y, bGo.w, bGo.h, () => {
      App.save.heroId = hid;
      App.persist();
      Snd.play('gong');
      App.enterScene(new MapScene());
    });

    ctx.restore();
    this.bg.drawGrade(ctx);
    Post.draw(ctx, 0.9);
    UI.BagModal.draw(ctx, null);
    UI.SettingsModal.draw(ctx);
  }

  _drawRadar(ctx, cx, cy, R, vals, color) {
    const labels = ['输出', '机动', '生存', '连击', '控场', '奥义'];
    ctx.save();
    for (let ring = 1; ring <= 3; ring++) {
      const rr = R * (ring / 3);
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = -PI * 0.5 + (TAU * i) / 6;
        const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = 'rgba(255, 224, 165, 0.16)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    for (let i = 0; i < 6; i++) {
      const a = -PI * 0.5 + (TAU * i) / 6;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R);
      ctx.strokeStyle = 'rgba(255, 224, 165, 0.15)';
      ctx.stroke();

      ctx.fillStyle = '#d4c6ae';
      ctx.font = `12px ${FONT_UI}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(labels[i], cx + Math.cos(a) * (R + 18), cy + Math.sin(a) * (R + 16));
    }

    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = -PI * 0.5 + (TAU * i) / 6;
      const v = clamp(vals[i] || 0.5, 0.1, 1.0) * R;
      const x = cx + Math.cos(a) * v, y = cy + Math.sin(a) * v;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = rgba(color, 0.34);
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.2;
    ctx.stroke();
    ctx.restore();
  }
}

/* ============================================================
 *  4. MAP SCENE (5-Chapter Painted Scroll)
 * ============================================================ */
class MapScene {
  constructor() {
    this.bg = new Background('heaven', 41);
    this.cam = { x: W * 0.5, y: 360, zoom: 1 };
    this.t = 0;
    this.idx = clamp(App.save.unlockedStage - 1, 0, STAGES.length - 1);
    this._hits = [];
    Music.play('map');
  }

  nodes() {
    return [
      { x: 185, y: 300 },
      { x: 405, y: 218 },
      { x: 640, y: 312 },
      { x: 875, y: 215 },
      { x: 1095, y: 290 },
    ];
  }

  launchStage() {
    const st = STAGES[this.idx];
    if (this.idx + 1 > App.save.unlockedStage) {
      Snd.play('hurt');
      return;
    }
    Snd.play('gong');
    App.enterScene(new PlayScene(st, App.save.heroId, App.save.nightmare));
  }

  update(dt) {
    this.t += dt;
    this.bg.update(dt * 0.5);

    if (UI.BagModal.update(dt, null)) return;
    if (UI.SettingsModal.update(dt)) return;
    if (UI.ControlsModal.update(dt)) return;

    if (Input.hit('left')) {
      this.idx = Math.max(0, this.idx - 1);
      Snd.play('ui', { vol: 0.5 });
    }
    if (Input.hit('right')) {
      const next = Math.min(STAGES.length - 1, this.idx + 1);
      if (next + 1 <= App.save.unlockedStage) {
        this.idx = next;
        Snd.play('ui', { vol: 0.5 });
      }
    }
    if (Input.hit('bag')) { UI.BagModal.show(App.save.heroId); Snd.play('uiok'); return; }
    if (Input.hit('swap')) { Snd.play('uiok'); App.enterScene(new SelectScene()); return; }
    if (Input.hit('confirm')) { this.launchStage(); return; }
    if (Input.hit('pause') || Input.hit('back')) {
      Snd.play('uiback');
      App.enterScene(new TitleScene());
      return;
    }

    if (Input.mouse.clicked) {
      for (const h of this._hits) if (UI.hit(h.x, h.y, h.w, h.h)) { h.fn(); return; }
    }
  }

  draw(ctx) {
    this._hits = [];
    const addHit = (x, y, w, h, fn) => this._hits.push({ x, y, w, h, fn });

    this.bg.drawBack(ctx, this.cam);
    ctx.fillStyle = 'rgba(8, 6, 14, 0.58)';
    ctx.fillRect(0, 0, W, H);

    const hid = App.save.heroId;
    const hero = HEROES[hid];
    const prof = App.save.heroes[hid];

    // Top Navigation Strip
    UI.drawPanel(ctx, 22, 16, W - 44, 64, { radius: 10, bg: 'rgba(11,9,17,0.88)', border: '#d8a64e' });
    drawPortrait(ctx, hid, 64, 48, 22, this.t, {});
    ctx.save();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff5dc';
    ctx.font = `bold 18px ${FONT_KAI}`;
    ctx.fillText(`${hero.name} · Lv.${prof.lv}`, 98, 38);
    ctx.fillStyle = App.save.nightmare ? '#ff6a60' : '#7be8a8';
    ctx.font = `12px ${FONT_UI}`;
    ctx.fillText(App.save.nightmare ? '当前难度：梦魇劫境' : '当前难度：普通历练', 98, 59);

    ctx.fillStyle = '#ffd868';
    ctx.font = `bold 14px ${FONT_NUM}`;
    ctx.fillText(`灵石 ${App.save.coins}`, 310, 48);
    ctx.fillStyle = '#7beeff';
    ctx.fillText(`炼魂 ${App.save.souls}`, 435, 48);
    ctx.restore();

    const bSwap = UI.drawBtn(ctx, W - 538, 28, 124, 40, '更换圣者 [C]', { fontSize: 14, color: hero.color });
    addHit(bSwap.x, bSwap.y, bSwap.w, bSwap.h, () => { Snd.play('uiok'); App.enterScene(new SelectScene()); });

    const bBag = UI.drawBtn(ctx, W - 404, 28, 124, 40, '行囊炼器 [B]', { fontSize: 14, color: '#6ad8ff' });
    addHit(bBag.x, bBag.y, bBag.w, bBag.h, () => { Snd.play('uiok'); UI.BagModal.show(hid); });

    const bSet = UI.drawBtn(ctx, W - 270, 28, 110, 40, '设置 / 指南', { fontSize: 14, color: '#d8b6ff' });
    addHit(bSet.x, bSet.y, bSet.w, bSet.h, () => { Snd.play('uiok'); UI.SettingsModal.show(); });

    const bTitle = UI.drawBtn(ctx, W - 150, 28, 110, 40, '返回主卷', { fontSize: 14, color: '#9c9286' });
    addHit(bTitle.x, bTitle.y, bTitle.w, bTitle.h, () => { Snd.play('uiback'); App.enterScene(new TitleScene()); });

    // Ley-line curves across 5 Chapters
    const pts = this.nodes();
    ctx.save();
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1];
      const unlocked = i + 2 <= App.save.unlockedStage;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.quadraticCurveTo((a.x + b.x) * 0.5, (a.y + b.y) * 0.5 - 45, b.x, b.y);
      ctx.strokeStyle = unlocked ? '#ffd868' : 'rgba(180,165,145,0.22)';
      ctx.lineWidth = unlocked ? 3 : 2;
      if (!unlocked) ctx.setLineDash([8, 8]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 5 Stage Medallion Nodes
    pts.forEach((pt, i) => {
      const st = STAGES[i];
      const th = THEMES[st.theme];
      const unlocked = i + 1 <= App.save.unlockedStage;
      const sel = i === this.idx;
      const grade = App.save.grades[st.id];
      const r = sel ? 48 : 38;

      if (sel) drawGlow(ctx, pt.x, pt.y, 92 + 12 * Math.sin(this.t * 4), th.rim, 0.55);

      ctx.beginPath(); ctx.arc(pt.x, pt.y, r, 0, TAU);
      ctx.fillStyle = unlocked ? mix('#120c18', th.rim, sel ? 0.34 : 0.18) : '#0b090e';
      ctx.fill();
      ctx.strokeStyle = sel ? '#ffe478' : unlocked ? th.rim : '#4c4654';
      ctx.lineWidth = sel ? 3 : 2;
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = unlocked ? '#fff6dc' : '#6c6672';
      ctx.font = `${sel ? 24 : 20}px ${FONT_BRUSH}`;
      ctx.fillText(['壹', '贰', '叁', '肆', '伍'][i], pt.x, pt.y);

      ctx.fillStyle = unlocked ? '#ffecc8' : '#766e7a';
      ctx.font = `bold 15px ${FONT_KAI}`;
      ctx.fillText(`${st.num}·${st.name}`, pt.x, pt.y + r + 22);

      if (grade) {
        UI.drawSeal(ctx, pt.x + r * 0.72, pt.y - r * 0.72, 28, grade, { gold: grade === '神' });
      }
      if (!unlocked) {
        ctx.fillStyle = 'rgba(200,190,175,0.55)';
        ctx.font = `11px ${FONT_UI}`;
        ctx.fillText('破前劫开启', pt.x, pt.y + r + 40);
      }

      addHit(pt.x - 56, pt.y - 56, 112, 130, () => {
        if (!unlocked) { Snd.play('hurt'); return; }
        if (this.idx === i) this.launchStage();
        else { this.idx = i; Snd.play('uiok'); }
      });
    });
    ctx.restore();

    // Bottom Stage Briefing Card
    const st = STAGES[this.idx];
    const th = THEMES[st.theme];
    const grade = App.save.grades[st.id];
    const tr = TREASURES[st.rewardTreasure];
    const by = 428;
    UI.drawPanel(ctx, 48, by, W - 96, 250, {
      radius: 12, bg: 'rgba(11, 8, 17, 0.92)', border: th.rim, glow: th.rim, glowBlur: 12,
    });

    ctx.save();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = th.rim;
    ctx.font = `bold 16px ${FONT_KAI}`;
    ctx.fillText(`${st.num}  ·  ${st.subtitle}`, 84, by + 34);

    ctx.fillStyle = '#fff5dc';
    ctx.font = `48px ${FONT_BRUSH}`;
    ctx.fillText(st.name, 84, by + 84);

    ctx.fillStyle = '#d4c6ae';
    ctx.font = `14px ${FONT_UI}`;
    ctx.fillText(`推荐境界: Lv.${st.recLv + (App.save.nightmare ? 5 : 0)}    ·    共 ${st.rooms.length} 重秘境`, 84, by + 132);

    // Boss info card inside briefing
    UI.drawPanel(ctx, 84, by + 152, 650, 74, { radius: 8, bg: 'rgba(24,14,22,0.75)', border: '#c44636', borderAlpha: 0.55, corners: false });
    UI.drawSeal(ctx, 122, by + 189, 40, '劫', { color: '#9e1c18' });
    ctx.fillStyle = '#ffaa88';
    ctx.font = `bold 16px ${FONT_KAI}`;
    ctx.fillText(`镇关劫主：${st.bossName} (${st.bossTitle})`, 160, by + 174);
    ctx.fillStyle = '#dfd0bc';
    ctx.font = `italic 13px ${FONT_KAI}`;
    ctx.fillText(st.bossQuote, 160, by + 202);

    // Right side of Briefing: Treasure preview + Nightmare toggle + Embark CTA
    if (tr) {
      const owned = App.save.treasures.includes(tr.id);
      UI.drawPanel(ctx, 760, by + 26, 444, 86, { radius: 8, bg: 'rgba(20,16,28,0.84)', border: tr.color, borderAlpha: 0.55, corners: false });
      ctx.fillStyle = tr.color;
      ctx.font = `32px ${FONT_BRUSH}`;
      ctx.fillText(tr.glyph, 784, by + 69);
      ctx.font = `bold 15px ${FONT_KAI}`;
      ctx.fillText(`首通法宝：${tr.name} ${owned ? '(已收入囊中)' : ''}`, 832, by + 50);
      ctx.fillStyle = '#cfc2ad';
      ctx.font = `12px ${FONT_UI}`;
      UI.BagModal._wrapText(ctx, tr.desc, 832, by + 74, 354, 17);
    }

    if (grade) {
      UI.drawSeal(ctx, 696, by + 76, 54, grade, { gold: grade === '神', angle: -0.1 });
    }

    if (App.save.nightmareUnlocked) {
      const bNm = UI.drawBtn(ctx, 760, by + 128, 180, 96,
        App.save.nightmare ? '梦魇模式：开启' : '梦魇模式：关闭',
        {
          sub: App.save.nightmare ? '1.75倍战力 / 高阶掉宝' : '切换高难梦魇',
          color: App.save.nightmare ? '#ff5858' : '#78e8a8',
          active: App.save.nightmare,
          fontSize: 15,
        });
      addHit(bNm.x, bNm.y, bNm.w, bNm.h, () => {
        App.save.nightmare = !App.save.nightmare;
        App.persist();
        Snd.play('uiok');
      });
    }

    const goX = App.save.nightmareUnlocked ? 954 : 760;
    const goW = App.save.nightmareUnlocked ? 250 : 444;
    const bGo = UI.drawBtn(ctx, goX, by + 128, goW, 96, '出征破劫 [Enter]', {
      sub: `以 ${hero.name} 踏入 ${st.name}`,
      active: true,
      color: '#ffd868',
      fontSize: 22,
    });
    addHit(bGo.x, bGo.y, bGo.w, bGo.h, () => this.launchStage());

    ctx.restore();
    this.bg.drawFront(ctx, this.cam);
    this.bg.drawGrade(ctx);
    Post.draw(ctx, 0.9);
    UI.BagModal.draw(ctx, null);
    UI.SettingsModal.draw(ctx);
    UI.ControlsModal.draw(ctx);
  }
}

/* ============================================================
 *  5. PLAY SCENE (Combat Wrapper)
 * ============================================================ */
class PlayScene {
  constructor(stageDef, heroId, nightmare = false) {
    this.stageDef = stageDef;
    this.heroId = heroId;
    this.nightmare = nightmare;
    this.stage = new GameStage(stageDef, heroId, App.save.heroes[heroId], nightmare);
    this.roomFade = 0;
    this.nextRoomIdx = -1;
    UI.PauseModal.close();
    UI.BagModal.close();
  }

  update(dt) {
    const p = this.stage.player;

    // Room cross-fade
    if (this.roomFade > 0) {
      this.roomFade -= dt * 3.4;
      if (this.roomFade <= 0.5 && this.nextRoomIdx >= 0) {
        this.stage.enterRoom(this.nextRoomIdx);
        this.nextRoomIdx = -1;
      }
      if (this.roomFade <= 0) this.roomFade = 0;
      return;
    }

    // Active modal layers pause combat
    if (UI.ControlsModal.update(dt)) return;
    if (UI.SettingsModal.update(dt)) return;
    if (UI.BagModal.update(dt, p)) return;
    if (UI.PauseModal.update({
      openBag: () => UI.BagModal.show(this.heroId),
      toMap: () => App.enterScene(new MapScene()),
    })) return;

    // Open Bag / Pause hotkeys
    if (Input.hit('bag') && !this.stage.bossIntro && !this.stage.ultCutin) {
      Snd.play('uiok');
      UI.BagModal.show(this.heroId);
      return;
    }
    if (Input.hit('pause')) {
      Snd.play('uiok');
      UI.PauseModal.show();
      return;
    }

    const res = this.stage.update(dt);
    if (!res) return;

    if (res.action === 'nextRoom') {
      this.nextRoomIdx = res.nextIdx;
      this.roomFade = 1.0;
    } else if (res.action === 'victory') {
      App.onStageWin(this.stageDef, this.stage, res.grade);
    } else if (res.action === 'defeat') {
      App.persist();
      App.enterScene(new ResultScene(false, this.stageDef, this.stage, null, false));
    }
  }

  draw(ctx) {
    this.stage.draw(ctx);

    if (this.roomFade > 0) {
      const a = Math.sin(clamp(this.roomFade, 0, 1) * PI);
      ctx.fillStyle = rgba('#050408', a);
      ctx.fillRect(0, 0, W, H);
    }

    const p = this.stage.player;
    UI.PauseModal.draw(ctx, {
      openBag: () => UI.BagModal.show(this.heroId),
      toMap: () => App.enterScene(new MapScene()),
    });
    UI.BagModal.draw(ctx, p);
    UI.SettingsModal.draw(ctx);
    UI.ControlsModal.draw(ctx);
  }
}

/* ============================================================
 *  6. RESULT SCENE (Victory / Defeat Report)
 * ============================================================ */
class ResultScene {
  constructor(win, stageDef, stage, grade, unlockedNightmare = false) {
    this.win = win;
    this.stageDef = stageDef;
    this.stats = Object.assign({}, stage.stats);
    this.loot = stage.lootItems.slice(0, 12);
    this.grade = grade;
    this.unlockedNightmare = unlockedNightmare;
    this.heroId = stage.player.heroId;
    this.bg = new Background(stageDef.theme, 77);
    this.cam = { x: W * 0.5, y: 360, zoom: 1 };
    this.t = 0;
    this._hits = [];
    Music.stop();
    if (win) Snd.play('levelup');
    else Snd.play('bell');
  }

  nextAfterWin() {
    if (this.win && this.stageDef.id === 's5') App.enterScene(new EndingScene());
    else App.enterScene(new MapScene());
  }

  update(dt) {
    this.t += dt;
    this.bg.update(dt * 0.4);
    if (UI.BagModal.update(dt, null)) return;

    if (Input.hit('bag')) { Snd.play('uiok'); UI.BagModal.show(this.heroId); return; }
    if (this.t > 0.6 && Input.hit('confirm')) {
      Snd.play('uiok');
      this.nextAfterWin();
      return;
    }
    if (Input.hit('pause') || Input.hit('back')) {
      Snd.play('uiback');
      App.enterScene(new MapScene());
      return;
    }
    if (Input.mouse.clicked) {
      for (const h of this._hits) if (UI.hit(h.x, h.y, h.w, h.h)) { h.fn(); return; }
    }
  }

  draw(ctx) {
    this._hits = [];
    const addHit = (x, y, w, h, fn) => this._hits.push({ x, y, w, h, fn });

    this.bg.drawBack(ctx, this.cam);
    ctx.fillStyle = 'rgba(6, 4, 10, 0.78)';
    ctx.fillRect(0, 0, W, H);
    Post.draw(ctx, 1.1);

    const pw = 880, ph = 560, px = (W - pw) * 0.5, py = (H - ph) * 0.5;
    UI.drawPanel(ctx, px, py, pw, ph, {
      radius: 14,
      border: this.win ? '#ffd868' : '#b84238',
      glow: this.win ? '#ff9d2e' : '#8e2018',
    });

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = this.win ? '#ffe48a' : '#ff8a78';
    ctx.font = `62px ${FONT_BRUSH}`;
    ctx.fillText(this.win ? '斩 劫 凯 旋' : '执 念 未 消', W * 0.5, py + 58);

    ctx.fillStyle = '#dfd0bc';
    ctx.font = `16px ${FONT_KAI}`;
    ctx.fillText(`${this.stageDef.num} · ${this.stageDef.name}  (${HEROES[this.heroId].name})`, W * 0.5, py + 104);

    if (this.win && this.grade) {
      const slam = 1 + Math.max(0, 0.4 - this.t) * 2.5;
      ctx.save();
      ctx.translate(px + pw - 96, py + 84);
      ctx.scale(slam, slam);
      UI.drawSeal(ctx, 0, 0, 74, this.grade, { gold: this.grade === '神', angle: -0.1, glow: true });
      ctx.restore();
    } else if (!this.win) {
      UI.drawSeal(ctx, px + pw - 96, py + 84, 68, '败', { color: '#78221e', angle: 0.1 });
    }

    UI.drawDivider(ctx, px + 60, py + 132, pw - 120, this.win ? '#ffd868' : '#b84238');

    // Combat metrics grid
    const mins = Math.floor(this.stats.time / 60), secs = Math.floor(this.stats.time % 60);
    const timeStr = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    const rows = [
      ['历战时间', timeStr],
      ['斩妖数目', String(this.stats.kills)],
      ['最高连击', String(this.stats.maxCombo)],
      ['累计伤害', String(Math.round(this.stats.dmgDealt))],
      ['获得灵石', '+' + this.stats.coins],
      ['获得炼魂', '+' + this.stats.souls],
    ];
    rows.forEach(([k, v], i) => {
      const rx = px + 60 + (i % 3) * 260;
      const ry = py + 174 + Math.floor(i / 3) * 58;
      ctx.textAlign = 'left';
      ctx.fillStyle = '#a89c8a';
      ctx.font = `14px ${FONT_UI}`;
      ctx.fillText(k, rx, ry);
      ctx.fillStyle = '#fff3d6';
      ctx.font = `bold 24px ${FONT_NUM}`;
      ctx.fillText(v, rx, ry + 26);
    });

    // Loot display strip
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffe2a0';
    ctx.font = `bold 15px ${FONT_KAI}`;
    ctx.fillText(`本役收获法器 (${this.loot.length})`, px + 60, py + 312);
    if (this.loot.length === 0) {
      ctx.fillStyle = 'rgba(200,188,170,0.45)';
      ctx.font = `13px ${FONT_UI}`;
      ctx.fillText('此役暂无法器落袋（可前往行囊强化现有装备后再战）', px + 60, py + 362);
    } else {
      this.loot.slice(0, 11).forEach((it, idx) => {
        const ix = px + 60 + idx * 68;
        const iy = py + 336;
        UI.drawItemIcon(ctx, it, ix, iy, 58);
      });
    }

    if (this.unlockedNightmare) {
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ff9858';
      ctx.font = `bold 16px ${FONT_KAI}`;
      ctx.fillText('★ 已破太初执念！【九幽劫境 · 梦魇难度】现已开启 ★', W * 0.5, py + 432);
    }

    // Buttons
    const bBag = UI.drawBtn(ctx, px + 60, py + 468, 210, 56, '开启行囊整理 [B]', { color: '#6ad8ff', fontSize: 16 });
    addHit(bBag.x, bBag.y, bBag.w, bBag.h, () => { Snd.play('uiok'); UI.BagModal.show(this.heroId); });

    const bRetry = UI.drawBtn(ctx, px + 305, py + 468, 220, 56, this.win ? '再战此回' : '重整旗鼓再战', { color: '#ff9648', fontSize: 17 });
    addHit(bRetry.x, bRetry.y, bRetry.w, bRetry.h, () => {
      Snd.play('gong');
      App.enterScene(new PlayScene(this.stageDef, this.heroId, App.save.nightmare));
    });

    const nextTxt = (this.win && this.stageDef.id === 's5') ? '恭迎大结局 [Enter]' : '返回九州堪舆图 [Enter]';
    const bNext = UI.drawBtn(ctx, px + 560, py + 468, 260, 56, nextTxt, { active: true, color: '#ffd868', fontSize: 18 });
    addHit(bNext.x, bNext.y, bNext.w, bNext.h, () => { Snd.play('uiok'); this.nextAfterWin(); });

    ctx.restore();
    UI.BagModal.draw(ctx, null);
  }
}

/* ============================================================
 *  7. ENDING SCENE
 * ============================================================ */
class EndingScene {
  constructor() {
    this.bg = new Background('heaven', 99);
    this.cam = { x: W * 0.5, y: 360, zoom: 1 };
    this.t = 0;
    this._hits = [];
    this.rigs = HERO_ORDER.map((id, i) => ({
      id,
      x: 240 + i * 200,
      y: 545 + (i === 2 ? -10 : 0),
      sh: createShowcase(id, i === 0 ? 1.55 : 1.45, true),
    }));
    Music.play('ending');
  }

  update(dt) {
    this.t += dt;
    this.bg.update(dt * 0.45);
    for (const r of this.rigs) updateShowcase(r.sh, r.x, r.y, r.x < W * 0.5 ? 1 : -1, dt);

    if (this.t > 1.0 && Input.hit('confirm')) {
      Snd.play('uiok');
      App.enterScene(new MapScene());
      return;
    }
    if (Input.mouse.clicked) {
      for (const h of this._hits) if (UI.hit(h.x, h.y, h.w, h.h)) { h.fn(); return; }
    }
  }

  draw(ctx) {
    this._hits = [];
    const addHit = (x, y, w, h, fn) => this._hits.push({ x, y, w, h, fn });

    this.bg.drawBack(ctx, this.cam);
    ctx.fillStyle = 'rgba(10, 6, 16, 0.42)';
    ctx.fillRect(0, 0, W, H);

    // Golden ground terrace
    ctx.fillStyle = 'rgba(24, 16, 28, 0.85)';
    ctx.fillRect(0, 542, W, H - 542);
    ctx.fillStyle = 'rgba(255, 214, 108, 0.45)';
    ctx.fillRect(0, 542, W, 3);

    for (const r of this.rigs) drawShowcase(ctx, r.sh, r.x, r.y, r.x < W * 0.5 ? 1 : -1);

    this.bg.drawFront(ctx, this.cam);
    this.bg.drawGrade(ctx);
    Post.draw(ctx, 0.75);

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#ffb848';
    ctx.shadowBlur = 24;
    ctx.fillStyle = '#fff6dc';
    ctx.font = `68px ${FONT_BRUSH}`;
    ctx.fillText('梦 烬 归 清  ·  万 象 重 明', W * 0.5, 96);
    ctx.shadowBlur = 0;

    UI.drawDivider(ctx, W * 0.25, 144, W * 0.5, '#ffd868');

    const epilogue = [
      '太初镜碎，无相消融。三界千年梦烬化作漫天金霓灵雨，洒落花果山巅。',
      '五圣并肩而立，昔日神魔执念皆已渡尽，而西游传奇的锋芒仍在天地间回响——',
      '【九幽劫境 · 梦魇模式】现已永久开启，更多圣阶与梦烬传世神兵静待挑战！',
    ];
    epilogue.forEach((line, i) => {
      ctx.fillStyle = i === 2 ? '#ffd868' : '#f2e6cf';
      ctx.font = `${i === 2 ? 'bold ' : ''}18px ${FONT_KAI}`;
      ctx.fillText(line, W * 0.5, 190 + i * 36);
    });

    const bMap = UI.drawBtn(ctx, W * 0.5 - 240, H - 96, 220, 52, '征战梦魇九州 [Enter]', { active: true, color: '#ffd868', fontSize: 17 });
    addHit(bMap.x, bMap.y, bMap.w, bMap.h, () => { Snd.play('uiok'); App.enterScene(new MapScene()); });

    const bTitle = UI.drawBtn(ctx, W * 0.5 + 20, H - 96, 220, 52, '重返主卷封面', { color: '#78d8ff', fontSize: 17 });
    addHit(bTitle.x, bTitle.y, bTitle.w, bTitle.h, () => { Snd.play('uiok'); App.enterScene(new TitleScene()); });
    ctx.restore();
  }
}
