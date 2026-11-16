'use strict';
/* ============================================================
 *  STAGE — GameStage World Controller, Platforms, Boss Intro,
 *          Ult Cut-in, Camera, Wave/Room Flow, Reflections
 * ============================================================ */
class GameStage {
  constructor(stageDef, heroId, profile, nightmare = false) {
    this.def = stageDef;
    this.nightmare = nightmare;
    this.scale = stageDef.scale * (nightmare ? 1.75 : 1.0);
    this.th = THEMES[stageDef.theme];
    this.themeRim = this.th.rim;
    this.bg = new Background(stageDef.theme, 13 + STAGES.indexOf(stageDef) * 19);

    this.player = new Player(heroId, profile);
    this.roomIdx = 0;
    this.room = null;

    this.enemies = [];
    this.attacks = [];
    this.fxs = [];
    this.pickups = [];
    this.shrines = [];
    this.timers = [];
    this.toasts = [];
    this.lootItems = [];

    this.boss = null;
    this.bossHpTrail = 0;
    this.waveIdx = 0;
    this.waveDelay = 0;
    this.roomCleared = false;

    this.cam = { x: W / 2, y: 360, zoom: 1, targetZoom: 1, shake: 0 };
    this.hitstop = 0;
    this.slowmo = 1;
    this.slowmoT = 0;
    this.flash = { color: '#ffffff', a: 0, dur: 0.2, t: 0 };

    this.titleBannerT = 3.0;
    this.bossIntro = null;
    this.ultCutin = null;
    this.finishState = null; // null | 'winWait' | 'loseWait'
    this.finishT = 0;

    this.stats = {
      time: 0,
      kills: 0,
      maxCombo: 0,
      dmgDealt: 0,
      dmgTaken: 0,
      coins: 0,
      souls: 0,
    };

    Parts.clear();
    Floaters.list.length = 0;
    Music.play(stageDef.music);
    this.enterRoom(0);
  }

  /* ---- World API for skills / entities / bosses ---- */
  attack(opts) {
    const a = new Attack(opts);
    this.attacks.push(a);
    return a;
  }
  fx(obj) {
    if (obj) this.fxs.push(obj);
    return obj;
  }
  after(sec, fn) {
    this.timers.push({ t: sec, fn });
  }
  addShake(amt) {
    this.cam.shake = Math.min(34, Math.max(this.cam.shake, amt));
  }
  addHitstop(sec) {
    this.hitstop = Math.max(this.hitstop, sec);
  }
  setSlowmo(scale, dur) {
    this.slowmo = scale;
    this.slowmoT = Math.max(this.slowmoT, dur);
  }
  addFlash(color, a, dur = 0.2) {
    this.flash = { color, a, dur, t: dur };
  }
  toast(title, color, sub = '') {
    this.toasts.push({ title, color, sub, t: 0, life: 3.4 });
    if (this.toasts.length > 5) this.toasts.shift();
  }
  spawnEnemy(typeId, x, y) {
    const e = new Enemy(typeId, x, y, this.scale, this.player.heroId);
    this.enemies.push(e);
    Snd.play('spawn', { vol: 0.5 });
    FX.inkBurst(x, (y || GROUND) - 35, 10, e.color, 12);
    return e;
  }

  enterRoom(idx) {
    this.roomIdx = idx;
    const r = this.def.rooms[idx];
    this.room = r;
    this.enemies.length = 0;
    this.attacks.length = 0;
    this.pickups.length = 0;
    this.shrines.length = 0;
    this.boss = null;
    this.waveIdx = 0;
    this.roomCleared = false;

    this.player.x = 160;
    this.player.y = GROUND;
    this.player.vx = 0; this.player.vy = 0;
    if (this.player.cloth) this.player.cloth.reset(this.player.x, this.player.y - 70);
    this.cam.x = clamp(this.player.x + 220, W / 2, r.w - W / 2);

    if (r.shrine) this.shrines.push(new Shrine(r.shrine.x));

    if (r.bossRoom) {
      this.startBossIntro();
    } else if (r.waves && r.waves.length) {
      this.spawnWave(0);
    } else {
      this.roomCleared = true;
    }
  }

