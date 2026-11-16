'use strict';
/* ============================================================
 *  ENTITIES — Attack Engine, Player, Enemies, Pickups, Shrines
 * ============================================================ */
const GRAV = 2600;

function calcDamage(atkVal, mult, defVal, critChance, critBonus = 0, dmgBonus = 1) {
  const isCrit = Math.random() < clamp(critChance + critBonus, 0, 0.95);
  const spread = rand(0.93, 1.07);
  const mit = 1 - defVal / (defVal + 150);
  const dmg = Math.max(1, Math.round(atkVal * mult * spread * (isCrit ? 1.82 : 1) * mit * dmgBonus));
  return { dmg, isCrit };
}

/* ============================================================
 *  ATTACK (Hitbox / Projectile / Field)
 * ============================================================ */
class Attack {
  constructor(o) {
    this.team = o.team || 'player';
    this.owner = o.owner || null;
    this.ox = o.ox !== undefined ? o.ox : null;
    this.oy = o.oy !== undefined ? o.oy : null;
    this.x = o.x !== undefined ? o.x : (this.owner ? this.owner.x + (this.ox || 0) : 0);
    this.y = o.y !== undefined ? o.y : (this.owner ? this.owner.y + (this.oy || 0) : 0);
    this.w = o.w || 60;
    this.h = o.h || 60;
    this.vx = o.vx || 0;
    this.vy = o.vy || 0;
    this.grav = o.grav || 0;
    this.dmg = o.dmg !== undefined ? o.dmg : 1;
    this.rawDmg = o.rawDmg || 0;
    this.crit = o.crit || 0;
    this.kb = o.kb || 0;
    this.up = o.up || 0;
    this.stun = o.stun !== undefined ? o.stun : 0.28;
    this.hitstop = o.hitstop !== undefined ? o.hitstop : 0.03;
    this.shake = o.shake || 3;
    this.poiseDmg = o.poiseDmg || 14;
    this.life = o.life !== undefined ? o.life : 0.12;
    this.t = 0;
    this.rehit = o.rehit || 0;
    this.pierce = o.pierce !== undefined ? o.pierce : true;
    this.color = o.color || '#ffd060';
    this.hitMap = new Map();
    this.dead = false;
    this._update = o.update || null;
    this._draw = o.draw || null;
    this._onHit = o.onHit || null;
    this.hitPlayerOnce = false;
    for (const k in o) {
      if (!(k in this) && k !== 'update' && k !== 'draw' && k !== 'onHit') this[k] = o[k];
    }
  }
  rect() {
    return { x: this.x - this.w / 2, y: this.y - this.h / 2, w: this.w, h: this.h };
  }
  update(dt, G) {
    this.t += dt;
    if (this.t >= this.life) { this.dead = true; return; }
    if (this.ox !== null && this.owner) {
      this.x = this.owner.x + this.ox;
      this.y = this.owner.y + (this.oy || 0);
    } else {
      this.vy += this.grav * dt;
      this.x += this.vx * dt;
      this.y += this.vy * dt;
    }
    if (this._update) this._update.call(this, dt, G);
    if (this.dead) return;

    const r = this.rect();
    if (this.team === 'player') {
      for (const e of G.enemies) {
        if (e.dead || e.invuln > 0) continue;
        const last = this.hitMap.get(e);
        if (last !== undefined && (this.rehit <= 0 || this.t - last < this.rehit)) continue;
        if (rectsOverlap(r, e.rect())) {
          this.hitMap.set(e, this.t);
          this.strikeEnemy(e, G);
          if (!this.pierce) { this.dead = true; break; }
        }
      }
    } else {
      const p = G.player;
      if (p && !p.dead && !this.hitPlayerOnce) {
        if (rectsOverlap(r, p.rect())) {
          if (p.invuln > 0) {
            // check Perfect Dodge window
            if (p.perfectDodgeWindow > 0 && !p._dodgeTriggered) {
              p.triggerPerfectDodge(G);
              this.hitPlayerOnce = true;
            }
          } else {
            this.hitPlayerOnce = true;
            const atkPower = this.rawDmg || (this.owner ? this.owner.atk : 25);
            const kbDir = this.vx ? sign(this.vx) : sign(p.x - this.x);
            p.takeHit(atkPower * this.dmg, kbDir * this.kb, this.up, this.stun, this.color, G);
            if (this._onHit) this._onHit.call(this, p, G);
            if (!this.pierce) this.dead = true;
          }
        }
      }
    }
  }
  strikeEnemy(e, G) {
    const p = this.owner || G.player;
    const isAwake = p && p.awakenT > 0;
    const critChance = (p ? p.crit : 0.15) + (isAwake ? 0.15 : 0);
    const atkVal = (p ? p.atk : 50) * (isAwake ? 1.25 : 1);
    const { dmg, isCrit } = calcDamage(atkVal, this.dmg, e.defVal ?? 10, critChance, this.crit);
    const dir = this.vx ? sign(this.vx) : (p ? sign(e.x - p.x || p.dir) : 1);
    const kbVal = this.kb ? (Math.abs(this.kb) * dir * (this.kb < 0 ? -1 : 1)) : 0;
    e.takeHit(dmg, isCrit, kbVal, this.up, this.stun, this.poiseDmg, this.color, G);

    if (p) {
      p.addCombo(G);
      p.gainEmber(isCrit ? 6 : 4);
      p.mp = Math.min(p.maxMp, p.mp + 2.5);
      G.stats.dmgDealt += dmg;
      // Legendary affixes
      if (isCrit && p.hasLegend('thunder_crit')) {
        const td = Math.max(5, Math.round(dmg * 0.6));
        Snd.play('thunder', { vol: 0.45 });
        G.fx(fxLine(e.x + rand(-16, 16), e.y - 420, e.x, e.y - 40, 0.22, '#98eaff', 4));
        e.takeHit(td, false, 0, -90, 0.15, 10, '#8ae8ff', G, true);
      }
      if (p.hasLegend('lifesteal')) {
        p.heal(Math.max(1, Math.round(dmg * 0.06)), true);
        p.mp = Math.min(p.maxMp, p.mp + 1);
      }
      if (p.hasLegend('ember_nova') && p.combo > 0 && p.combo % 6 === 0) {
        FX.explosion(e.x, e.y - 45, 75, '#ff7828', '#ffffff');
        e.takeHit(Math.round(atkVal * 0.9), false, dir * 180, -180, 0.3, 20, '#ff8030', G, true);
      }
    }
    if (this._onHit) this._onHit.call(this, e, G);
    if (this.hitstop > 0) G.addHitstop(this.hitstop * (isCrit ? 1.3 : 1));
    if (this.shake > 0) G.addShake(this.shake * (isCrit ? 1.25 : 1));
    Snd.play(isCrit ? 'crit' : (this.hitstop > 0.05 ? 'hitHeavy' : 'hit'), { vol: 0.85 });
  }
  draw(ctx) {
    if (this._draw) { this._draw.call(this, ctx); return; }
    // fallback subtle glowing orb if projectile has no custom draw
    if (this.vx || this.vy) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      drawGlow(ctx, this.x, this.y, Math.max(this.w, this.h) * 0.6, this.color, 0.85);
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(this.x, this.y, Math.min(this.w, this.h) * 0.25, 0, TAU); ctx.fill();
      ctx.restore();
    }
  }
}

