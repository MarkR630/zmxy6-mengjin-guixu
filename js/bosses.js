'use strict';
/* ============================================================
 *  BOSSES — 5 Monumental Multi-Phase Procedural Bosses
 * ============================================================ */
class BaseBoss {
  constructor(id, name, title, x, y, hp, atk, def, poise, color, scale = 1) {
    this.id = id;
    this.isBoss = true;
    this.name = name;
    this.title = title;
    this.x = x; this.y = y; this.vx = 0; this.vy = 0;
    this.dir = -1;
    this.w = 90; this.h = 135;
    this.grounded = true;
    this.dead = false;
    this.invuln = 0;
    this.flash = 0;
    this.stunT = 0;
    this.slowT = 0;
    this.maxHp = Math.round(hp * scale);
    this.hp = this.maxHp;
    this.atk = Math.round(atk * Math.pow(scale, 0.72));
    this.defVal = Math.round(def * Math.pow(scale, 0.55));
    this.maxPoise = poise;
    this.poise = poise;
    this.color = color;
    this.phase = 1;
    this.t = 0;
    this.state = 'idle';
    this.stateT = 0;
    this.cd = 1.0;
    this.patternIdx = 0;
    this.xp = Math.round(280 * scale);
    this.coinRange = [90, 140];
  }
  rect() { return { x: this.x - this.w / 2, y: this.y - this.h, w: this.w, h: this.h }; }
  takeHit(dmg, isCrit, kb, up, stun, poiseDmg, color, G, silent = false) {
    if (this.dead) return;
    const finalDmg = this.stunT > 0 ? Math.round(dmg * 1.25) : dmg; // broken poise takes 25% bonus!
    this.hp = Math.max(0, this.hp - finalDmg);
    this.flash = 1;
    Floaters.add(this.x + rand(-22, 22), this.y - this.h * 0.75, finalDmg, {
      color: isCrit ? '#ffd850' : '#ffffff', size: isCrit ? 32 : 24, crit: isCrit,
    });
    if (!silent) {
      FX.hitSpark(this.x + rand(-18, 18), this.y - this.h * 0.55, sign(kb || 1), color || this.color, isCrit ? 1.3 : 0.9);
      FX.slashMark(this.x, this.y - this.h * 0.55, sign(kb || 1), color || this.color, 110);
    }
    if (this.stunT <= 0 && this.maxPoise > 0) {
      this.poise -= (poiseDmg || 12);
      if (this.poise <= 0) {
        this.poise = this.maxPoise;
        this.stunT = 2.0;
        this.state = 'stun'; this.stateT = 0;
        Snd.play('hitHeavy'); Snd.play('bell');
        G.addShake(12);
        FX.groundRing(this.x, '#ffd868', 170, 0.45);
        Floaters.add(this.x, this.y - this.h - 24, '护体破防!', { color: '#ffd868', size: 28, font: FONT_BRUSH });
      }
    }
    if (this.hp <= 0) this.die(G);
  }
  die(G) {
    if (this.dead) return;
    this.dead = true;
    Snd.play('boom'); Snd.play('gong');
    G.setSlowmo(0.22, 1.15);
    G.addShake(24);
    G.addFlash('#ffffff', 0.6, 0.4);
    FX.explosion(this.x, this.y - this.h * 0.5, 220, this.color, '#ffffff');
    FX.inkBurst(this.x, this.y - this.h * 0.5, 32, '#0c0808', 26);
    G.onBossKilled(this);
  }
  stepPhys(dt, G) {
    this.vy += GRAV * dt;
    this.x = clamp(this.x + this.vx * dt, 70, G.room.w - 70);
    this.y += this.vy * dt;
    if (this.y >= GROUND) { this.y = GROUND; this.vy = 0; this.grounded = true; }
    else this.grounded = false;
  }
}

/* ============================================================
 *  BOSS 1: 通臂烬猿 · 焚天魔将
 * ============================================================ */