  spawnWave(wIdx) {
    this.waveIdx = wIdx;
    const wave = this.room.waves[wIdx];
    if (!wave) { this.roomCleared = true; return; }
    for (const sp of wave) {
      this.spawnEnemy(sp.type, sp.x, sp.y || (sp.type === 'crow' || sp.type === 'wisp' ? GROUND - 170 : GROUND));
    }
  }

  startBossIntro() {
    const bx = this.room.w - 360;
    this.boss = createBoss(this.def.bossId, bx, this.scale);
    this.bossHpTrail = this.boss.maxHp;
    this.enemies.push(this.boss);
    this.bossIntro = {
      t: 0, dur: 2.8,
      name: this.def.bossName,
      title: this.def.bossTitle,
      quote: this.def.bossQuote,
      color: this.boss.color,
    };
    Music.play(this.def.bossMusic || 'boss');
    Snd.play('gong');
    this.after(0.45, () => Snd.play('roar', { vol: 0.75 }));
  }

  triggerUlt(p) {
    const sk = p.hero.skills[3];
    this.ultCutin = {
      t: 0, dur: 0.85,
      heroId: p.heroId,
      name: sk.name,
      color: p.hero.color,
      fired: false,
    };
    Snd.play('ult');
    this.addFlash(p.hero.color, 0.35, 0.25);
  }

  onEnemyKilled(e) {
    this.stats.kills++;
    const p = this.player;
    // grant XP directly + check level up!
    const exp = e.xp || 24;
    this.grantXp(exp);
    // drops
    const coins = randi(e.coinRange[0], e.coinRange[1]);
    for (let i = 0; i < 3; i++) this.pickups.push(new Pickup('coin', e.x + rand(-18, 18), e.y - 25, Math.ceil(coins / 3)));
    this.pickups.push(new Pickup('soul', e.x, e.y - 28, Math.max(3, Math.round(exp * 0.35))));
    if (chance(0.18)) this.pickups.push(new Pickup('hp', e.x + rand(-20, 20), e.y - 25));
    if (chance(0.16)) this.pickups.push(new Pickup('mp', e.x + rand(-20, 20), e.y - 25));
    if (chance(e.isElite ? 0.85 : 0.22)) {
      const stageLv = this.def.recLv + (this.nightmare ? 4 : 0);
      const forceQ = this.nightmare && chance(0.25) ? randi(2, 4) : null;
      this.pickups.push(new Pickup('gear', e.x, e.y - 30, LootGen.roll(stageLv, forceQ)));
    }
  }

  onBossKilled(b) {
    this.stats.kills++;
    this.grantXp(b.xp || 260);
    // generous boss loot explosion!
    for (let i = 0; i < 10; i++) this.pickups.push(new Pickup('coin', b.x + rand(-60, 60), GROUND - 35, randi(12, 22)));
    for (let i = 0; i < 5; i++) this.pickups.push(new Pickup('soul', b.x + rand(-50, 50), GROUND - 40, randi(10, 18)));
    const stageLv = this.def.recLv + 1 + (this.nightmare ? 5 : 0);
    // guaranteed rare/epic/legendary gear!
    const minQ = this.def.id === 's5' ? 4 : (this.nightmare ? 3 : 2);
    this.pickups.push(new Pickup('gear', b.x - 45, GROUND - 40, LootGen.roll(stageLv, randi(minQ, 4))));
    if (chance(0.65) || this.nightmare) {
      this.pickups.push(new Pickup('gear', b.x + 45, GROUND - 40, LootGen.roll(stageLv, randi(Math.max(1, minQ - 1), 4))));
    }
    // treasure drop if not yet owned!
    if (this.def.rewardTreasure && !App.save.treasures.includes(this.def.rewardTreasure)) {
      this.pickups.push(new Pickup('treasure', b.x, GROUND - 45, this.def.rewardTreasure));
    }
    this.finishState = 'winWait';
    this.finishT = 3.2; // allow player a moment to scoop loot & enjoy victory!
  }

  onPlayerDead() {
    this.finishState = 'loseWait';
    this.finishT = 2.0;
  }