/* ============================================================
 *  PLAYER
 * ============================================================ */
class Player {
  constructor(heroId, profile) {
    this.heroId = heroId;
    this.hero = HEROES[heroId];
    this.S = STYLES[heroId];
    this.profile = profile;
    this.x = 240; this.y = GROUND; this.vx = 0; this.vy = 0;
    this.dir = 1;
    this.w = 34; this.h = 84;
    this.grounded = true;
    this.jumpsLeft = 2;
    this.coyoteT = 0;
    this.dropPlatT = 0;
    this.dead = false;

    // stats
    this.recomputeStats(true);
    this.ember = 35; // starts with a taste of 梦烬!

    // combat states
    this.invuln = 0;
    this.perfectDodgeWindow = 0;
    this._dodgeTriggered = false;
    this.superArmor = 0;
    this.shieldT = 0;
    this.shieldRatio = 1;
    this.awakenT = 0;
    this.stunT = 0;
    this.moveLock = 0;
    this.flash = 0;

    // combo & attack
    this.atk = this.atk;
    this.atkState = null; // { def, t, phase, hitFired, isPlunge, idx }
    this.comboIdx = 0;
    this.comboResetT = 0;
    this.dashT = 0; this.dashCd = 0;
    this.poseAnim = null;

    // cooldowns
    this.cds = { s1: 0, s2: 0, s3: 0, treasure: 0 };

    // hit combo counter
    this.combo = 0;
    this.comboTimer = 0;
    this.maxCombo = 0;

    // visuals
    this.t = 0;
    this.pose = POSES[this.hero.idlePose].slice();
    this.trail = new Trail(this.hero.color, 0.17, '#ffffff');
    this.afterimages = [];
    this.ghostT = 0;
    this.cloth = this.S.cloth ? new Cloth(this.S.cloth, this.x, this.y - 70) : null;
  }

  recomputeStats(fullHeal = false) {
    const base = heroBaseStats(this.hero, this.profile.lv);
    const eq = this.profile.equip || {};
    let hp = base.hp, mp = base.mp, atk = base.atk, def = base.def, crit = base.crit, spd = base.spd;
    this._legends = new Set();
    for (const slot of ['weapon', 'armor', 'acc']) {
      const it = eq[slot];
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
      if (it.legend) this._legends.add(it.legend.id);
    }
    this.maxHp = Math.round(hp);
    this.maxMp = Math.round(mp);
    this.atk = Math.round(atk);
    this.def = Math.round(def);
    this.crit = clamp(crit, 0, 0.85);
    this.spd = spd;
    this.cdrMul = this.hasLegend('cdr_flow') ? 1.28 : 1.0;
    if (fullHeal) {
      this.hp = this.maxHp;
      this.hpTrail = this.maxHp;
      this.mp = this.maxMp;
    } else {
      this.hp = Math.min(this.hp, this.maxHp);
      this.mp = Math.min(this.mp, this.maxMp);
    }
  }
  hasLegend(id) { return this._legends && this._legends.has(id); }
  rect() { return { x: this.x - this.w / 2, y: this.y - this.h, w: this.w, h: this.h }; }
  lockMove(sec) { this.moveLock = Math.max(this.moveLock, sec); }
  awaken(sec) { this.awakenT = Math.max(this.awakenT, sec); }

  heal(amt, quiet = false) {
    if (this.dead) return;
    const prev = this.hp;
    this.hp = Math.min(this.maxHp, this.hp + amt);
    const gained = Math.round(this.hp - prev);
    if (gained > 0 && !quiet) {
      Floaters.add(this.x, this.y - 88, '+' + gained, { color: '#68ff98', size: 22 });
    }
  }
  gainEmber(amt) {
    this.ember = Math.min(100, this.ember + amt);
  }
  addCombo(G) {
    this.combo++;
    this.comboTimer = 2.4;
    if (this.combo > this.maxCombo) this.maxCombo = this.combo;
    if (G && G.stats && this.combo > G.stats.maxCombo) G.stats.maxCombo = this.combo;
  }

  triggerPerfectDodge(G) {
    this._dodgeTriggered = true;
    Snd.play('bell'); Snd.play('dash');
    G.setSlowmo(0.28, 0.36);
    G.addFlash('#ffffff', 0.25, 0.16);
    this.invuln = Math.max(this.invuln, 0.7);
    this.mp = Math.min(this.maxMp, this.mp + 24);
    this.gainEmber(18);
    Floaters.add(this.x, this.y - 102, '极限闪避!', { color: '#98f0ff', size: 26, font: FONT_BRUSH });
    FX.hitSpark(this.x, this.y - 50, this.dir, this.hero.color, 1.2);
    // exploding ink shadow at dodge spot
    const sx = this.x, sy = this.y - 45;
    G.after(0.18, () => {
      FX.explosion(sx, sy, 70, this.hero.color, '#ffffff');
      G.attack({
        team: 'player', owner: this, x: sx, y: sy, w: 150, h: 130,
        dmg: 1.2, kb: this.dir * 220, up: -240, stun: 0.45, hitstop: 0.04, shake: 6, life: 0.1, color: this.hero.color,
      });
    });
  }

  takeHit(rawDmg, kb, up, stun, color, G) {
    if (this.dead || this.invuln > 0) return;
    const shieldMul = this.shieldT > 0 ? this.shieldRatio : 1;
    const { dmg } = calcDamage(rawDmg, 1, this.def, 0, 0, shieldMul);
    this.hp = Math.max(0, this.hp - dmg);
    this.flash = 1;
    this.invuln = 0.48;
    this.gainEmber(8);
    if (G && G.stats) G.stats.dmgTaken += dmg;
    Floaters.add(this.x, this.y - 90, '-' + dmg, { color: '#ff4848', size: 24 });
    FX.hitSpark(this.x, this.y - 48, sign(kb), color || '#ff3a28', 0.9);
    Snd.play('hurt');
    G.addShake(Math.min(14, 4 + dmg * 0.08));

    if (this.superArmor <= 0 && this.shieldT <= 0) {
      this.vx = kb;
      if (up) { this.vy = up; this.grounded = false; }
      this.stunT = Math.max(this.stunT, stun * 0.75);
      this.atkState = null;
      this.poseAnim = null;
    }
    if (this.hp <= 0) {
      this.dead = true;
      Snd.play('die');
      FX.inkBurst(this.x, this.y - 45, 22, '#0a0808', 22);
      G.onPlayerDead();
    }
  }