class BossApe extends BaseBoss {
  constructor(x, scale) {
    super('ape', '通臂烬猿', '焚天魔将', x, GROUND, 2400, 32, 18, 220, '#ff6820', scale);
    this.w = 96; this.h = 148;
    this.comboStep = 0;
  }
  enterPhase2(G) {
    this.phase = 2;
    Snd.play('roar'); G.addShake(16); G.addFlash('#ff5820', 0.35, 0.25);
    FX.groundRing(this.x, '#ff5820', 320, 0.6);
    Floaters.add(this.x, this.y - 165, '狂暴·四臂魔相!', { color: '#ff8a30', size: 28, font: FONT_BRUSH });
  }
  update(dt, G) {
    this.t += dt;
    if (this.flash > 0) this.flash = Math.max(0, this.flash - dt * 6);
    if (this.slowT > 0) this.slowT = Math.max(0, this.slowT - dt);
    const p = G.player; if (!p || p.dead) return;
    if (this.phase === 1 && this.hp < this.maxHp * 0.55) this.enterPhase2(G);

    if (this.stunT > 0) {
      this.stunT -= dt; this.vx *= Math.exp(-8 * dt); this.stepPhys(dt, G);
      if (this.stunT <= 0) { this.state = 'idle'; this.cd = 0.7; }
      return;
    }

    const dx = p.x - this.x;
    this.stateT += dt;
    if (this.state === 'idle') {
      this.dir = dx >= 0 ? 1 : -1;
      const spd = this.phase === 2 ? 230 : 180;
      if (Math.abs(dx) > 130) this.vx = damp(this.vx, this.dir * spd, 6, dt);
      else this.vx = damp(this.vx, 0, 8, dt);
      this.cd -= dt * (this.phase === 2 ? 1.3 : 1);
      if (this.cd <= 0) {
        const choice = (this.patternIdx++) % (this.phase === 2 ? 3 : 2);
        this.stateT = 0;
        if (choice === 0) {
          this.state = 'punchWindup'; this.comboStep = 0; Snd.play('warn');
        } else if (choice === 1) {
          this.state = 'leapWindup'; Snd.play('roar', { vol: 0.55, pitch: 1.1 });
          this.targetX = clamp(p.x, 120, G.room.w - 120);
          G.fx(fxWarnZone(this.targetX, 230, 0.95, '#ff5020', GROUND, 320));
        } else {
          this.state = 'rainWindup'; Snd.play('roar', { vol: 0.7 });
          FX.groundRing(this.x, '#ff6020', 220, 0.5);
        }
      }
    } else if (this.state === 'punchWindup') {
      this.dir = dx >= 0 ? 1 : -1;
      this.vx *= Math.exp(-10 * dt);
      if (this.stateT >= 0.36) {
        this.state = 'punchHit'; this.stateT = 0;
        this.vx = this.dir * 520;
        Snd.play('swingHeavy');
        G.attack({
          team: 'enemy', owner: this, ox: this.dir * 65, oy: -68, w: 135, h: 120,
          dmg: 1.1, kb: 260, up: -160, stun: 0.35, life: 0.14, color: '#ff7020',
        });
        G.fx(fxCrescent(this.x, this.y - 68, 125, -1.5, 1.0, this.dir, '#ff7020', 0.2, 0.35));
      }
    } else if (this.state === 'punchHit') {
      this.vx *= Math.exp(-7 * dt);
      if (this.stateT >= 0.26) {
        this.comboStep++;
        if (this.comboStep < 3) { this.state = 'punchWindup'; this.stateT = 0.12; }
        else { this.state = 'idle'; this.cd = 1.0; }
      }
    } else if (this.state === 'leapWindup') {
      this.vx *= Math.exp(-10 * dt);
      if (this.stateT >= 0.35) {
        this.state = 'leaping'; this.stateT = 0;
        this.vy = -1050; this.grounded = false;
        this.vx = (this.targetX - this.x) / 0.8;
        Snd.play('jump');
      }
    } else if (this.state === 'leaping') {
      if (this.grounded && this.stateT > 0.15) {
        Snd.play('boom'); G.addShake(18);
        FX.explosion(this.x, GROUND - 20, 130, '#ff6820', '#fff0a0');
        FX.groundRing(this.x, '#ff8030', 260, 0.5);
        FX.debris(this.x, GROUND, 14, '#3a2216');
        G.attack({
          team: 'enemy', owner: this, x: this.x, y: GROUND - 65, w: 250, h: 145,
          dmg: 1.45, kb: 420, up: -380, stun: 0.5, life: 0.15, color: '#ff6820',
        });
        this.state = 'idle'; this.cd = 1.2; this.vx = 0;
      }
    } else if (this.state === 'rainWindup') {
      this.vx *= Math.exp(-10 * dt);
      if (this.stateT >= 0.65) {
        for (let i = 0; i < 6; i++) {
          G.after(i * 0.16, () => {
            const mx = clamp(p.x + rand(-280, 280), 90, G.room.w - 90);
            G.fx(fxWarnZone(mx, 110, 0.55, '#ff5020', GROUND, 480));
            G.after(0.55, () => {
              Snd.play('boom', { vol: 0.65 });
              FX.explosion(mx, GROUND - 20, 85, '#ff6820', '#ffffff');
              G.attack({ team: 'enemy', owner: this, x: mx, y: GROUND - 60, w: 120, h: 160, dmg: 1.15, kb: 220, up: -280, stun: 0.35, life: 0.14, color: '#ff6820' });
            });
          });
        }
        this.state = 'idle'; this.cd = 1.6;
      }
    }
    this.stepPhys(dt, G);
  }
  draw(ctx) {
    ctx.save(); ctx.translate(this.x, this.y); ctx.scale(this.dir, 1);
    const breath = Math.sin(this.t * 4) * 3;
    const isWind = this.state.includes('Windup');
    const isHit = this.state === 'punchHit';
    if (this.phase === 2) drawAwakenAura(ctx, 0, 0, '#ff5018', this.t, 1.3);

    // Phase 2 spectral extra arms
    if (this.phase === 2) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (const s of [-1, 1]) {
        const ang = Math.sin(this.t * 5 + s) * 0.3;
        ctx.strokeStyle = rgba('#ff6820', 0.55); ctx.lineWidth = 14; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(-18, -95); ctx.lineTo(-42 + s * 10, -135 + ang * 20); ctx.lineTo(-15 + s * 22, -165); ctx.stroke();
      }
      ctx.restore();
    }

    // rim light pass
    for (const pass of ['rim', 'body']) {
      ctx.save();
      if (pass === 'rim') { ctx.translate(-2.5, -2.5); ctx.fillStyle = '#ff8a3a'; ctx.strokeStyle = '#ff8a3a'; }
      else { ctx.fillStyle = '#1b0d0a'; ctx.strokeStyle = '#1b0d0a'; }
      // legs
      ctx.lineWidth = 22; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-18, -52); ctx.lineTo(-28, -4); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(16, -52); ctx.lineTo(24, -4); ctx.stroke();
      // hulking torso
      ctx.beginPath();
      ctx.moveTo(-36, -112 + breath);
      ctx.quadraticCurveTo(0, -132 + breath, 38, -110 + breath);
      ctx.lineTo(26, -48); ctx.lineTo(-28, -48); ctx.closePath(); ctx.fill();
      // giant shoulders & arms
      const armReach = isHit ? 64 : isWind ? -24 : 26;
      const armY = isHit ? -74 : isWind ? -136 : -62 + breath;
      ctx.lineWidth = 24;
      ctx.beginPath(); ctx.moveTo(-26, -104 + breath); ctx.lineTo(-34, -48); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(28, -104 + breath); ctx.lineTo(armReach, armY); ctx.stroke();
      // massive gauntlet fist
      ctx.beginPath(); ctx.arc(armReach, armY, 19, 0, TAU); ctx.fill();
      // horned ape head + fiery mane
      ctx.beginPath(); ctx.arc(14, -128 + breath, 22, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.ellipse(26, -120 + breath, 12, 9, 0.2, 0, TAU); ctx.fill();
      if (pass === 'body') {
        // glowing molten fissures across armor & fist
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = rgba('#ff6a18', 0.85); ctx.lineWidth = 2.6;
        ctx.beginPath(); ctx.moveTo(-20, -100 + breath); ctx.lineTo(-4, -84 + breath); ctx.lineTo(12, -92 + breath); ctx.stroke();
        ctx.beginPath(); ctx.arc(armReach, armY, 12, 0, TAU); ctx.stroke();
        // broken golden crown shard
        ctx.strokeStyle = '#ffd050'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(14, -128 + breath, 22, -2.5, -0.7); ctx.stroke();
        // eyes
        drawGlow(ctx, 25, -131 + breath, 16, '#ff4818', 0.9);
        ctx.fillStyle = '#fff0a0'; ctx.beginPath(); ctx.ellipse(25, -131 + breath, 4.5, 2, -0.2, 0, TAU); ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
      }
      ctx.restore();
    }
    if (this.stunT > 0) {
      ctx.fillStyle = '#ffd868'; ctx.font = `24px ${FONT_BRUSH}`; ctx.textAlign = 'center';
      ctx.fillText('眩', Math.sin(this.t * 8) * 18, -168);
    }
    if (this.flash > 0) drawGlow(ctx, 0, -80, 120, '#ffffff', this.flash);
    ctx.restore();
  }
}

/* ============================================================
 *  BOSS 2: 玄渊骨蛟 · 沉沙冥龙 (18-Segment Articulated Serpent!)
 * ============================================================ */