  grantXp(amt) {
    const prof = this.player.profile;
    prof.xp += amt;
    while (prof.xp >= xpNeed(prof.lv)) {
      prof.xp -= xpNeed(prof.lv);
      prof.lv++;
      this.player.recomputeStats(false);
      this.player.hp = this.player.maxHp;
      this.player.mp = this.player.maxMp;
      Snd.play('levelup');
      FX.groundRing(this.player.x, '#ffd868', 200, 0.6);
      FX.embers(this.player.x, this.player.y - 45, 24, '#ffd868', 55, 190);
      Floaters.add(this.player.x, this.player.y - 120, `境界突破 Lv.${prof.lv}!`, { color: '#ffe478', size: 30, font: FONT_BRUSH });
      this.toast(`修为突破 Lv.${prof.lv}`, '#ffd868', '气血、法力已全满，诸般属性大幅精进！');
    }
  }

  computeGrade() {
    let score = 100;
    if (this.stats.time > 140) score -= Math.min(25, (this.stats.time - 140) * 0.2);
    if (this.stats.dmgTaken > this.player.maxHp * 1.2) score -= 18;
    else if (this.stats.dmgTaken > this.player.maxHp * 0.5) score -= 8;
    if (this.stats.maxCombo >= 40) score += 12;
    else if (this.stats.maxCombo >= 20) score += 6;
    return score >= 95 ? '神' : score >= 80 ? '妙' : score >= 62 ? '良' : '平';
  }