  update(dt, G) {
    this.t += dt;
    this.hpTrail = damp(this.hpTrail, this.hp, 4.5, dt);
    if (this.flash > 0) this.flash = Math.max(0, this.flash - dt * 5);
    if (this.invuln > 0) this.invuln = Math.max(0, this.invuln - dt);
    if (this.perfectDodgeWindow > 0) this.perfectDodgeWindow = Math.max(0, this.perfectDodgeWindow - dt);
    if (this.superArmor > 0) this.superArmor = Math.max(0, this.superArmor - dt);
    if (this.shieldT > 0) this.shieldT = Math.max(0, this.shieldT - dt);
    if (this.awakenT > 0) {
      this.awakenT = Math.max(0, this.awakenT - dt);
      if (chance(0.45)) Parts.spawn('ember', this.x + rand(-20, 20), this.y - rand(15, 80), { color: this.hero.color, size: 2.5, life: 0.45 });
    }
    if (this.dropPlatT > 0) this.dropPlatT = Math.max(0, this.dropPlatT - dt);
    if (this.dashCd > 0) this.dashCd = Math.max(0, this.dashCd - dt);
    for (const k of ['s1', 's2', 's3', 'treasure']) {
      if (this.cds[k] > 0) this.cds[k] = Math.max(0, this.cds[k] - dt * this.cdrMul);
    }
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) this.combo = 0;
    }
    if (this.comboResetT > 0) {
      this.comboResetT -= dt;
      if (this.comboResetT <= 0) this.comboIdx = 0;
    }
    // passive MP regen
    if (!this.dead) {
      const mpReg = (this.hasLegend('cdr_flow') ? 6.2 : 4.2) * dt;
      this.mp = Math.min(this.maxMp, this.mp + mpReg);
    }

    // update afterimages
    for (let i = this.afterimages.length - 1; i >= 0; i--) {
      const a = this.afterimages[i];
      a.t += dt;
      if (a.t > 0.25) this.afterimages.splice(i, 1);
    }

    if (this.dead) {
      this.vy += GRAV * dt; this.y += this.vy * dt;
      if (this.y > GROUND) { this.y = GROUND; this.vy = 0; this.vx *= 0.8; }
      poseLerp(this.pose, POSES.down, 1 - Math.exp(-12 * dt), this.pose);
      this.trail.update(dt);
      return;
    }

    if (this.stunT > 0) {
      this.stunT -= dt;
      this.vx *= Math.exp(-8 * dt);
      this.physicsStep(dt, G);
      poseLerp(this.pose, POSES.hurt, 1 - Math.exp(-18 * dt), this.pose);
      this.trail.update(dt);
      this.updateCloth(dt);
      return;
    }

    // --- input actions ---
    const moveDir = (Input.down('right') ? 1 : 0) - (Input.down('left') ? 1 : 0);
    if (this.dashT > 0) {
      this.dashT -= dt;
      this.ghostT -= dt;
      if (this.ghostT <= 0) {
        this.ghostT = 0.035;
        this.afterimages.push({ x: this.x, y: this.y, dir: this.dir, pose: this.pose.slice(), t: 0, col: this.hero.color });
      }
    } else if (this.awakenT > 0) {
      this.ghostT -= dt;
      if (this.ghostT <= 0 && (Math.abs(this.vx) > 120 || this.atkState)) {
        this.ghostT = 0.07;
        this.afterimages.push({ x: this.x, y: this.y, dir: this.dir, pose: this.pose.slice(), t: 0, col: this.hero.color });
      }
    }

    if (this.moveLock > 0) this.moveLock = Math.max(0, this.moveLock - dt);

    // Dash (L / Shift)
    if (Input.buffered('dash', 120) && this.dashCd <= 0 && this.dashT <= 0) {
      Input.consume('dash');
      this.atkState = null; this.poseAnim = null; this.moveLock = 0;
      if (moveDir) this.dir = moveDir;
      this.dashT = 0.2;
      this.dashCd = 0.55;
      this.invuln = Math.max(this.invuln, 0.24);
      this.perfectDodgeWindow = 0.16;
      this._dodgeTriggered = false;
      this.vx = this.dir * 820;
      this.vy = Math.min(this.vy, 0);
      Snd.play('dash');
      FX.dust(this.x, GROUND, 6, this.hero.color, 1.1);
    }

    // Ultimate (Space)
    if (Input.hit('ult') && this.ember >= 100) {
      Input.consume('ult');
      this.ember = 0;
      this.atkState = null;
      G.triggerUlt(this);
      return;
    }

    // Treasure (E)
    if (Input.hit('treasure') && this.profile.treasure && this.cds.treasure <= 0) {
      const tr = TREASURES[this.profile.treasure];
      if (tr && TreasureImpl[tr.id]) {
        Input.consume('treasure');
        this.cds.treasure = tr.cd;
        Floaters.add(this.x, this.y - 105, tr.name, { color: tr.color, size: 22, font: FONT_BRUSH });
        TreasureImpl[tr.id](this, G);
      }
    }

    // Skills (U / I / O)
    const canSkill = !this.poseAnim && this.dashT <= 0;
    if (canSkill) {
      for (const sk of this.hero.skills) {
        if (sk.id === 'ult') continue;
        if (Input.buffered(sk.id, 130) && this.cds[sk.id] <= 0 && this.mp >= sk.mp) {
          Input.consume(sk.id);
          this.atkState = null;
          this.mp -= sk.mp;
          this.cds[sk.id] = sk.cd;
          if (moveDir) this.dir = moveDir;
          Floaters.add(this.x, this.y - 98, sk.name, { color: sk.color, size: 22, font: FONT_BRUSH });
          SkillImpl[this.heroId][sk.id](this, G);
          break;
        }
      }
    }

    // Jump (K)
    if (this.grounded) { this.coyoteT = 0.1; this.jumpsLeft = 2; }
    else if (this.coyoteT > 0) this.coyoteT -= dt;

    if (Input.buffered('jump', 120) && this.moveLock <= 0 && this.dashT <= 0) {
      if (Input.down('down') && this.grounded && this.y < GROUND - 4) {
        Input.consume('jump');
        this.dropPlatT = 0.24;
        this.grounded = false;
        this.y += 4;
      } else if (this.coyoteT > 0 || this.jumpsLeft > 0) {
        Input.consume('jump');
        if (this.coyoteT > 0) { this.jumpsLeft = 1; this.coyoteT = 0; }
        else {
          this.jumpsLeft--;
          Parts.spawn('ellipse', this.x, this.y, { size: 6, grow: 55, color: this.hero.color, life: 0.28, lw: 3 });
        }
        this.vy = -990;
        this.grounded = false;
        this.atkState = null;
        Snd.play('jump');
        FX.dust(this.x, this.y, 4, '#b8b0a0', 0.6);
      }
    }

    // Basic Attacks (J)
    if (Input.buffered('attack', 180) && !this.poseAnim && this.dashT <= 0) {
      const canChain = !this.atkState || this.atkState.phase === 'recover';
      if (canChain) {
        Input.consume('attack');
        if (moveDir) this.dir = moveDir;
        if (!this.grounded) {
          if (Input.down('down')) {
            // Plunge Slam!
            this.atkState = { def: this.hero.plunge, t: 0, phase: 'plunge', isPlunge: true };
            this.vy = 1180;
            this.vx = this.dir * 120;
            Snd.play('swingHeavy');
          } else {
            this.startAttack(this.hero.air);
            this.vy = Math.min(this.vy, -140);
          }
        } else if (Input.down('up')) {
          this.startAttack(this.hero.launcher);
          this.comboIdx = 0;
        } else {
          const def = this.hero.combo[this.comboIdx];
          this.startAttack(def);
          this.comboIdx = (this.comboIdx + 1) % this.hero.combo.length;
          this.comboResetT = 0.72;
        }
      }
    }

    // Horizontal movement
    const spd = this.spd * (this.awakenT > 0 ? 1.2 : 1);
    if (this.dashT <= 0 && this.moveLock <= 0 && !this.atkState && !this.poseAnim) {
      if (moveDir) {
        this.dir = moveDir;
        const accel = this.grounded ? 4200 : 2800;
        this.vx = approach(this.vx, moveDir * spd, accel * dt);
      } else {
        const decel = this.grounded ? 3600 : 1200;
        this.vx = approach(this.vx, 0, decel * dt);
      }
    } else if (this.dashT <= 0 && !this.poseAnim) {
      this.vx *= Math.exp(-7.5 * dt);
    }

    // Attack state progression
    if (this.atkState) {
      this.updateAttack(dt, G);
    } else if (this.poseAnim) {
      this.poseAnim.t += dt;
      if (this.poseAnim.t >= this.poseAnim.dur) this.poseAnim = null;
    }

    this.physicsStep(dt, G);
    this.animatePose(dt);
    this.trail.update(dt);
    this.updateCloth(dt);
  }

  startAttack(def) {
    this.atkState = { def, t: 0, phase: 'windup', hitFired: false };
    this.comboResetT = 0.72;
  }

  updateAttack(dt, G) {
    const st = this.atkState, d = st.def;
    st.t += dt;
    if (st.phase === 'plunge') {
      this.vy = Math.max(this.vy, 1180);
      if (this.grounded) {
        Snd.play('boom'); Snd.play('hitHeavy');
        G.addShake(d.shake);
        FX.groundRing(this.x, this.hero.color, 180, 0.42);
        FX.dust(this.x, GROUND, 10, '#a09078', 1.4);
        G.attack({
          team: 'player', owner: this, x: this.x, y: this.y - 45, w: d.reach * 2, h: d.h,
          dmg: d.dmg, kb: d.kb, up: d.up, stun: 0.6, hitstop: d.hitstop, shake: d.shake, poiseDmg: 45, life: 0.12, color: this.hero.color,
        });
        this.atkState = null;
      }
      return;
    }
    if (st.phase === 'windup' && st.t >= d.windup) {
      st.phase = 'active'; st.t = 0;
      if (d.lunge) this.vx = this.dir * d.lunge;
      if (d.snd) Snd.play(d.snd);
      if (d.crescent) G.fx(fxCrescent(this.x, this.y + d.yoff, d.crescent[0], d.crescent[1], d.crescent[2], this.dir, this.hero.color, 0.2, 0.34));
      if (d.proj) {
        const pr = d.proj;
        G.attack({
          team: 'player', owner: this, x: this.x + this.dir * 36, y: this.y - 54, w: pr.r * 2.2, h: pr.r * 2,
          vx: this.dir * pr.sp, dmg: pr.dmg, kb: this.dir * 160, up: -80, stun: 0.28, hitstop: 0.025, shake: 3.5,
          life: pr.life, pierce: !!pr.pierce, color: pr.color,
          draw(ctx) {
            ctx.save(); ctx.globalCompositeOperation = 'lighter';
            drawGlow(ctx, this.x, this.y, pr.r * 1.6, pr.color, 0.85);
            ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.5;
            ctx.beginPath(); ctx.arc(this.x, this.y, pr.r * 0.55, 0, TAU); ctx.stroke();
            ctx.fillStyle = pr.color; ctx.font = `${Math.round(pr.r * 0.9)}px ${FONT_BRUSH}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText('卍', this.x, this.y);
            ctx.restore();
          },
        });
      }
      // Spawn melee hitbox
      const self = this;
      G.attack({
        team: 'player', owner: this, ox: this.dir * (d.reach * 0.52), oy: d.yoff, w: d.reach, h: d.h,
        dmg: d.dmg, kb: d.kb, up: d.up, stun: 0.36, hitstop: d.hitstop, shake: d.shake, poiseDmg: d.dmg > 1.5 ? 36 : 16,
        life: d.active, color: this.hero.color,
        onHit() { if (d.bounce && !self.grounded) self.vy = Math.min(self.vy, d.bounce); },
      });
    } else if (st.phase === 'active' && st.t >= d.active) {
      st.phase = 'recover'; st.t = 0;
    } else if (st.phase === 'recover' && st.t >= d.recover) {
      this.atkState = null;
    }
  }

  physicsStep(dt, G) {
    const prevY = this.y;
    const prevGrounded = this.grounded;
    this.vy += GRAV * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.grounded = false;

    // clamp to room bounds
    this.x = clamp(this.x, 34, G.room.w - 34);

    // one-way platforms
    if (this.vy >= 0 && this.dropPlatT <= 0 && G.room.plats) {
      for (const pl of G.room.plats) {
        if (this.x >= pl.x - 10 && this.x <= pl.x + pl.w + 10 && prevY <= pl.y + 6 && this.y >= pl.y) {
          this.y = pl.y;
          this.vy = 0;
          this.grounded = true;
          break;
        }
      }
    }
    if (this.y >= GROUND) {
      this.y = GROUND;
      this.vy = 0;
      this.grounded = true;
    }
    if (!prevGrounded && this.grounded) {
      Snd.play('land');
      FX.dust(this.x, this.y, 4, '#9a8a70', 0.7);
    }
  }

  animatePose(dt) {
    if (this.poseAnim) {
      const u = clamp(this.poseAnim.t / this.poseAnim.dur, 0, 1);
      poseLerp(this.poseAnim.p0, this.poseAnim.p1, Ease.outCubic(u), this.pose);
      return;
    }
    if (this.atkState) {
      const st = this.atkState, d = st.def;
      if (st.phase === 'plunge') { poseLerp(this.pose, POSES.slam, 1 - Math.exp(-20 * dt), this.pose); return; }
      if (st.phase === 'windup') poseLerp(d.pose0, d.pose0, 1, this.pose);
      else if (st.phase === 'active') {
        const u = clamp(st.t / d.active, 0, 1);
        poseLerp(d.pose0, d.pose1, Ease.outExpo(u), this.pose);
        // record trail from weapon
        const J = solveRig(this.pose, this.S, this.grounded);
        const w = this.S.weapon;
        if (w) {
          const hp = rigToWorld(this, J, J.hand, this.S);
          this.trail.add(hp.x, hp.y, J.wa, w.len * 0.25 * this.S.scale, w.len * (1 - w.grip) * this.S.scale, this.dir);
        }
      } else {
        const u = clamp(st.t / d.recover, 0, 1);
        poseLerp(d.pose1, d.pose2, Ease.outCubic(u), this.pose);
      }
      return;
    }
    if (this.dashT > 0) {
      poseLerp(this.pose, POSES.dash, 1 - Math.exp(-26 * dt), this.pose);
    } else if (!this.grounded) {
      poseLerp(this.pose, this.vy < 0 ? POSES.jump : POSES.fall, 1 - Math.exp(-16 * dt), this.pose);
    } else if (Math.abs(this.vx) > 25) {
      const ph = this.t * 14 * (Math.abs(this.vx) / 380);
      const s = Math.sin(ph), c = Math.cos(ph);
      const runP = P(0.32, 0.05, 0.7 - s * 0.8, -0.4, 0.5 + s * 0.8, -0.4, s * 0.85, -0.55 - Math.max(0, -c) * 0.4, -s * 0.85, -0.55 - Math.max(0, c) * 0.4, 2.0 + s * 0.2, Math.abs(c) * -3.5);
      poseLerp(this.pose, runP, 1 - Math.exp(-18 * dt), this.pose);
    } else {
      const base = POSES[this.hero.idlePose].slice();
      base[1] = Math.sin(this.t * 3) * 1.4;
      base[3] += Math.sin(this.t * 3) * 0.04;
      poseLerp(this.pose, base, 1 - Math.exp(-12 * dt), this.pose);
    }
  }

  updateCloth(dt) {
    if (!this.cloth) return;
    const J = solveRig(this.pose, this.S, this.grounded);
    const anc = this.S.cloth.anchor === 'head' ? J.head : this.S.cloth.anchor === 'hip' ? J.hip : J.neck;
    const wp = rigToWorld(this, J, anc, this.S);
    const wind = -this.vx * 2.2 - this.dir * 260;
    this.cloth.update(wp.x, wp.y, dt, wind, this.S.scale);
  }

  draw(ctx, G) {
    // afterimages
    for (const a of this.afterimages) {
      const alpha = (1 - a.t / 0.25) * 0.45;
      drawRig(ctx, a.x, a.y, a.dir, a.pose, this.S, { alpha, flat: a.col, noWeapon: true, eyes: true, t: this.t });
    }
    if (this.awakenT > 0) drawAwakenAura(ctx, this.x, this.y, this.hero.color, this.t, 1.15);
    if (this.cloth) this.cloth.draw(ctx, this.S.scale);
    const rim = (G && G.themeRim) || this.hero.color;
    const blink = this.invuln > 0 && Math.floor(this.t * 28) % 2 === 0;
    drawRig(ctx, this.x, this.y, this.dir, this.pose, this.S, {
      t: this.t, grounded: this.grounded, rim, flash: this.flash,
      alpha: blink ? 0.55 : 1, glowMul: this.awakenT > 0 ? 1.8 : 1, sway: clamp(-this.vx * 0.04, -12, 12),
    });
    this.trail.draw(ctx);
  }
}

/* ============================================================
 *  ENEMY
 * ============================================================ */
class Enemy {
  constructor(typeId, x, y, scale = 1, mirrorHero = 'wukong') {
    const def = ENEMIES[typeId];
    this.typeId = typeId;
    this.def = def;
    this.name = def.name;
    this.ai = def.ai;
    this.x = x; this.y = y || (def.ai === 'fly' || def.ai === 'kamikaze' ? GROUND - 150 : GROUND);
    this.vx = 0; this.vy = 0;
    this.dir = -1;
    this.w = def.w; this.h = def.h;
    this.grounded = this.y >= GROUND;
    this.dead = false;
    this.dying = false; this.dieT = 0;

    this.maxHp = Math.round(def.hp * scale);
    this.hp = this.maxHp;
    this.atk = Math.round(def.atk * Math.pow(scale, 0.72));
    this.defVal = Math.round(def.def * Math.pow(scale, 0.55));
    this.spd = def.spd;
    this.maxPoise = def.poise || 0;
    this.poise = this.maxPoise;
    this.xp = Math.round(def.xp * Math.pow(scale, 0.75));
    this.coinRange = def.coin;
    this.color = def.color;

    this.S = typeId === 'shade' ? STYLES[mirrorHero] : (def.style ? STYLES[def.style] : null);
    this.t = rand(5);
    this.flash = 0;
    this.invuln = 0;
    this.stunT = 0;
    this.slowT = 0;
    this.state = 'idle'; // idle | windup | active | recover
    this.stateT = 0;
    this.cdT = rand(0.3, 0.9);
    this.pose = POSES.idle.slice();
    this.seed = rand(100);
    this.isElite = scale > 1.5 && chance(0.2);
    if (this.isElite) { this.maxHp = Math.round(this.maxHp * 1.45); this.hp = this.maxHp; this.atk = Math.round(this.atk * 1.2); }
  }
  rect() { return { x: this.x - this.w / 2, y: this.y - this.h, w: this.w, h: this.h }; }

  takeHit(dmg, isCrit, kb, up, stun, poiseDmg, color, G, silent = false) {
    if (this.dead) return;
    this.hp = Math.max(0, this.hp - dmg);
    this.flash = 1;
    Floaters.add(this.x, this.y - this.h - 10, dmg, {
      color: isCrit ? '#ffd850' : '#ffffff', size: isCrit ? 30 : 23, crit: isCrit,
    });
    if (!silent) {
      FX.hitSpark(this.x, this.y - this.h * 0.55, sign(kb || 1), color || this.color, isCrit ? 1.25 : 0.85);
      FX.slashMark(this.x, this.y - this.h * 0.55, sign(kb || 1), color || this.color, isCrit ? 110 : 75);
    }
    let broken = false;
    if (this.maxPoise > 0) {
      this.poise -= (poiseDmg || 12);
      if (this.poise <= 0) { this.poise = this.maxPoise; broken = true; Floaters.add(this.x, this.y - this.h - 36, '破防!', { color: '#ffae30', size: 22, font: FONT_BRUSH }); }
    }
    if (this.maxPoise <= 0 || broken || !this.grounded) {
      this.vx = kb;
      if (up) { this.vy = up; this.grounded = false; }
      else if (!this.grounded) { this.vy = Math.min(this.vy, -140); } // air juggle!
      this.stunT = Math.max(this.stunT, broken ? stun * 2.2 : stun);
      if (this.state === 'windup' || broken) { this.state = 'idle'; this.stateT = 0; }
    }
    if (this.hp <= 0) this.die(G);
  }

  die(G) {
    if (this.dead) return;
    this.dead = true;
    Snd.play('die');
    FX.inkBurst(this.x, this.y - this.h * 0.5, 14, '#0c0808', 16);
    FX.embers(this.x, this.y - this.h * 0.5, 10, this.color, 26, 140);
    G.onEnemyKilled(this);
  }

  update(dt, G) {
    this.t += dt;
    if (this.flash > 0) this.flash = Math.max(0, this.flash - dt * 6);
    if (this.slowT > 0) this.slowT = Math.max(0, this.slowT - dt);
    if (this.cdT > 0) this.cdT -= dt;

    const p = G.player;
    if (!p || p.dead) { this.vx *= Math.exp(-8 * dt); this.stepPhys(dt, G); return; }
    const dx = p.x - this.x;
    const adx = Math.abs(dx);
    const slowMul = this.slowT > 0 ? 0.45 : 1;

    if (this.stunT > 0) {
      this.stunT -= dt;
      this.vx *= Math.exp(-6 * dt);
      this.stepPhys(dt, G);
      poseLerp(this.pose, POSES.hurt, 1 - Math.exp(-16 * dt), this.pose);
      return;
    }

    // separation from sibling enemies
    if (this.ai !== 'fly') {
      for (const o of G.enemies) {
        if (o === this || o.dead || o.ai === 'fly') continue;
        const d = this.x - o.x;
        if (Math.abs(d) < 34) this.vx += (d >= 0 ? 1 : -1) * 260 * dt;
      }
    }

    if (this.ai === 'fly') {
      const targetY = GROUND - 155 + Math.sin(this.t * 2.5 + this.seed) * 28;
      this.dir = dx >= 0 ? 1 : -1;
      if (this.state === 'idle') {
        const desired = adx > 290 ? this.dir * this.spd : adx < 170 ? -this.dir * this.spd * 0.7 : 0;
        this.vx = damp(this.vx, desired * slowMul, 5, dt);
        this.vy = damp(this.vy, (targetY - this.y) * 4, 5, dt);
        if (this.cdT <= 0 && adx < this.def.range) { this.state = 'windup'; this.stateT = 0; Snd.play('warn', { vol: 0.4 }); }
      } else if (this.state === 'windup') {
        this.stateT += dt;
        this.vx *= Math.exp(-5 * dt); this.vy *= Math.exp(-5 * dt);
        if (this.stateT >= this.def.windup) {
          this.state = 'idle'; this.cdT = this.def.cd;
          const a = Math.atan2((p.y - 45) - this.y, p.x - this.x);
          Snd.play('fire', { vol: 0.55 });
          G.attack({
            team: 'enemy', owner: this, x: this.x + Math.cos(a) * 18, y: this.y + Math.sin(a) * 18,
            w: 22, h: 22, vx: Math.cos(a) * 390, vy: Math.sin(a) * 390,
            dmg: 1, kb: 160, stun: 0.25, life: 2.0, pierce: false, color: '#ff6a28',
          });
        }
      }
      this.x = clamp(this.x + this.vx * dt, 30, G.room.w - 30);
      this.y = clamp(this.y + this.vy * dt, 100, GROUND - 40);
      return;
    }

    if (this.ai === 'kamikaze') {
      this.dir = dx >= 0 ? 1 : -1;
      const a = Math.atan2((p.y - 45) - this.y, p.x - this.x);
      if (this.state === 'idle') {
        this.vx = damp(this.vx, Math.cos(a) * this.spd * slowMul, 5, dt);
        this.vy = damp(this.vy, Math.sin(a) * this.spd * slowMul, 5, dt);
        if (dist(this.x, this.y, p.x, p.y - 45) < this.def.range) {
          this.state = 'windup'; this.stateT = 0; Snd.play('warn', { vol: 0.6 });
        }
      } else {
        this.stateT += dt;
        this.vx *= Math.exp(-8 * dt); this.vy *= Math.exp(-8 * dt);
        if (this.stateT >= this.def.windup) {
          Snd.play('boom', { vol: 0.6 });
          FX.explosion(this.x, this.y, 90, this.color, '#ffffff');
          G.attack({ team: 'enemy', owner: this, x: this.x, y: this.y, w: 145, h: 145, dmg: 1.4, kb: 320, up: -240, stun: 0.4, life: 0.1, color: this.color });
          this.dead = true;
        }
      }
      this.x = clamp(this.x + this.vx * dt, 30, G.room.w - 30);
      this.y = clamp(this.y + this.vy * dt, 80, GROUND - 15);
      return;
    }

    // Grounded Rigged AI (melee, ranged, brute, yaksha, shade)
    if (this.state === 'idle') {
      this.dir = dx >= 0 ? 1 : -1;
      if (this.ai === 'ranged') {
        const minD = this.def.minDist || 200;
        const move = adx > this.def.range ? this.dir : adx < minD ? -this.dir : 0;
        this.vx = damp(this.vx, move * this.spd * slowMul, 8, dt);
        if (this.cdT <= 0 && adx < this.def.range) { this.state = 'windup'; this.stateT = 0; }
      } else {
        if (adx > this.def.range * 0.85) this.vx = damp(this.vx, this.dir * this.spd * slowMul, 9, dt);
        else {
          this.vx = damp(this.vx, 0, 12, dt);
          if (this.cdT <= 0) { this.state = 'windup'; this.stateT = 0; }
        }
        // shade dashes occasionally
        if (this.ai === 'shade' && adx > 240 && this.cdT <= 0 && chance(0.04)) {
          this.vx = this.dir * 680;
          this.cdT = 0.9;
          FX.dust(this.x, GROUND, 4, '#c870ff', 0.8);
        }
      }
    } else if (this.state === 'windup') {
      this.stateT += dt;
      this.vx *= Math.exp(-10 * dt);
      if (this.stateT >= this.def.windup) {
        this.state = 'active'; this.stateT = 0;
        if (this.ai === 'ranged') {
          Snd.play('swing', { pitch: 1.35 });
          G.attack({
            team: 'enemy', owner: this, x: this.x + this.dir * 26, y: this.y - 52,
            w: 32, h: 12, vx: this.dir * 520, dmg: 1, kb: 160, stun: 0.24, life: 1.6, pierce: false, color: this.color,
            draw(ctx) {
              ctx.save(); ctx.globalCompositeOperation = 'lighter';
              ctx.strokeStyle = this.color; ctx.lineWidth = 4;
              ctx.beginPath(); ctx.moveTo(this.x - sign(this.vx) * 20, this.y); ctx.lineTo(this.x + sign(this.vx) * 14, this.y); ctx.stroke();
              drawGlow(ctx, this.x + sign(this.vx) * 10, this.y, 14, this.color, 0.9);
              ctx.restore();
            },
          });
        } else {
          this.vx = this.dir * (this.ai === 'brute' ? 140 : 210);
          Snd.play(this.ai === 'brute' ? 'swingHeavy' : 'swing');
          G.attack({
            team: 'enemy', owner: this, ox: this.dir * (this.def.range * 0.55), oy: -48,
            w: this.def.range, h: this.ai === 'brute' ? 110 : 84,
            dmg: this.ai === 'brute' ? 1.35 : 1, kb: this.ai === 'brute' ? 380 : 210, up: this.ai === 'brute' ? -240 : -90,
            stun: 0.3, life: this.def.active || 0.14, color: this.color,
          });
          if (this.ai === 'brute') {
            G.addShake(7);
            FX.groundRing(this.x + this.dir * 55, '#ff5a18', 110, 0.35);
          }
        }
      }
    } else if (this.state === 'active') {
      this.stateT += dt;
      this.vx *= Math.exp(-8 * dt);
      if (this.stateT >= (this.def.active || 0.14)) { this.state = 'recover'; this.stateT = 0; }
    } else if (this.state === 'recover') {
      this.stateT += dt;
      this.vx *= Math.exp(-8 * dt);
      if (this.stateT >= (this.def.recover || 0.45)) { this.state = 'idle'; this.cdT = this.def.cd * rand(0.85, 1.15); }
    }

    this.stepPhys(dt, G);
    this.animateEnemy(dt);
  }

  stepPhys(dt, G) {
    if (this.ai === 'fly' || this.ai === 'kamikaze') return;
    const g = !this.grounded && this.vy < 0 ? GRAV * 0.72 : GRAV * 0.92;
    this.vy += g * dt;
    this.x = clamp(this.x + this.vx * dt, 34, G.room.w - 34);
    this.y += this.vy * dt;
    if (this.y >= GROUND) { this.y = GROUND; this.vy = 0; this.grounded = true; }
    else this.grounded = false;
  }

  animateEnemy(dt) {
    if (!this.S) return;
    if (this.state === 'windup') {
      const p = P(-0.18, -0.1, 2.5, -0.2, -0.4, 0.5, 0.4, -0.3, -0.35, -0.2, 3.4);
      poseLerp(this.pose, p, 1 - Math.exp(-16 * dt), this.pose);
    } else if (this.state === 'active') {
      const p = P(0.45, 0.1, 1.1, 0.1, -0.7, 0.4, 0.7, -0.6, -0.5, -0.2, 0.7);
      poseLerp(this.pose, p, 1 - Math.exp(-26 * dt), this.pose);
    } else if (Math.abs(this.vx) > 20) {
      const ph = this.t * 10 * (Math.abs(this.vx) / 180);
      const s = Math.sin(ph);
      const p = P(0.22, 0, 0.7 - s * 0.5, -0.4, 0.5 + s * 0.5, -0.4, s * 0.65, -0.45, -s * 0.65, -0.45, 2.0);
      poseLerp(this.pose, p, 1 - Math.exp(-14 * dt), this.pose);
    } else {
      const b = POSES.idle.slice();
      b[1] = Math.sin(this.t * 3 + this.seed) * 1.5;
      poseLerp(this.pose, b, 1 - Math.exp(-10 * dt), this.pose);
    }
  }

  draw(ctx, G) {
    if (this.ai === 'fly') { // 焚羽火鸦
      ctx.save(); ctx.translate(this.x, this.y); ctx.scale(this.dir, 1);
      const flap = Math.sin(this.t * 16 + this.seed) * 18;
      ctx.globalCompositeOperation = 'lighter';
      drawGlow(ctx, 0, 0, 42, this.state === 'windup' ? '#ff2010' : '#ff6820', 0.45);
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#180c0c';
      // wings
      ctx.beginPath(); ctx.moveTo(-6, 0); ctx.quadraticCurveTo(-22, -24 + flap, -40, -10 + flap); ctx.quadraticCurveTo(-18, 4, 6, 4); ctx.fill();
      // body & beak
      ctx.beginPath(); ctx.ellipse(0, 2, 16, 10, -0.1, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.moveTo(14, -1); ctx.lineTo(25, 3); ctx.lineTo(14, 6); ctx.fill();
      // burning eye
      ctx.fillStyle = '#ff9830'; ctx.beginPath(); ctx.arc(10, -1, 2.5, 0, TAU); ctx.fill();
      if (this.flash > 0) drawGlow(ctx, 0, 0, 45, '#ffffff', this.flash);
      ctx.restore();
    } else if (this.ai === 'kamikaze') { // 幽冥鬼火
      ctx.save(); ctx.translate(this.x, this.y);
      ctx.globalCompositeOperation = 'lighter';
      const pulse = 1 + 0.2 * Math.sin(this.t * 14);
      drawGlow(ctx, 0, 0, 42 * pulse, this.state === 'windup' ? '#ff4040' : this.color, 0.7);
      ctx.fillStyle = '#e8fff8';
      ctx.beginPath(); ctx.arc(0, 0, 12 * pulse, 0, TAU); ctx.fill();
      ctx.fillStyle = '#081818';
      ctx.fillRect(-5, -4, 3, 4); ctx.fillRect(2, -4, 3, 4);
      ctx.restore();
    } else if (this.S) {
      const isShade = this.typeId === 'shade';
      drawRig(ctx, this.x, this.y, this.dir, this.pose, this.S, {
        t: this.t, grounded: this.grounded,
        rim: isShade ? '#c860ff' : (this.isElite ? '#ffaa30' : this.color),
        tint: isShade ? '#1c0c2e' : null,
        eye: isShade ? '#ff50d0' : null,
        eyeGlow: isShade ? '#d040ff' : null,
        flash: this.flash,
      });
      // windup telegraph glint
      if (this.state === 'windup') {
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        drawGlow(ctx, this.x + this.dir * 12, this.y - this.h * 0.78, 22, '#ff3828', 0.85);
        ctx.restore();
      }
    }
    // subtle overhead HP bar once injured
    if (this.hp < this.maxHp || this.isElite) {
      const bw = Math.max(46, this.w * 1.15), bh = 5;
      const bx = this.x - bw / 2, by = this.y - this.h - 18;
      ctx.fillStyle = 'rgba(10,6,8,0.75)';
      ctx.fillRect(bx - 1, by - 1, bw + 2, bh + 2);
      ctx.fillStyle = this.isElite ? '#ffaa30' : '#e03a30';
      ctx.fillRect(bx, by, bw * (this.hp / this.maxHp), bh);
      if (this.maxPoise > 0) {
        ctx.fillStyle = '#e8c860';
        ctx.fillRect(bx, by + bh + 1, bw * (this.poise / this.maxPoise), 2);
      }
    }
  }
}

/* ============================================================
 *  PICKUPS & SHRINES
 * ============================================================ */
class Pickup {
  constructor(kind, x, y, data = null) {
    this.kind = kind; // 'coin' | 'soul' | 'hp' | 'mp' | 'gear' | 'treasure'
    this.x = x; this.y = y;
    this.vx = rand(-140, 140); this.vy = rand(-460, -240);
    this.data = data;
    this.t = 0;
    this.dead = false;
  }
  update(dt, G) {
    this.t += dt;
    this.vy += 1600 * dt;
    this.x = clamp(this.x + this.vx * dt, 30, G.room.w - 30);
    this.y += this.vy * dt;
    if (this.y >= GROUND) { this.y = GROUND; this.vy = -this.vy * 0.35; this.vx *= 0.65; if (Math.abs(this.vy) < 40) this.vy = 0; }

    const p = G.player;
    if (!p || p.dead) return;
    const d = dist(this.x, this.y, p.x, p.y - 36);
    const autoRadius = (this.kind === 'coin' || this.kind === 'soul') ? (G.roomCleared ? 1600 : 240) : 145;
    if (this.kind !== 'gear' && this.kind !== 'treasure' && d < autoRadius && this.t > 0.32) {
      const a = Math.atan2((p.y - 36) - this.y, p.x - this.x);
      const sp = 760;
      this.x += Math.cos(a) * sp * dt;
      this.y += Math.sin(a) * sp * dt;
    }
    if (d < 46 && this.t > 0.25) {
      this.dead = true;
      this.collect(G);
    }
  }
  collect(G) {
    const p = G.player;
    if (this.kind === 'coin') {
      const v = this.data || 10;
      App.save.coins += v;
      G.stats.coins += v;
      Snd.play('coin');
    } else if (this.kind === 'soul') {
      const v = this.data || 5;
      App.save.souls += v;
      G.stats.souls += v;
      Snd.play('pickup');
    } else if (this.kind === 'hp') {
      p.heal(Math.round(p.maxHp * 0.16));
      Snd.play('pickup');
    } else if (this.kind === 'mp') {
      const m = Math.round(p.maxMp * 0.25);
      p.mp = Math.min(p.maxMp, p.mp + m);
      Floaters.add(p.x, p.y - 80, '+' + m + ' 灵力', { color: '#60b8ff', size: 19 });
      Snd.play('pickup');
    } else if (this.kind === 'gear') {
      Snd.play('loot');
      const it = this.data;
      G.lootItems.push(it);
      App.addItem(it);
      G.toast(it.name, QUALITIES[it.q].color, `获得[${QUALITIES[it.q].name}]阶 ${SLOTS[it.slot].name}`);
    } else if (this.kind === 'treasure') {
      Snd.play('levelup');
      const tid = this.data;
      if (!App.save.treasures.includes(tid)) App.save.treasures.push(tid);
      if (!p.profile.treasure) p.profile.treasure = tid;
      const tr = TREASURES[tid];
      G.toast(`法宝·${tr.name}`, tr.color, '按 E 键即可施展法宝神通！');
    }
  }
  draw(ctx) {
    const bob = Math.sin(this.t * 5) * 4;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    if (this.kind === 'coin') {
      drawGlow(ctx, this.x, this.y - 10, 18, '#ffd040', 0.65);
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#ffd850'; ctx.beginPath(); ctx.arc(this.x, this.y - 10, 7, 0, TAU); ctx.fill();
      ctx.fillStyle = '#5a3208'; ctx.fillRect(this.x - 2, this.y - 12, 4, 4);
    } else if (this.kind === 'soul') {
      drawGlow(ctx, this.x, this.y - 12 + bob, 22, '#60e8ff', 0.75);
      ctx.fillStyle = '#d8ffff'; ctx.beginPath(); ctx.arc(this.x, this.y - 12 + bob, 5, 0, TAU); ctx.fill();
    } else if (this.kind === 'hp') {
      drawGlow(ctx, this.x, this.y - 14 + bob, 26, '#ff4858', 0.8);
      ctx.fillStyle = '#ff98a0'; ctx.beginPath(); ctx.arc(this.x, this.y - 14 + bob, 7, 0, TAU); ctx.fill();
    } else if (this.kind === 'mp') {
      drawGlow(ctx, this.x, this.y - 14 + bob, 26, '#48a8ff', 0.8);
      ctx.fillStyle = '#a8dcff'; ctx.beginPath(); ctx.arc(this.x, this.y - 14 + bob, 7, 0, TAU); ctx.fill();
    } else if (this.kind === 'gear' || this.kind === 'treasure') {
      const col = this.kind === 'treasure' ? TREASURES[this.data].color : QUALITIES[this.data.q].color;
      // loot pillar of light!
      const bh = this.kind === 'treasure' ? 240 : 110 + this.data.q * 34;
      const g = ctx.createLinearGradient(0, this.y - bh, 0, this.y);
      g.addColorStop(0, rgba(col, 0)); g.addColorStop(1, rgba(col, 0.75));
      ctx.fillStyle = g;
      ctx.fillRect(this.x - 10, this.y - bh, 20, bh);
      drawGlow(ctx, this.x, this.y - 14 + bob, 36, col, 0.9);
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(this.x, this.y - 14 + bob, 9, 0, TAU); ctx.fill();
    }
    ctx.restore();
  }
}

class Shrine {
  constructor(x) {
    this.x = x; this.y = GROUND; this.used = false; this.t = 0;
  }
  update(dt, G) {
    this.t += dt;
    if (this.used || !G.player || G.player.dead) return;
    if (Math.abs(G.player.x - this.x) < 62 && Math.abs(G.player.y - this.y) < 70) {
      this.used = true;
      Snd.play('heal'); Snd.play('bell');
      const p = G.player;
      p.heal(Math.round(p.maxHp * 0.35));
      const m = Math.round(p.maxMp * 0.45);
      p.mp = Math.min(p.maxMp, p.mp + m);
      p.gainEmber(25);
      FX.groundRing(this.x, '#58ffc8', 180, 0.55);
      FX.embers(this.x, this.y - 40, 18, '#88ffe8', 50, 160);
      G.toast('灵泉庇佑', '#58ffc8', '恢复35%气血、45%灵力与25点梦烬！');
    }
  }
  draw(ctx) {
    ctx.save();
    // carved stone shrine
    ctx.fillStyle = '#181e22';
    ctx.fillRect(this.x - 24, this.y - 74, 48, 74);
    ctx.fillStyle = '#242c32';
    ctx.beginPath(); ctx.moveTo(this.x - 32, this.y - 74); ctx.lineTo(this.x, this.y - 96); ctx.lineTo(this.x + 32, this.y - 74); ctx.closePath(); ctx.fill();
    if (!this.used) {
      ctx.globalCompositeOperation = 'lighter';
      const p = 0.7 + 0.3 * Math.sin(this.t * 4);
      drawGlow(ctx, this.x, this.y - 42, 65 * p, '#58ffc8', 0.55);
      ctx.fillStyle = '#b4ffec'; ctx.font = `24px ${FONT_BRUSH}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('泉', this.x, this.y - 42);
    }
    ctx.restore();
  }
}