class BossDragon extends BaseBoss {
  constructor(x, scale) {
    super('dragon', '玄渊骨蛟', '沉沙冥龙', x, GROUND - 180, 2900, 36, 20, 240, '#40f0dc', scale);
    this.w = 110; this.h = 110;
    this.trail = [];
    for (let i = 0; i < 95; i++) this.trail.push({ x: this.x + i * 7, y: this.y });
    this.jawOpen = 0;
    this.submerged = false;
  }
  rect() { return { x: this.x - 52, y: this.y - 52, w: 104, h: 104 }; }
  update(dt, G) {
    this.t += dt;
    if (this.flash > 0) this.flash = Math.max(0, this.flash - dt * 6);
    if (this.phase === 1 && this.hp < this.maxHp * 0.5) {
      this.phase = 2; Snd.play('roar'); G.addShake(14);
      Floaters.add(this.x, this.y - 80, '冥蛟怒啸!', { color: '#58ffec', size: 28, font: FONT_BRUSH });
    }
    const p = G.player; if (!p || p.dead) return;
    if (this.stunT > 0) {
      this.stunT -= dt;
      this.y = damp(this.y, GROUND - 70, 5, dt);
      if (this.stunT <= 0) { this.state = 'idle'; this.cd = 0.8; }
      return;
    }

    this.stateT += dt;
    this.jawOpen = damp(this.jawOpen, (this.state === 'spitWindup' || this.state === 'spit') ? 1 : 0.15, 8, dt);

    if (this.state === 'idle') {
      // figure-8 menacing hover above player
      const tx = clamp(p.x + Math.cos(this.t * 1.1) * 320, 140, G.room.w - 140);
      const ty = GROUND - 230 + Math.sin(this.t * 2.1) * 75;
      this.vx = damp(this.vx, (tx - this.x) * 2.8, 4, dt);
      this.vy = damp(this.vy, (ty - this.y) * 2.8, 4, dt);
      this.x += this.vx * dt; this.y += this.vy * dt;
      this.dir = p.x >= this.x ? 1 : -1;
      this.cd -= dt * (this.phase === 2 ? 1.35 : 1);
      if (this.cd <= 0) {
        const ch = (this.patternIdx++) % 3;
        this.stateT = 0;
        if (ch === 0) {
          this.state = 'spitWindup'; Snd.play('warn');
        } else if (ch === 1) {
          this.state = 'diveStart'; this.targetX = clamp(p.x, 150, G.room.w - 150);
          Snd.play('roar', { pitch: 0.9 });
          G.fx(fxWarnZone(this.targetX, 170, 1.0, '#40f0dc', GROUND, 340));
        } else {
          this.state = 'vortexCast'; Snd.play('water');
        }
      }
    } else if (this.state === 'spitWindup') {
      this.dir = p.x >= this.x ? 1 : -1;
      if (this.stateT >= 0.55) {
        this.state = 'spit'; this.stateT = 0;
        Snd.play('fire', { pitch: 1.25 });
        const baseA = Math.atan2((p.y - 45) - this.y, p.x - this.x);
        const count = this.phase === 2 ? 5 : 3;
        for (let i = 0; i < count; i++) {
          const a = baseA + (i - (count - 1) / 2) * 0.24;
          G.attack({
            team: 'enemy', owner: this, x: this.x, y: this.y, w: 28, h: 28,
            vx: Math.cos(a) * 430, vy: Math.sin(a) * 430,
            dmg: 1.0, kb: 180, stun: 0.25, life: 2.4, pierce: false, color: '#40f0dc',
          });
        }
      }
    } else if (this.state === 'spit') {
      if (this.stateT >= 0.45) { this.state = 'idle'; this.cd = 1.1; }
    } else if (this.state === 'diveStart') {
      // dive down into sand then burst up at targetX!
      this.vx = damp(this.vx, 0, 5, dt);
      this.vy = damp(this.vy, 720, 6, dt);
      this.x += this.vx * dt; this.y += this.vy * dt;
      if (this.y > GROUND + 90) {
        this.submerged = true;
        this.x = this.targetX;
        this.state = 'erupt'; this.stateT = 0;
      }
    } else if (this.state === 'erupt') {
      if (this.stateT > 0.32) {
        if (this.submerged) {
          this.submerged = false;
          this.vy = -1020;
          Snd.play('boom'); Snd.play('water'); G.addShake(15);
          FX.groundRing(this.x, '#40f0dc', 200, 0.5);
          G.attack({ team: 'enemy', owner: this, x: this.x, y: GROUND - 110, w: 145, h: 240, dmg: 1.35, kb: 320, up: -460, stun: 0.45, life: 0.25, color: '#40f0dc' });
        }
        this.vy += 1700 * dt;
        this.y += this.vy * dt;
        this.x += this.dir * 260 * dt;
        if (this.stateT > 1.35) { this.state = 'idle'; this.cd = 1.0; }
      }
    } else if (this.state === 'vortexCast') {
      if (this.stateT >= 0.5) {
        for (const ox of [-220, 220]) {
          const vxPos = clamp(p.x + ox, 100, G.room.w - 100);
          G.attack({
            team: 'enemy', owner: this, x: vxPos, y: GROUND - 90, w: 120, h: 190,
            dmg: 0.48, kb: 40, up: -80, stun: 0.15, life: 2.5, rehit: 0.5, pierce: true, color: '#40f0dc',
            draw(ctx) {
              ctx.save(); ctx.globalCompositeOperation = 'lighter';
              const a = Math.min(1, (this.life - this.t) * 2);
              for (let i = 0; i < 5; i++) {
                ctx.strokeStyle = rgba('#40f0dc', a * 0.65); ctx.lineWidth = 3;
                ctx.beginPath(); ctx.ellipse(this.x, GROUND - 15 - i * 34, 24 + i * 9, 10, 0, this.t * 10 + i, this.t * 10 + i + 4.2); ctx.stroke();
              }
              ctx.restore();
            },
          });
        }
        this.state = 'idle'; this.cd = 1.4;
      }
    }

    // record path for trailing body segments
    const head = this.trail[0];
    if (dist(this.x, this.y, head.x, head.y) > 4) {
      this.trail.unshift({ x: this.x, y: this.y });
      if (this.trail.length > 95) this.trail.pop();
    }
    // contact sweep damage on head during dive/erupt
    if ((this.state === 'diveStart' || this.state === 'erupt') && dist(this.x, this.y, p.x, p.y - 45) < 62 && p.invuln <= 0) {
      p.takeHit(this.atk, sign(p.x - this.x) * 280, -260, 0.35, '#40f0dc', G);
    }
  }
  draw(ctx) {
    // draw 18 trailing spine/rib segments back-to-front
    for (let i = 17; i >= 1; i--) {
      const pt = this.trail[Math.min(this.trail.length - 1, i * 4)];
      if (!pt || pt.y > GROUND + 25) continue;
      const r = 30 * (1 - i / 21) + 7;
      ctx.save(); ctx.translate(pt.x, pt.y);
      const prev = this.trail[Math.max(0, i * 4 - 2)] || pt;
      ctx.rotate(Math.atan2(prev.y - pt.y, prev.x - pt.x));
      ctx.globalCompositeOperation = 'lighter';
      drawGlow(ctx, 0, 0, r * 1.4, '#40f0dc', 0.24);
      ctx.globalCompositeOperation = 'source-over';
      // bone rib segment
      ctx.fillStyle = '#0f2024';
      ctx.beginPath(); ctx.ellipse(0, 0, r * 0.9, r * 0.65, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#d4ccb4'; ctx.lineWidth = 2.6;
      ctx.beginPath(); ctx.arc(0, 0, r * 0.72, -1.2, 1.2); ctx.stroke();
      // dorsal spectral spine spike
      ctx.fillStyle = '#40f0dc';
      ctx.beginPath(); ctx.moveTo(-4, -r * 0.6); ctx.lineTo(0, -r * 1.35); ctx.lineTo(6, -r * 0.6); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
    if (this.y > GROUND + 30) return;
    // sculpted horned dragon skull
    ctx.save(); ctx.translate(this.x, this.y);
    const prev = this.trail[2] || { x: this.x - this.dir * 10, y: this.y };
    const ang = Math.atan2(this.y - prev.y, this.x - prev.x);
    ctx.rotate(ang);
    if (Math.cos(ang) < 0) ctx.scale(1, -1);
    ctx.globalCompositeOperation = 'lighter';
    drawGlow(ctx, 0, 0, 68, '#40f0dc', 0.45);
    ctx.globalCompositeOperation = 'source-over';
    // lower hinged jaw
    ctx.save(); ctx.rotate(this.jawOpen * 0.55);
    ctx.fillStyle = '#d8d0b8';
    ctx.beginPath(); ctx.moveTo(-10, 6); ctx.lineTo(42, 10); ctx.lineTo(32, 22); ctx.lineTo(-14, 18); ctx.closePath(); ctx.fill();
    ctx.restore();
    // upper skull + fangs + antlers
    ctx.fillStyle = '#e6dec6';
    ctx.beginPath(); ctx.moveTo(-26, -16); ctx.lineTo(18, -22); ctx.lineTo(52, -2); ctx.lineTo(36, 8); ctx.lineTo(-22, 8); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#38c8b8'; ctx.lineWidth = 3.5;
    ctx.beginPath(); ctx.moveTo(-8, -16); ctx.quadraticCurveTo(-36, -48, -68, -42); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-22, -28); ctx.lineTo(-14, -44); ctx.stroke();
    // glowing cyan spirit socket
    ctx.globalCompositeOperation = 'lighter';
    drawGlow(ctx, 18, -7, 18, '#40f0dc', 0.95);
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(18, -7, 4.5, 0, TAU); ctx.fill();
    if (this.flash > 0) drawGlow(ctx, 0, 0, 80, '#ffffff', this.flash);
    ctx.restore();
  }
}

/* ============================================================
 *  BOSS 3: 魔·牛魔王 · 焚天平天圣
 * ============================================================ */
class BossBull extends BaseBoss {
  constructor(x, scale) {
    super('bull', '魔·牛魔王', '焚天平天圣', x, GROUND, 3500, 40, 24, 260, '#ff4818', scale);
    this.w = 115; this.h = 168;
  }
  update(dt, G) {
    this.t += dt;
    if (this.flash > 0) this.flash = Math.max(0, this.flash - dt * 6);
    if (this.phase === 1 && this.hp < this.maxHp * 0.5) {
      this.phase = 2; Snd.play('roar'); G.addShake(20); G.addFlash('#ff3810', 0.4, 0.3);
      Floaters.add(this.x, this.y - 185, '平天魔尊·狂化!', { color: '#ff5820', size: 30, font: FONT_BRUSH });
    }
    const p = G.player; if (!p || p.dead) return;
    if (this.stunT > 0) {
      this.stunT -= dt; this.vx *= Math.exp(-8 * dt); this.stepPhys(dt, G);
      if (this.stunT <= 0) { this.state = 'idle'; this.cd = 0.8; }
      return;
    }

    const dx = p.x - this.x;
    this.stateT += dt;
    if (this.state === 'idle') {
      this.dir = dx >= 0 ? 1 : -1;
      if (Math.abs(dx) > 160) this.vx = damp(this.vx, this.dir * 160, 5, dt);
      else this.vx = damp(this.vx, 0, 7, dt);
      this.cd -= dt * (this.phase === 2 ? 1.3 : 1);
      if (this.cd <= 0) {
        const ch = (this.patternIdx++) % 3;
        this.stateT = 0;
        if (ch === 0) {
          this.state = 'chargeWindup'; this.dir = dx >= 0 ? 1 : -1; Snd.play('roar', { pitch: 0.75 });
          G.fx(fxLine(this.x, GROUND - 55, this.dir > 0 ? G.room.w - 60 : 60, GROUND - 55, 0.65, '#ff4020', 4));
        } else if (ch === 1) {
          this.state = 'slamWindup'; Snd.play('warn');
        } else {
          this.state = 'summon'; Snd.play('roar');
          FX.groundRing(this.x, '#ff4818', 240, 0.5);
          if (G.enemies.length < 4) {
            G.spawnEnemy('imp', clamp(this.x - 160, 80, G.room.w - 80), GROUND);
            G.spawnEnemy('crow', clamp(this.x + 160, 80, G.room.w - 80), GROUND - 180);
          }
          if (this.phase === 2) {
            for (let i = 0; i < 6; i++) {
              G.after(i * 0.16, () => {
                const mx = clamp(p.x + rand(-260, 260), 90, G.room.w - 90);
                G.fx(fxWarnZone(mx, 110, 0.55, '#ff3818', GROUND, 480));
                G.after(0.55, () => {
                  Snd.play('boom', { vol: 0.6 }); FX.explosion(mx, GROUND - 20, 85, '#ff4818', '#fff0a0');
                  G.attack({ team: 'enemy', owner: this, x: mx, y: GROUND - 60, w: 115, h: 160, dmg: 1.15, kb: 220, up: -260, stun: 0.35, life: 0.14, color: '#ff4818' });
                });
              });
            }
          }
          this.state = 'idle'; this.cd = 1.5;
        }
      }
    } else if (this.state === 'chargeWindup') {
      this.vx *= Math.exp(-10 * dt);
      if (this.stateT >= 0.68) {
        this.state = 'charging'; this.stateT = 0;
        Snd.play('dash');
      }
    } else if (this.state === 'charging') {
      this.vx = this.dir * (this.phase === 2 ? 780 : 660);
      if (chance(0.5)) FX.dust(this.x, GROUND, 2, '#ff6820', 1.0);
      if (dist(this.x, GROUND - 65, p.x, p.y - 45) < 76 && p.invuln <= 0) {
        p.takeHit(this.atk * 1.35, this.dir * 450, -320, 0.5, '#ff4818', G);
      }
      // Hit wall -> stunned!
      if ((this.dir < 0 && this.x <= 82) || (this.dir > 0 && this.x >= G.room.w - 82)) {
        Snd.play('boom'); G.addShake(20);
        FX.debris(this.x, GROUND, 12, '#3a2216');
        this.stunT = 1.8; this.state = 'stun'; this.vx = -this.dir * 180;
        Floaters.add(this.x, this.y - 175, '撞壁眩晕!', { color: '#ffd868', size: 28, font: FONT_BRUSH });
      } else if (this.stateT > 1.8) {
        this.state = 'idle'; this.cd = 1.1; this.vx = 0;
      }
    } else if (this.state === 'slamWindup') {
      this.vx *= Math.exp(-10 * dt);
      if (this.stateT >= 0.55) {
        Snd.play('boom'); G.addShake(16);
        FX.groundRing(this.x, '#ff5018', 260, 0.5);
        for (const s of [-1, 1]) {
          for (let i = 1; i <= 3; i++) {
            G.after(i * 0.14, () => {
              const px = clamp(this.x + s * i * 140, 70, G.room.w - 70);
              FX.explosion(px, GROUND - 40, 75, '#ff4818', '#ffe888');
              G.attack({ team: 'enemy', owner: this, x: px, y: GROUND - 90, w: 86, h: 190, dmg: 1.15, kb: s * 220, up: -340, stun: 0.35, life: 0.18, color: '#ff5018' });
            });
          }
        }
        this.state = 'idle'; this.cd = 1.3;
      }
    }
    this.stepPhys(dt, G);
  }
  draw(ctx) {
    ctx.save(); ctx.translate(this.x, this.y); ctx.scale(this.dir, 1);
    const breath = Math.sin(this.t * 3.5) * 3;
    if (this.phase === 2) drawAwakenAura(ctx, 0, 0, '#ff3810', this.t, 1.4);
    for (const pass of ['rim', 'body']) {
      ctx.save();
      if (pass === 'rim') { ctx.translate(-2.5, -2.5); ctx.fillStyle = '#ff6828'; ctx.strokeStyle = '#ff6828'; }
      else { ctx.fillStyle = '#180c0c'; ctx.strokeStyle = '#180c0c'; }
      // armored legs
      ctx.lineWidth = 24; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-22, -55); ctx.lineTo(-30, -4); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(20, -55); ctx.lineTo(28, -4); ctx.stroke();
      // colossal bull torso + cape
      ctx.beginPath(); ctx.moveTo(-42, -124 + breath); ctx.lineTo(44, -124 + breath); ctx.lineTo(30, -50); ctx.lineTo(-30, -50); ctx.closePath(); ctx.fill();
      // bull head & giant curved horns
      ctx.beginPath(); ctx.arc(16, -138 + breath, 24, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.ellipse(32, -130 + breath, 16, 11, 0.2, 0, TAU); ctx.fill();
      ctx.lineWidth = 8;
      ctx.beginPath(); ctx.moveTo(8, -152 + breath); ctx.quadraticCurveTo(-24, -186 + breath, 4, -200 + breath); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(24, -152 + breath); ctx.quadraticCurveTo(58, -186 + breath, 36, -200 + breath); ctx.stroke();
      if (pass === 'body') {
        // giant battle axe / iron rod
        ctx.strokeStyle = '#2e221e'; ctx.lineWidth = 9;
        ctx.beginPath(); ctx.moveTo(-25, -45); ctx.lineTo(54, -148 + breath); ctx.stroke();
        ctx.fillStyle = '#5a2218';
        ctx.beginPath(); ctx.arc(46, -138 + breath, 26, -1.2, 1.4); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#ff7028'; ctx.lineWidth = 2; ctx.stroke();
        // brass nose ring
        ctx.strokeStyle = '#ffd050'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(44, -124 + breath, 7, 0, TAU); ctx.stroke();
        // glowing demon eyes
        ctx.globalCompositeOperation = 'lighter';
        drawGlow(ctx, 26, -142 + breath, 18, '#ff3810', 0.95);
        ctx.fillStyle = '#ffd868'; ctx.beginPath(); ctx.arc(26, -142 + breath, 4, 0, TAU); ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
      }
      ctx.restore();
    }
    if (this.flash > 0) drawGlow(ctx, 0, -90, 130, '#ffffff', this.flash);
    ctx.restore();
  }
}

/* ============================================================
 *  BOSS 4: 二郎显圣·堕 · 天罚真君
 * ============================================================ */
class BossErlang extends BaseBoss {
  constructor(x, scale) {
    super('erlang', '二郎显圣·堕', '天罚真君', x, GROUND, 4200, 44, 24, 240, '#c890ff', scale);
    this.w = 60; this.h = 128;
    this.pose = POSES.idle.slice();
    this.eyeCharge = 0;
  }
  update(dt, G) {
    this.t += dt;
    if (this.flash > 0) this.flash = Math.max(0, this.flash - dt * 6);
    if (this.phase === 1 && this.hp < this.maxHp * 0.55) {
      this.phase = 2; Snd.play('thunder'); G.addShake(16); G.addFlash('#d098ff', 0.35, 0.25);
      Floaters.add(this.x, this.y - 140, '天眼全开·二郎真身!', { color: '#e0b0ff', size: 28, font: FONT_BRUSH });
    }
    const p = G.player; if (!p || p.dead) return;
    if (this.stunT > 0) {
      this.stunT -= dt; this.vx *= Math.exp(-8 * dt); this.stepPhys(dt, G);
      poseLerp(this.pose, POSES.hurt, 1 - Math.exp(-16 * dt), this.pose);
      if (this.stunT <= 0) { this.state = 'idle'; this.cd = 0.7; }
      return;
    }
    const dx = p.x - this.x;
    this.stateT += dt;
    this.eyeCharge = damp(this.eyeCharge, this.state === 'laserAim' ? 1 : 0, 8, dt);

    if (this.state === 'idle') {
      this.dir = dx >= 0 ? 1 : -1;
      if (Math.abs(dx) > 180) this.vx = damp(this.vx, this.dir * 260, 7, dt);
      else this.vx = damp(this.vx, 0, 8, dt);
      this.cd -= dt * (this.phase === 2 ? 1.35 : 1);
      poseLerp(this.pose, POSES.idle, 1 - Math.exp(-10 * dt), this.pose);
      if (this.cd <= 0) {
        const ch = (this.patternIdx++) % (this.phase === 2 ? 4 : 3);
        this.stateT = 0;
        if (ch === 0) {
          // Teleport behind player & 3-slash!
          FX.inkBurst(this.x, this.y - 50, 10, '#a060ff', 14);
          this.x = clamp(p.x - p.dir * 130, 80, G.room.w - 80);
          this.dir = p.x >= this.x ? 1 : -1;
          FX.inkBurst(this.x, this.y - 50, 10, '#ffd868', 14);
          this.state = 'slashWind'; this.slashCount = 0; Snd.play('dash');
        } else if (ch === 1) {
          this.state = 'laserAim';
          this.dir = p.x >= this.x ? 1 : -1;
          this.aimA = Math.atan2((p.y - 45) - (this.y - 96), p.x - this.x);
          Snd.play('warn');
          G.fx(fxLine(this.x, this.y - 96, this.x + Math.cos(this.aimA) * 1100, this.y - 96 + Math.sin(this.aimA) * 1100, 0.65, '#ff4090', 3));
        } else if (ch === 2) {
          // Summon 哮天犬 shadow hound dash!
          this.state = 'hound'; Snd.play('roar', { pitch: 1.4, vol: 0.6 });
          const hx = this.x + this.dir * 45, hd = this.dir;
          G.attack({
            team: 'enemy', owner: this, x: hx, y: GROUND - 35, w: 80, h: 55,
            vx: hd * 680, dmg: 1.15, kb: hd * 260, up: -220, stun: 0.35, life: 1.8, pierce: true, color: '#c870ff',
            draw(ctx) {
              ctx.save(); ctx.translate(this.x, this.y); ctx.scale(hd, 1);
              ctx.globalCompositeOperation = 'lighter';
              drawGlow(ctx, 0, 0, 48, '#b860ff', 0.6);
              ctx.fillStyle = '#e0c0ff';
              ctx.beginPath(); ctx.ellipse(0, 0, 32, 14, 0, 0, TAU); ctx.fill();
              ctx.beginPath(); ctx.moveTo(22, -8); ctx.lineTo(42, -2); ctx.lineTo(24, 8); ctx.closePath(); ctx.fill();
              ctx.restore();
            },
          });
          this.state = 'idle'; this.cd = 1.0;
        } else {
          // Phase 2 thunder halberd rain!
          this.state = 'thunderRain'; Snd.play('thunder');
          for (let i = 0; i < 5; i++) {
            G.after(i * 0.14, () => {
              const tx = clamp(p.x + (i - 2) * 140, 80, G.room.w - 80);
              G.fx(fxWarnZone(tx, 90, 0.48, '#ffd060', GROUND, 460));
              G.after(0.48, () => {
                Snd.play('thunder', { vol: 0.55 });
                G.fx(fxLine(tx, 0, tx, GROUND, 0.25, '#fff4a0', 12));
                FX.explosion(tx, GROUND - 20, 70, '#ffd060', '#ffffff');
                G.attack({ team: 'enemy', owner: this, x: tx, y: GROUND - 100, w: 92, h: 240, dmg: 1.2, kb: 180, up: -260, stun: 0.35, life: 0.15, color: '#ffd060' });
              });
            });
          }
        }
      }
    } else if (this.state === 'slashWind') {
      poseLerp(this.pose, P(-0.2, 0, 2.5, -0.2, -0.4, 0.4, 0.4, -0.3, -0.4, -0.2, 3.4), 1 - Math.exp(-22 * dt), this.pose);
      if (this.stateT >= 0.28) {
        this.state = 'slashGo'; this.stateT = 0;
        this.vx = this.dir * 380;
        Snd.play('swingHeavy');
        G.fx(fxCrescent(this.x, this.y - 60, 145, -1.7, 1.0, this.dir, '#d898ff', 0.22, 0.35));
        G.attack({ team: 'enemy', owner: this, ox: this.dir * 75, oy: -60, w: 145, h: 115, dmg: 1.05, kb: 220, up: -140, stun: 0.32, life: 0.14, color: '#d898ff' });
      }
    } else if (this.state === 'slashGo') {
      poseLerp(this.pose, P(0.45, 0.1, 1.1, 0.1, -0.7, 0.4, 0.7, -0.6, -0.5, -0.2, 0.7), 1 - Math.exp(-24 * dt), this.pose);
      this.vx *= Math.exp(-8 * dt);
      if (this.stateT >= 0.22) {
        this.slashCount++;
        if (this.slashCount < (this.phase === 2 ? 3 : 2)) { this.state = 'slashWind'; this.stateT = 0; this.dir = p.x >= this.x ? 1 : -1; }
        else { this.state = 'idle'; this.cd = 1.0; }
      }
    } else if (this.state === 'laserAim') {
      poseLerp(this.pose, POSES.cast, 1 - Math.exp(-12 * dt), this.pose);
      if (this.stateT >= 0.65) {
        Snd.play('laser'); G.addShake(12);
        const sx = this.x, sy = this.y - 96, ang = this.aimA;
        // fire sweeping laser hitboxes along the ray
        for (let k = 1; k <= 8; k++) {
          const lx = sx + Math.cos(ang) * k * 120, ly = sy + Math.sin(ang) * k * 120;
          G.attack({ team: 'enemy', owner: this, x: lx, y: ly, w: 110, h: 60, dmg: 1.4, kb: 280, up: -200, stun: 0.4, life: 0.25, color: '#ff48a8' });
        }
        G.fx({
          layer: 'front', t: 0, life: 0.38,
          update(dt2) { this.t += dt2; return this.t < this.life; },
          draw(ctx) {
            const k = 1 - this.t / this.life;
            ctx.save(); ctx.globalCompositeOperation = 'lighter';
            ctx.strokeStyle = rgba('#ff48a8', 0.8 * k); ctx.lineWidth = 34 * k;
            ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + Math.cos(ang) * 1100, sy + Math.sin(ang) * 1100); ctx.stroke();
            ctx.strokeStyle = rgba('#ffffff', k); ctx.lineWidth = 10 * k; ctx.stroke();
            ctx.restore();
          },
        });
        this.state = 'idle'; this.cd = 1.1;
      }
    } else if (this.state === 'thunderRain') {
      if (this.stateT >= 0.7) { this.state = 'idle'; this.cd = 1.1; }
    }
    this.stepPhys(dt, G);
  }
  draw(ctx) {
    // golden-violet celestial War God using upgraded rig + glowing Third Eye & floating halo
    ctx.save();
    if (this.phase === 2) drawAwakenAura(ctx, this.x, this.y, '#d088ff', this.t, 1.1);
    const S = Object.assign({}, STYLES.soldier, {
      scale: 1.32, body: '#261a3c', dark: '#140c22', halo: '#e0b0ff', eye: '#ffd868', eyeGlow: '#d070ff',
      weapon: { type: 'halberd', len: 142, grip: 0.38, width: 3.8, color: '#f8d878', cap: '#d070ff', glow: '#d898ff' },
    });
    drawRig(ctx, this.x, this.y, this.dir, this.pose, S, { t: this.t, grounded: this.grounded, rim: '#d898ff', flash: this.flash });
    // radiant Third Eye on forehead!
    const J = solveRig(this.pose, S, this.grounded);
    const ex = this.x + this.dir * (J.head.x + 8) * S.scale;
    const ey = this.y + (J.head.y - 6) * S.scale;
    ctx.globalCompositeOperation = 'lighter';
    drawGlow(ctx, ex, ey, 16 + this.eyeCharge * 28, '#ff48a8', 0.85);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.ellipse(ex, ey, 2.5 + this.eyeCharge * 3, 4.5 + this.eyeCharge * 2, 0, 0, TAU); ctx.fill();
    ctx.restore();
  }
}