  update(rawDt) {
    const dt0 = Math.min(1 / 30, rawDt);

    if (this.titleBannerT > 0) this.titleBannerT = Math.max(0, this.titleBannerT - dt0);
    if (this.flash.t > 0) this.flash.t = Math.max(0, this.flash.t - dt0);
    for (let i = this.toasts.length - 1; i >= 0; i--) {
      this.toasts[i].t += dt0;
      if (this.toasts[i].t >= this.toasts[i].life) this.toasts.splice(i, 1);
    }

    // Ult cut-in pauses combat dramatically
    if (this.ultCutin) {
      this.ultCutin.t += dt0;
      if (this.ultCutin.t >= this.ultCutin.dur) {
        const u = this.ultCutin;
        this.ultCutin = null;
        SkillImpl[u.heroId].ult(this.player, this);
      }
      return null;
    }

    // Boss intro cinematic
    if (this.bossIntro) {
      this.bossIntro.t += dt0;
      this.bg.update(dt0 * 0.5);
      Parts.update(dt0 * 0.5);
      this.cam.x = damp(this.cam.x, clamp(this.boss.x - 160, W / 2, this.room.w - W / 2), 4, dt0);
      this.cam.targetZoom = 1.08;
      this.cam.zoom = damp(this.cam.zoom, this.cam.targetZoom, 5, dt0);
      if (this.bossIntro.t >= this.bossIntro.dur || (this.bossIntro.t > 0.7 && Input.hit('confirm'))) {
        this.bossIntro = null;
        this.cam.targetZoom = 1.0;
      }
      return null;
    }

    // Hitstop & slowmo
    if (this.hitstop > 0) {
      this.hitstop -= dt0;
      this.cam.shake = Math.max(0, this.cam.shake - dt0 * 40);
      return null;
    }
    if (this.slowmoT > 0) {
      this.slowmoT -= dt0;
      if (this.slowmoT <= 0) this.slowmo = 1;
    }
    const dt = dt0 * this.slowmo;
    if (!this.finishState) this.stats.time += dt;

    // Delayed timers
    for (let i = this.timers.length - 1; i >= 0; i--) {
      this.timers[i].t -= dt;
      if (this.timers[i].t <= 0) {
        const fn = this.timers[i].fn;
        this.timers.splice(i, 1);
        fn();
      }
    }

    this.bg.update(dt);
    this.player.update(dt, this);
    for (const s of this.shrines) s.update(dt, this);
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      e.update(dt, this);
      if (e.dead) this.enemies.splice(i, 1);
    }
    for (let i = this.attacks.length - 1; i >= 0; i--) {
      const a = this.attacks[i];
      a.update(dt, this);
      if (a.dead) this.attacks.splice(i, 1);
    }
    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const pk = this.pickups[i];
      pk.update(dt, this);
      if (pk.dead) this.pickups.splice(i, 1);
    }
    for (let i = this.fxs.length - 1; i >= 0; i--) {
      if (!this.fxs[i].update(dt)) this.fxs.splice(i, 1);
    }
    Parts.update(dt);
    Floaters.update(dt);

    if (this.boss) {
      this.bossHpTrail = damp(this.bossHpTrail, this.boss.hp, 4.5, dt0);
    }

    // Room wave logic
    if (!this.room.bossRoom && !this.roomCleared && this.enemies.length === 0) {
      if (this.waveIdx + 1 < this.room.waves.length) {
        this.waveDelay += dt;
        if (this.waveDelay > 0.75) { this.waveDelay = 0; this.spawnWave(this.waveIdx + 1); }
      } else {
        this.roomCleared = true;
        Snd.play('bell');
        this.toast('妖氛散尽', '#ffd868', '向右前行进入下一重境');
      }
    }
    // Check advancing to next room
    if (this.roomCleared && this.roomIdx + 1 < this.def.rooms.length && this.player.x >= this.room.w - 75) {
      return { action: 'nextRoom', nextIdx: this.roomIdx + 1 };
    }

    // Camera follow
    const look = this.boss ? (this.boss.x - this.player.x) * 0.25 : this.player.dir * 125;
    const tx = clamp(this.player.x + look, W / 2, this.room.w - W / 2);
    this.cam.x = damp(this.cam.x, tx, 6.5, dt0);
    this.cam.y = damp(this.cam.y, clamp(360 + (this.player.y - GROUND) * 0.25, 290, 380), 6, dt0);
    this.cam.zoom = damp(this.cam.zoom, this.cam.targetZoom, 6, dt0);
    this.cam.shake = Math.max(0, this.cam.shake - dt0 * 32);

    // Finish countdown
    if (this.finishState) {
      this.finishT -= dt0;
      if (this.finishT <= 0) {
        // auto-collect remaining coins/souls on win
        if (this.finishState === 'winWait') {
          for (const pk of this.pickups) {
            if (!pk.dead) pk.collect(this);
          }
          this.pickups.length = 0;
          return { action: 'victory', grade: this.computeGrade() };
        }
        return { action: 'defeat' };
      }
    }
    return null;
  }

  draw(ctx) {
    const sh = this.cam.shake;
    const sx = sh ? (Math.random() * 2 - 1) * sh : 0;
    const sy = sh ? (Math.random() * 2 - 1) * sh : 0;

    // 1. Background (screen space)
    this.bg.drawBack(ctx, this.cam);

    // 2. World space
    ctx.save();
    const zoom = this.cam.zoom || 1;
    ctx.translate(W / 2 + sx, H / 2 + sy);
    ctx.scale(zoom, zoom);
    ctx.translate(-this.cam.x, -this.cam.y);

    const viewL = this.cam.x - W / 2 - 80;
    const viewR = this.cam.x + W / 2 + 80;

    // Ground & reflections
    this.bg.drawGround(ctx, this.cam, viewL, viewR);
    if (this.th.reflect) this.drawReflections(ctx);

    // Platforms
    this.drawPlatforms(ctx);

    // Shrines
    for (const s of this.shrines) s.draw(ctx);

    // Back FX
    for (const f of this.fxs) if (f.layer === 'back') f.draw(ctx);

    // Ground contact shadows
    if (!this.player.dead) drawGroundShadow(ctx, this.player.x, this.player.y, 26);
    for (const e of this.enemies) if (!e.dead && e.y <= GROUND + 5) drawGroundShadow(ctx, e.x, e.y, e.w * 0.45);

    // Pickups
    for (const pk of this.pickups) pk.draw(ctx);

    // Enemies & Boss
    for (const e of this.enemies) e.draw(ctx, this);

    // Player
    this.player.draw(ctx, this);

    // Attacks / Projectiles
    for (const a of this.attacks) a.draw(ctx);

    // Front FX
    for (const f of this.fxs) if (f.layer !== 'back') f.draw(ctx);

    // Particles & Floating Numbers
    Parts.draw(ctx, false);
    Floaters.draw(ctx);

    // Room Exit Barrier / Portal
    if (this.roomCleared && this.roomIdx + 1 < this.def.rooms.length) {
      this.drawExitGate(ctx);
    }

    ctx.restore();

    // 3. Foreground & Grade & Screen-space FX
    this.bg.drawFront(ctx, this.cam);
    Parts.draw(ctx, true);
    this.bg.drawGrade(ctx);

    if (this.flash.t > 0) {
      ctx.fillStyle = rgba(this.flash.color, this.flash.a * (this.flash.t / this.flash.dur));
      ctx.fillRect(0, 0, W, H);
    }
    Post.draw(ctx, this.boss ? 1.15 : 0.95);

    // 4. HUD / Cinematics
    if (!this.bossIntro && !this.ultCutin) UI.drawHUD(ctx, this);
    if (this.titleBannerT > 0 && !this.bossIntro) UI.drawStageBanner(ctx, this);
    if (this.bossIntro) UI.drawBossIntro(ctx, this.bossIntro);
    if (this.ultCutin) UI.drawUltCutin(ctx, this.ultCutin);
  }

  drawReflections(ctx) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(this.cam.x - W, GROUND, W * 2, 160);
    ctx.clip();
    ctx.translate(0, GROUND * 2);
    ctx.scale(1, -0.35);
    ctx.globalAlpha = 0.22;
    this.player.draw(ctx, this);
    for (const e of this.enemies) if (e.y <= GROUND + 5) e.draw(ctx, this);
    ctx.restore();
  }

  drawPlatforms(ctx) {
    if (!this.room.plats) return;
    const style = this.th.platform || 'rock';
    const rim = this.th.rim;
    for (const pl of this.room.plats) {
      ctx.save();
      if (style === 'cloud') {
        const g = ctx.createLinearGradient(0, pl.y, 0, pl.y + 22);
        g.addColorStop(0, '#f8f0ff'); g.addColorStop(1, '#58447a');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(pl.x, pl.y, pl.w, 16, 8) : ctx.rect(pl.x, pl.y, pl.w, 16);
        ctx.fill();
        ctx.strokeStyle = rgba(rim, 0.75); ctx.lineWidth = 2; ctx.stroke();
      } else if (style === 'crystal') {
        ctx.fillStyle = '#180c2c';
        ctx.beginPath();
        ctx.moveTo(pl.x, pl.y); ctx.lineTo(pl.x + pl.w, pl.y);
        ctx.lineTo(pl.x + pl.w - 14, pl.y + 18); ctx.lineTo(pl.x + 14, pl.y + 18); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#c888ff'; ctx.lineWidth = 2; ctx.stroke();
      } else {
        ctx.fillStyle = style === 'bone' ? '#242c2a' : style === 'basalt' ? '#1e0a08' : '#241410';
        ctx.fillRect(pl.x, pl.y, pl.w, 16);
        ctx.fillStyle = rgba(rim, 0.45);
        ctx.fillRect(pl.x, pl.y, pl.w, 3);
      }
      ctx.restore();
    }
  }

  drawExitGate(ctx) {
    const gx = this.room.w - 58;
    const pulse = 0.6 + 0.4 * Math.sin(this.bg.t * 5);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createLinearGradient(gx - 50, 0, gx + 40, 0);
    g.addColorStop(0, rgba(this.th.rim, 0)); g.addColorStop(1, rgba(this.th.rim, 0.4 * pulse));
    ctx.fillStyle = g;
    ctx.fillRect(gx - 50, GROUND - 260, 90, 260);
    drawGlow(ctx, gx, GROUND - 95, 70 * pulse, this.th.rim, 0.55);
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#fff4c8';
    ctx.font = `36px ${FONT_BRUSH}`; ctx.textAlign = 'center';
    ctx.fillText('前行 →', gx - 48 + Math.sin(this.bg.t * 5) * 6, GROUND - 125);
    ctx.restore();
  }
}