/* ============================================================
 *  BOSS 5 (FINAL): 无相梦主·太初 · 归墟万象之渊
 * ============================================================ */
class BossDreamlord extends BaseBoss {
  constructor(x, scale) {
    super('dreamlord', '无相梦主·太初', '归墟万象之渊', x, GROUND - 210, 5600, 48, 26, 300, '#c870ff', scale);
    this.w = 130; this.h = 160;
    this.homeX = x;
    this.handL = { x: x - 180, y: GROUND - 150, rot: 0, open: 1 };
    this.handR = { x: x + 180, y: GROUND - 150, rot: 0, open: 1 };
    this.shadeSpawned = false;
    this.enraged20 = false;
  }
  rect() { return { x: this.x - 65, y: this.y - 80, w: 130, h: 160 }; }
  update(dt, G) {
    this.t += dt;
    if (this.flash > 0) this.flash = Math.max(0, this.flash - dt * 6);
    const p = G.player; if (!p || p.dead) return;

    if (this.phase === 1 && this.hp < this.maxHp * 0.5 && !this.shadeSpawned) {
      this.phase = 2; this.shadeSpawned = true;
      Snd.play('roar'); Snd.play('gong'); G.addShake(20); G.addFlash('#b860ff', 0.45, 0.35);
      Floaters.add(this.x, this.y - 105, '心魔映照·梦影降临!', { color: '#e098ff', size: 30, font: FONT_BRUSH });
      G.spawnEnemy('shade', clamp(this.x + (p.x > this.x ? -180 : 180), 90, G.room.w - 90), GROUND);
    }
    if (!this.enraged20 && this.hp < this.maxHp * 0.22) {
      this.enraged20 = true;
      Snd.play('roar'); G.addShake(24);
      Floaters.add(this.x, this.y - 125, '归墟终劫·万象俱焚!', { color: '#ff70d0', size: 32, font: FONT_BRUSH });
    }

    if (this.stunT > 0) {
      this.stunT -= dt;
      this.y = damp(this.y, GROUND - 100, 6, dt);
      this.handL.y = damp(this.handL.y, GROUND - 40, 6, dt);
      this.handR.y = damp(this.handR.y, GROUND - 40, 6, dt);
      if (this.stunT <= 0) { this.state = 'idle'; this.cd = 0.8; }
      return;
    }

    this.stateT += dt;
    const speedMul = this.enraged20 ? 1.45 : this.phase === 2 ? 1.2 : 1;

    if (this.state === 'idle') {
      const tx = this.homeX + Math.sin(this.t * 0.7) * 140;
      const ty = GROUND - 245 + Math.sin(this.t * 1.6) * 24;
      this.x = damp(this.x, tx, 3, dt);
      this.y = damp(this.y, ty, 3, dt);
      this.handL.x = damp(this.handL.x, this.x - 190, 5, dt);
      this.handL.y = damp(this.handL.y, this.y + 60 + Math.sin(this.t * 2) * 20, 5, dt);
      this.handR.x = damp(this.handR.x, this.x + 190, 5, dt);
      this.handR.y = damp(this.handR.y, this.y + 60 + Math.cos(this.t * 2) * 20, 5, dt);

      this.cd -= dt * speedMul;
      if (this.cd <= 0) {
        const ch = (this.patternIdx++) % 4;
        this.stateT = 0;
        if (ch === 0) {
          this.state = 'palmSlam'; this.slamSide = p.x < this.x ? 'L' : 'R';
          this.targetX = clamp(p.x, 120, G.room.w - 120);
          G.fx(fxWarnZone(this.targetX, 175, 0.72, '#c870ff', GROUND, 420));
          Snd.play('warn');
        } else if (ch === 1) {
          this.state = 'handSweep'; this.sweepFromLeft = p.x > this.x;
          this.sweepX = this.sweepFromLeft ? 90 : G.room.w - 90;
          Snd.play('warn');
        } else if (ch === 2) {
          this.state = 'danmaku'; Snd.play('cast');
        } else {
          this.state = 'voidLasers';
          Snd.play('warn');
          G.fx(fxLine(this.x, this.y, p.x, GROUND, 0.7, '#ff60d0', 3));
          G.fx(fxLine(this.x, this.y, clamp(p.x - 280, 60, G.room.w - 60), GROUND, 0.7, '#b060ff', 3));
          G.fx(fxLine(this.x, this.y, clamp(p.x + 280, 60, G.room.w - 60), GROUND, 0.7, '#b060ff', 3));
          this.laserTargets = [p.x, clamp(p.x - 280, 60, G.room.w - 60), clamp(p.x + 280, 60, G.room.w - 60)];
        }
      }
    } else if (this.state === 'palmSlam') {
      const H = this.slamSide === 'L' ? this.handL : this.handR;
      if (this.stateT < 0.72) {
        H.x = damp(H.x, this.targetX, 10, dt);
        H.y = damp(H.y, 130, 8, dt);
      } else if (this.stateT < 0.9) {
        H.y = damp(H.y, GROUND - 25, 28, dt);
        if (!this.slamFired && H.y > GROUND - 55) {
          this.slamFired = true;
          Snd.play('boom'); G.addShake(18);
          FX.explosion(this.targetX, GROUND - 20, 120, '#c870ff', '#ffffff');
          FX.groundRing(this.targetX, '#e098ff', 240, 0.5);
          G.attack({ team: 'enemy', owner: this, x: this.targetX, y: GROUND - 65, w: 185, h: 150, dmg: 1.45, kb: 320, up: -320, stun: 0.45, life: 0.16, color: '#c870ff' });
        }
      } else if (this.stateT > 1.25) {
        this.slamFired = false; this.state = 'idle'; this.cd = 0.9;
      }
    } else if (this.state === 'handSweep') {
      const H = this.sweepFromLeft ? this.handL : this.handR;
      const dir = this.sweepFromLeft ? 1 : -1;
      if (this.stateT < 0.45) {
        H.x = damp(H.x, this.sweepX, 12, dt);
        H.y = damp(H.y, GROUND - 42, 10, dt);
      } else {
        H.x += dir * 820 * dt;
        H.y = GROUND - 42;
        if (dist(H.x, H.y, p.x, p.y - 36) < 72 && p.invuln <= 0) {
          p.takeHit(this.atk * 1.25, dir * 360, -300, 0.45, '#c870ff', G);
        }
        if ((dir > 0 && H.x >= G.room.w - 90) || (dir < 0 && H.x <= 90)) {
          this.state = 'idle'; this.cd = 1.0;
        }
      }
    } else if (this.state === 'danmaku') {
      if (this.stateT >= 0.45) {
        const rings = this.enraged20 ? 3 : 2;
        for (let r = 0; r < rings; r++) {
          G.after(r * 0.25, () => {
            if (this.dead) return;
            Snd.play('cast', { pitch: 1 + r * 0.1 });
            const cnt = 10;
            for (let i = 0; i < cnt; i++) {
              const a = (i / cnt) * TAU + r * 0.3;
              G.attack({
                team: 'enemy', owner: this, x: this.x, y: this.y, w: 26, h: 26,
                vx: Math.cos(a) * 340, vy: Math.sin(a) * 340,
                dmg: 0.95, kb: 160, stun: 0.22, life: 2.8, pierce: false, color: r % 2 ? '#ff68d0' : '#b868ff',
              });
            }
          });
        }
        this.state = 'idle'; this.cd = 1.3;
      }
    } else if (this.state === 'voidLasers') {
      if (this.stateT >= 0.72) {
        Snd.play('laser'); G.addShake(15);
        for (const tx of this.laserTargets) {
          const sx = this.x, sy = this.y;
          const ang = Math.atan2(GROUND - sy, tx - sx);
          for (let k = 1; k <= 6; k++) {
            G.attack({ team: 'enemy', owner: this, x: sx + Math.cos(ang) * k * 100, y: sy + Math.sin(ang) * k * 100, w: 68, h: 68, dmg: 1.3, kb: 220, up: -200, stun: 0.35, life: 0.25, color: '#ff68d0' });
          }
          G.fx({
            layer: 'front', t: 0, life: 0.4,
            update(dt2) { this.t += dt2; return this.t < this.life; },
            draw(ctx) {
              const k = 1 - this.t / this.life;
              ctx.save(); ctx.globalCompositeOperation = 'lighter';
              ctx.strokeStyle = rgba('#ff68d0', 0.8 * k); ctx.lineWidth = 36 * k;
              ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(tx, GROUND); ctx.stroke();
              ctx.strokeStyle = rgba('#ffffff', k); ctx.lineWidth = 10 * k; ctx.stroke();
              ctx.restore();
            },
          });
        }
        this.state = 'idle'; this.cd = 1.1;
      }
    }
  }
  draw(ctx) {
    // rotating cosmic void mandalas
    ctx.save(); ctx.translate(this.x, this.y);
    ctx.globalCompositeOperation = 'lighter';
    drawGlow(ctx, 0, 0, 220, this.enraged20 ? '#ff60c8' : '#9a40ff', 0.48);
    for (let i = 0; i < 3; i++) {
      const r = 82 + i * 38;
      ctx.save(); ctx.rotate(this.t * (0.4 + i * 0.25) * (i % 2 ? -1 : 1));
      ctx.strokeStyle = rgba(i === 2 ? '#ff80d8' : '#c890ff', 0.55 - i * 0.1);
      ctx.lineWidth = 2.5;
      ctx.setLineDash([18, 12]);
      ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }
    // central sculpted 无相面具 (Faceted Mask)
    ctx.globalCompositeOperation = 'source-over';
    const split = this.phase === 2 ? 7 : 0;
    for (const s of [-1, 1]) {
      ctx.save(); ctx.translate(s * split, 0);
      const mg = ctx.createLinearGradient(0, -68, 0, 68);
      mg.addColorStop(0, '#f4ebff'); mg.addColorStop(0.6, '#7a52a8'); mg.addColorStop(1, '#1a0a2e');
      ctx.fillStyle = mg;
      ctx.beginPath();
      ctx.moveTo(0, -72); ctx.lineTo(s * 54, -22); ctx.lineTo(s * 38, 52); ctx.lineTo(0, 74); ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#e8c8ff'; ctx.lineWidth = 2; ctx.stroke();
      // mask eye slit
      ctx.globalCompositeOperation = 'lighter';
      drawGlow(ctx, s * 22, -6, 16, '#ff70e0', 0.9);
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(s * 22, -6, 9, 3, s * -0.25, 0, TAU); ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
      ctx.restore();
    }
    if (this.phase === 2) {
      ctx.globalCompositeOperation = 'lighter';
      drawGlow(ctx, 0, 0, 32, '#ff68d0', 0.95);
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(0, 0, 9, 0, TAU); ctx.fill();
    }
    ctx.restore();

    // Two Giant Articulated Cosmic Hands
    for (const H of [this.handL, this.handR]) {
      ctx.save(); ctx.translate(H.x, H.y);
      ctx.globalCompositeOperation = 'lighter';
      drawGlow(ctx, 0, 0, 74, '#b060ff', 0.45);
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#1b0d2c';
      ctx.strokeStyle = '#d4a0ff'; ctx.lineWidth = 2.5;
      // palm + 4 fingers
      ctx.beginPath(); ctx.ellipse(0, 0, 36, 32, 0, 0, TAU); ctx.fill(); ctx.stroke();
      for (let f = -1.5; f <= 1.5; f += 1) {
        ctx.beginPath(); ctx.ellipse(f * 17, 30, 7, 18, f * 0.12, 0, TAU); ctx.fill(); ctx.stroke();
      }
      // palm glyph
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = '#f0c0ff'; ctx.font = `28px ${FONT_BRUSH}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('虚', 0, 0);
      ctx.restore();
    }
    if (this.flash > 0) drawGlow(ctx, this.x, this.y, 140, '#ffffff', this.flash);
  }
}

function createBoss(id, x, scale) {
  if (id === 'ape') return new BossApe(x, scale);
  if (id === 'dragon') return new BossDragon(x, scale);
  if (id === 'bull') return new BossBull(x, scale);
  if (id === 'erlang') return new BossErlang(x, scale);
  return new BossDreamlord(x, scale);
}
