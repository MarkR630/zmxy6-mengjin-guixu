'use strict';
/* ============================================================
 *  SKILLS & TREASURES — 20 Hero Skills + 5 Magic Treasures (法宝)
 * ============================================================ */
const SkillImpl = {
  /* ========================================================
   *  孙悟空
   * ======================================================== */
  wukong: {
    s1(p, G) { // 棍影千重
      p.lockMove(0.68);
      p.poseAnim = { dur: 0.68, t: 0, p0: POSES.cast, p1: P(0.45, 0.1, 1.6, 0, -0.7, 0.4, 0.8, -0.6, -0.6, -0.3, 1.57) };
      Snd.play('cast');
      for (let i = 0; i < 6; i++) {
        G.after(i * 0.085, () => {
          if (p.dead) return;
          p.vx = p.dir * 210;
          Snd.play('swing', { pitch: 1 + i * 0.08 });
          const oy = rand(-24, 14);
          G.attack({
            team: 'player', owner: p, x: p.x + p.dir * 82, y: p.y - 54 + oy, w: 140, h: 60,
            dmg: 0.46, kb: 60, up: -30, stun: 0.22, hitstop: 0.015, shake: 2.5,
            life: 0.08, color: '#ffaa30',
            draw(ctx) {
              ctx.save(); ctx.globalCompositeOperation = 'lighter';
              const a = 1 - this.t / this.life;
              ctx.strokeStyle = rgba('#ff9a30', a * 0.85); ctx.lineWidth = 7;
              ctx.beginPath(); ctx.moveTo(this.x - p.dir * 70, this.y); ctx.lineTo(this.x + p.dir * 72, this.y); ctx.stroke();
              ctx.strokeStyle = rgba('#ffffff', a); ctx.lineWidth = 2.5; ctx.stroke();
              ctx.restore();
            },
          });
          Parts.spawn('spark', p.x + p.dir * 45, p.y - 50 + oy, { vx: p.dir * 520, vy: rand(-80, 80), size: 2.8, color: '#ffd868', life: 0.22 });
        });
      }
      G.after(0.55, () => {
        if (p.dead) return;
        Snd.play('swingHeavy');
        G.attack({
          team: 'player', owner: p, x: p.x + p.dir * 92, y: p.y - 56, w: 155, h: 110,
          dmg: 1.2, kb: 380, up: -320, stun: 0.45, hitstop: 0.06, shake: 9, life: 0.1, color: '#ffd050',
        });
        G.fx(fxCrescent(p.x, p.y - 52, 138, -1.9, 1.0, p.dir, '#ff9a30', 0.25, 0.36));
      });
    },
    s2(p, G) { // 筋斗云破
      p.lockMove(0.46);
      p.invuln = Math.max(p.invuln, 0.52);
      p.vx = p.dir * 980;
      p.vy = -120;
      p.poseAnim = { dur: 0.46, t: 0, p0: POSES.dash, p1: POSES.dash };
      Snd.play('dash'); Snd.play('fire', { vol: 0.7 });
      G.addShake(5);
      // cloud trail + fiery blasts along dash
      for (let i = 0; i < 6; i++) {
        G.after(i * 0.065, () => {
          if (p.dead) return;
          const bx = p.x, by = p.y - 24;
          FX.embers(bx, by, 6, '#ffd050', 22, 110);
          G.fx({
            layer: 'back', t: 0, life: 0.45, x: bx, y: p.y - 12,
            update(dt) { this.t += dt; return this.t < this.life; },
            draw(ctx) {
              const k = 1 - this.t / this.life;
              ctx.save(); ctx.globalAlpha = k * 0.7;
              ctx.fillStyle = '#ffe598';
              ctx.beginPath(); ctx.arc(this.x - 12, this.y, 14, 0, TAU); ctx.arc(this.x + 8, this.y - 4, 16, 0, TAU); ctx.arc(this.x + 22, this.y + 2, 11, 0, TAU); ctx.fill();
              ctx.restore();
            },
          });
          G.attack({
            team: 'player', owner: p, x: bx, y: p.y - 45, w: 96, h: 95,
            dmg: 0.72, kb: 190, up: -240, stun: 0.35, hitstop: 0.025, shake: 4, life: 0.14, color: '#ffb030',
          });
        });
      }
    },
    s3(p, G) { // 如意擎天 (giant descending golden staff)
      p.lockMove(0.65);
      p.poseAnim = { dur: 0.6, t: 0, p0: POSES.castUp, p1: POSES.slam };
      Snd.play('cast');
      const tx = clamp(p.x + p.dir * 195, 80, G.room.w - 80);
      G.fx(fxWarnZone(tx, 190, 0.28, '#ffb030', GROUND, 480));
      G.after(0.28, () => {
        Snd.play('boom'); Snd.play('hitHeavy');
        G.addShake(18); G.addFlash('#ffcc60', 0.22, 0.18);
        FX.explosion(tx, GROUND - 20, 125, '#ff9a20', '#fff8d0');
        FX.groundRing(tx, '#ffd868', 220, 0.5);
        FX.debris(tx, GROUND, 14, '#3a2214');
        // giant staff visual
        G.fx({
          layer: 'front', t: 0, life: 0.75, x: tx,
          update(dt) { this.t += dt; return this.t < this.life; },
          draw(ctx) {
            const u = this.t / this.life;
            const drop = u < 0.12 ? Ease.outCubic(u / 0.12) : 1;
            const fade = u > 0.55 ? 1 - (u - 0.55) / 0.45 : 1;
            const topY = lerp(-360, GROUND - 440, drop);
            const botY = lerp(GROUND - 440, GROUND + 4, drop);
            ctx.save(); ctx.globalAlpha = fade;
            ctx.globalCompositeOperation = 'lighter';
            drawGlow(ctx, this.x, GROUND - 120, 160, '#ff9a30', 0.45 * fade);
            ctx.globalCompositeOperation = 'source-over';
            const g = ctx.createLinearGradient(this.x - 24, 0, this.x + 24, 0);
            g.addColorStop(0, '#961e12'); g.addColorStop(0.5, '#ffda6a'); g.addColorStop(1, '#961e12');
            ctx.fillStyle = g;
            ctx.fillRect(this.x - 24, topY, 48, botY - topY);
            // golden caps
            ctx.fillStyle = '#ffd868';
            ctx.fillRect(this.x - 28, botY - 52, 56, 52);
            ctx.strokeStyle = '#ff4820'; ctx.lineWidth = 4;
            ctx.strokeRect(this.x - 28, botY - 52, 56, 52);
            ctx.restore();
          },
        });
        G.attack({
          team: 'player', owner: p, x: tx, y: GROUND - 110, w: 230, h: 240,
          dmg: 2.95, kb: 320, up: -640, stun: 0.85, hitstop: 0.08, shake: 14, poiseDmg: 75, life: 0.16, color: '#ff9a30',
        });
      });
    },
    ult(p, G) { // 法天象地
      p.awaken(6.5);
      p.invuln = Math.max(p.invuln, 1.5);
      p.lockMove(0.9);
      p.poseAnim = { dur: 0.9, t: 0, p0: POSES.castUp, p1: POSES.slam };
      G.after(0.1, () => {
        Snd.play('boom'); Snd.play('roar', { vol: 0.7 });
        G.addShake(24); G.addFlash('#ffd870', 0.45, 0.3);
        const cx = p.x + p.dir * 120;
        FX.groundRing(cx, '#ffd868', 580, 0.75);
        FX.explosion(cx, GROUND - 80, 220, '#ff8820', '#ffffff');
        // colossal golden avatar silhouette + sky-cleaving staff
        G.fx({
          layer: 'front', t: 0, life: 1.05, x: p.x, y: GROUND, dir: p.dir,
          update(dt) { this.t += dt; return this.t < this.life; },
          draw(ctx) {
            const u = this.t / this.life;
            const k = u < 0.15 ? Ease.outCubic(u / 0.15) : 1;
            const a = u > 0.55 ? 1 - (u - 0.55) / 0.45 : 1;
            ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a * 0.72;
            const col = '#ffd868';
            drawGlow(ctx, this.x, this.y - 240, 340, '#ff8820', 0.6 * a);
            ctx.strokeStyle = rgba(col, 0.9 * a); ctx.lineWidth = 16;
            const ang = lerp(-2.2, 0.55, Ease.outExpo(Math.min(1, u * 2.4)));
            ctx.save(); ctx.translate(this.x, this.y - 220); ctx.scale(this.dir, 1); ctx.rotate(ang);
            const sg = ctx.createLinearGradient(0, -40, 560, 40);
            sg.addColorStop(0, '#ff5020'); sg.addColorStop(0.5, '#fff6b0'); sg.addColorStop(1, '#ff9a30');
            ctx.fillStyle = sg;
            ctx.fillRect(0, -18, 560 * k, 36);
            ctx.restore();
            ctx.restore();
          },
        });
        G.attack({
          team: 'player', owner: p, x: p.x + p.dir * 200, y: GROUND - 180, w: 920, h: 460,
          dmg: 5.6, kb: 540, up: -580, stun: 1.3, hitstop: 0.11, shake: 20, poiseDmg: 140, life: 0.26, rehit: 0.13, color: '#ffd868',
        });
      });
    },
  },

  /* ========================================================
   *  猪八戒
   * ======================================================== */
  bajie: {
    s1(p, G) { // 钉耙旋风
      p.lockMove(0.25);
      p.superArmor = Math.max(p.superArmor, 1.35);
      Snd.play('swingHeavy'); Snd.play('water', { vol: 0.65 });
      p.poseAnim = { dur: 1.25, t: 0, p0: P(0.1, 0, 1.5, 0, 1.5, 0, 0.4, -0.3, -0.4, -0.3, 1.57), p1: P(0.1, 0, 1.5, 0, 1.5, 0, 0.4, -0.3, -0.4, -0.3, 1.57) };
      G.attack({
        team: 'player', owner: p, ox: 0, oy: -54, w: 225, h: 120,
        dmg: 0.56, kb: -140, up: -80, stun: 0.2, hitstop: 0.015, shake: 3,
        life: 1.2, rehit: 0.17, color: '#5ac8ff',
        update(dt, G2) {
          p.dir = Math.sin(this.t * 28) >= 0 ? 1 : -1;
          if (chance(0.45)) Parts.spawn('spark', this.x + rand(-90, 90), this.y + rand(-30, 30), { vx: -rand(-120, 120), vy: -120, color: '#92e4ff', size: 2.5, life: 0.25 });
        },
        draw(ctx) {
          ctx.save(); ctx.globalCompositeOperation = 'lighter';
          const a = Math.sin(clamp(this.t / this.life, 0, 1) * PI);
          for (let i = 0; i < 3; i++) {
            const ang = this.t * 22 + i * 2.1;
            ctx.strokeStyle = rgba(i ? '#5ac8ff' : '#ffffff', 0.5 * a);
            ctx.lineWidth = 4 - i;
            ctx.beginPath();
            ctx.ellipse(this.x, this.y + (i - 1) * 16, 108 - i * 12, 22, 0, ang, ang + 4.2);
            ctx.stroke();
          }
          ctx.restore();
        },
      });
    },
    s2(p, G) { // 天蓬冲撞
      p.lockMove(0.55);
      p.superArmor = Math.max(p.superArmor, 0.65);
      p.invuln = Math.max(p.invuln, 0.3);
      p.vx = p.dir * 720;
      p.poseAnim = { dur: 0.55, t: 0, p0: POSES.dash, p1: POSES.dash };
      Snd.play('roar', { vol: 0.5, pitch: 1.25 }); Snd.play('dash');
      G.addShake(7);
      G.attack({
        team: 'player', owner: p, ox: p.dir * 40, oy: -50, w: 130, h: 105,
        dmg: 1.95, kb: 480, up: -300, stun: 0.7, hitstop: 0.06, shake: 11, poiseDmg: 65,
        life: 0.48, color: '#68d4ff',
        update(dt) {
          p.vx = p.dir * 680;
          if (chance(0.5)) FX.dust(p.x, GROUND, 1, '#5ac8ff', 0.8);
        },
        draw(ctx) {
          ctx.save(); ctx.globalCompositeOperation = 'lighter';
          const cx = this.x + p.dir * 40;
          drawGlow(ctx, cx, this.y, 70, '#5ac8ff', 0.45);
          ctx.strokeStyle = rgba('#b4ecff', 0.85); ctx.lineWidth = 4;
          ctx.beginPath(); ctx.arc(cx, this.y, 48, p.dir > 0 ? -1.1 : PI - 1.1, p.dir > 0 ? 1.1 : PI + 1.1); ctx.stroke();
          ctx.restore();
        },
      });
    },
    s3(p, G) { // 猪突地裂
      p.lockMove(0.62);
      p.vy = -440;
      p.poseAnim = { dur: 0.62, t: 0, p0: POSES.castUp, p1: POSES.slam };
      Snd.play('jump');
      G.after(0.28, () => {
        if (p.dead) return;
        p.vy = 600;
        Snd.play('boom'); Snd.play('ice');
        G.addShake(16);
        FX.groundRing(p.x, '#5ac8ff', 220, 0.45);
        FX.debris(p.x, GROUND, 12, '#3a4a66');
        // twin outward shockwaves
        for (const s of [-1, 1]) {
          G.attack({
            team: 'player', owner: p, x: p.x + s * 40, y: GROUND - 55, w: 72, h: 120,
            vx: s * 560, dmg: 2.25, kb: s * 220, up: -560, stun: 0.75, hitstop: 0.06, shake: 8, poiseDmg: 55,
            life: 0.68, pierce: true, color: '#5ac8ff',
            update(dt) {
              if (chance(0.6)) Parts.spawn('shard', this.x, GROUND - 8, { vx: rand(-60, 60), vy: -rand(180, 380), size: 6, color: '#92e8ff', grav: 1100, life: 0.45 });
            },
            draw(ctx) {
              ctx.save(); ctx.globalCompositeOperation = 'lighter';
              drawGlow(ctx, this.x, GROUND - 35, 65, '#5ac8ff', 0.6);
              ctx.fillStyle = '#b4eeff';
              ctx.beginPath();
              ctx.moveTo(this.x - 28, GROUND); ctx.lineTo(this.x - 8, GROUND - 108); ctx.lineTo(this.x + 8, GROUND - 88); ctx.lineTo(this.x + 28, GROUND);
              ctx.closePath(); ctx.fill();
              ctx.restore();
            },
          });
        }
      });
    },
    ult(p, G) { // 银河倒悬
      p.awaken(7.0);
      p.invuln = Math.max(p.invuln, 1.4);
      p.lockMove(0.8);
      p.poseAnim = { dur: 0.8, t: 0, p0: POSES.castUp, p1: POSES.slam };
      G.after(0.1, () => {
        Snd.play('water', { vol: 1 }); Snd.play('boom');
        G.addShake(22); G.addFlash('#70d8ff', 0.4, 0.3);
        const startX = p.x - p.dir * 260;
        G.attack({
          team: 'player', owner: p, x: startX, y: GROUND - 140, w: 280, h: 320,
          vx: p.dir * 980, dmg: 5.4, kb: p.dir * 520, up: -540, stun: 1.25, hitstop: 0.1, shake: 18, poiseDmg: 140,
          life: 1.25, pierce: true, color: '#5ac8ff',
          update(dt) {
            if (chance(0.8)) Parts.spawn('glow', this.x + rand(-80, 80), GROUND - rand(20, 220), { size: 35, color: '#90e8ff', life: 0.35 });
          },
          draw(ctx) {
            ctx.save(); ctx.globalCompositeOperation = 'lighter';
            const g = ctx.createLinearGradient(this.x - 160, GROUND - 280, this.x + 160, GROUND);
            g.addColorStop(0, rgba('#ffffff', 0.85)); g.addColorStop(0.5, rgba('#5ac8ff', 0.65)); g.addColorStop(1, rgba('#1460a0', 0.15));
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.moveTo(this.x - 170, GROUND);
            ctx.quadraticCurveTo(this.x - 40, GROUND - 340, this.x + 140, GROUND - 180);
            ctx.quadraticCurveTo(this.x + 180, GROUND - 80, this.x + 140, GROUND);
            ctx.closePath(); ctx.fill();
            drawGlow(ctx, this.x, GROUND - 120, 220, '#5ac8ff', 0.55);
            ctx.restore();
          },
        });
      });
    },
  },

  /* ========================================================
   *  沙悟净
   * ======================================================== */
  sha: {
    s1(p, G) { // 月牙飞铲 (boomerang)
      p.lockMove(0.32);
      p.poseAnim = { dur: 0.32, t: 0, p0: POSES.cast, p1: POSES.idle };
      Snd.play('swingHeavy');
      const dir = p.dir;
      G.attack({
        team: 'player', owner: p, x: p.x + dir * 40, y: p.y - 54, w: 86, h: 86,
        dmg: 1.25, kb: dir * 160, up: -140, stun: 0.35, hitstop: 0.035, shake: 5,
        life: 1.25, rehit: 0.24, pierce: true, color: '#3ae0b0',
        initSp: dir * 820,
        update(dt) {
          const u = this.t / this.life;
          this.vx = this.initSp * (1 - u * 2.1);
          this.y = damp(this.y, p.y - 54, 6, dt);
          if (u > 0.7 && dist(this.x, this.y, p.x, p.y - 54) < 38) this.life = 0;
        },
        draw(ctx) {
          ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.t * 24);
          ctx.globalCompositeOperation = 'lighter';
          drawGlow(ctx, 0, 0, 56, '#3ae0b0', 0.45);
          ctx.strokeStyle = '#b4ffea'; ctx.lineWidth = 6;
          ctx.beginPath(); ctx.arc(0, 0, 34, -1.2, 1.2); ctx.stroke();
          ctx.strokeStyle = '#3ae0b0'; ctx.lineWidth = 4;
          ctx.beginPath(); ctx.arc(0, 0, 34, PI - 1.2, PI + 1.2); ctx.stroke();
          ctx.restore();
        },
      });
    },
    s2(p, G) { // 流沙陷阵
      p.lockMove(0.45);
      p.poseAnim = { dur: 0.45, t: 0, p0: POSES.cast, p1: POSES.slam };
      Snd.play('cast'); Snd.play('water', { pitch: 0.75 });
      const zx = clamp(p.x + p.dir * 160, 100, G.room.w - 100);
      G.attack({
        team: 'player', owner: p, x: zx, y: GROUND - 40, w: 280, h: 120,
        dmg: 0.48, kb: 0, up: -40, stun: 0.15, hitstop: 0, shake: 1.5,
        life: 4.5, rehit: 0.42, pierce: true, color: '#3ae0b0',
        onHit(target) {
          // pull slightly to center + slow
          target.vx += sign(this.x - target.x) * 140;
          target.slowT = Math.max(target.slowT || 0, 0.8);
        },
        update(dt) {
          if (chance(0.45)) Parts.spawn('ember', this.x + rand(-120, 120), GROUND - 6, { vx: rand(-30, 30), vy: -rand(30, 90), color: '#50ffd0', size: 2.5, life: 0.6 });
        },
        draw(ctx) {
          const a = Math.min(1, (this.life - this.t) * 1.5) * Math.min(1, this.t * 4);
          ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a;
          drawGlow(ctx, this.x, GROUND - 6, 150, '#3ae0b0', 0.3);
          for (let i = 0; i < 3; i++) {
            const r = 45 + i * 44;
            ctx.strokeStyle = rgba('#78ffe0', 0.7 - i * 0.15);
            ctx.lineWidth = 2.5;
            ctx.save(); ctx.translate(this.x, GROUND - 4); ctx.scale(1, 0.22);
            ctx.beginPath(); ctx.arc(0, 0, r, this.t * (3 - i) * (i % 2 ? -1 : 1), this.t * (3 - i) * (i % 2 ? -1 : 1) + 4.4); ctx.stroke();
            ctx.restore();
          }
          ctx.restore();
        },
      });
    },
    s3(p, G) { // 卷帘护体
      p.lockMove(0.32);
      p.poseAnim = { dur: 0.35, t: 0, p0: POSES.castUp, p1: POSES.idle };
      p.shieldT = 6.5;
      p.shieldRatio = 0.35; // 65% dmg reduction!
      Snd.play('shield');
      FX.groundRing(p.x, '#3ae0b0', 140, 0.4);
      G.attack({
        team: 'player', owner: p, ox: 0, oy: -54, w: 170, h: 130,
        dmg: 0.45, kb: 120, up: -60, stun: 0.2, hitstop: 0, shake: 2,
        life: 6.5, rehit: 0.55, pierce: true, color: '#88ffe0',
        draw(ctx) {
          const a = Math.min(1, (this.life - this.t) * 1.5);
          ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a;
          ctx.strokeStyle = rgba('#50ffd0', 0.45); ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(this.x, this.y, 68, 0, TAU); ctx.stroke();
          for (let i = 0; i < 6; i++) {
            const ang = this.t * 3.6 + (i / 6) * TAU;
            const ox = this.x + Math.cos(ang) * 66, oy = this.y + Math.sin(ang) * 42;
            drawGlow(ctx, ox, oy, 18, '#3ae0b0', 0.7);
            ctx.fillStyle = '#e8fff8';
            ctx.beginPath(); ctx.arc(ox, oy, 4.5, 0, TAU); ctx.fill();
          }
          ctx.restore();
        },
      });
    },
    ult(p, G) { // 流沙天倾
      p.awaken(7.0);
      p.invuln = Math.max(p.invuln, 1.4);
      p.lockMove(0.7);
      p.poseAnim = { dur: 0.7, t: 0, p0: POSES.castUp, p1: POSES.cast };
      G.after(0.1, () => {
        Snd.play('water', { vol: 1 }); Snd.play('roar', { vol: 0.6, pitch: 0.85 });
        G.addShake(20); G.addFlash('#50ffd0', 0.35, 0.28);
        G.attack({
          team: 'player', owner: p, x: p.x + p.dir * 80, y: GROUND - 200, w: 280, h: 420,
          vx: p.dir * 420, dmg: 0.92, kb: p.dir * 120, up: -380, stun: 0.4, hitstop: 0.03, shake: 8, poiseDmg: 30,
          life: 1.9, rehit: 0.22, pierce: true, color: '#3ae0b0',
          draw(ctx) {
            const a = Math.min(1, (this.life - this.t) * 2) * Math.min(1, this.t * 5);
            ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a;
            drawGlow(ctx, this.x, GROUND - 190, 220, '#3ae0b0', 0.45);
            for (let i = 0; i < 10; i++) {
              const yy = GROUND - 20 - i * 38;
              const rx = 52 + i * 16 + Math.sin(this.t * 10 + i) * 12;
              ctx.strokeStyle = rgba(i % 2 ? '#98ffe8' : '#30c898', 0.7);
              ctx.lineWidth = 4;
              const ang = this.t * 12 + i * 0.7;
              ctx.beginPath(); ctx.ellipse(this.x, yy, rx, 16, 0, ang, ang + 4.5); ctx.stroke();
            }
            ctx.restore();
          },
        });
      });
    },
  },

  /* ========================================================
   *  唐三藏
   * ======================================================== */
  tang: {
    s1(p, G) { // 紧箍金刚咒 (5 homing golden talismans)
      p.lockMove(0.45);
      p.poseAnim = { dur: 0.45, t: 0, p0: POSES.castUp, p1: POSES.cast };
      Snd.play('cast'); Snd.play('bell');
      for (let i = 0; i < 5; i++) {
        G.after(i * 0.06, () => {
          if (p.dead) return;
          const a = (i - 2) * 0.25 + (p.dir > 0 ? 0 : PI);
          const sp = 620;
          G.attack({
            team: 'player', owner: p, x: p.x + p.dir * 24, y: p.y - 68 + (i - 2) * 10, w: 38, h: 38,
            vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 120,
            dmg: 0.68, kb: p.dir * 120, up: -110, stun: 0.3, hitstop: 0.02, shake: 3.5,
            life: 1.35, color: '#ffd060',
            update(dt, G2) {
              let best = null, bd = 720;
              for (const e of G2.enemies) {
                if (e.dead) continue;
                const d = dist(this.x, this.y, e.x, e.y - 45);
                if (d < bd) { bd = d; best = e; }
              }
              if (best) {
                const ta = Math.atan2(best.y - 45 - this.y, best.x - this.x);
                const ca = Math.atan2(this.vy, this.vx);
                let da = ((ta - ca + PI * 3) % TAU) - PI;
                const na = ca + clamp(da, -5.5 * dt, 5.5 * dt);
                const curS = Math.hypot(this.vx, this.vy) || 620;
                this.vx = Math.cos(na) * curS; this.vy = Math.sin(na) * curS;
              }
              if (chance(0.4)) Parts.spawn('ember', this.x, this.y, { color: '#ffd868', size: 2.2, life: 0.3 });
            },
            draw(ctx) {
              ctx.save(); ctx.globalCompositeOperation = 'lighter';
              drawGlow(ctx, this.x, this.y, 26, '#ffd060', 0.85);
              ctx.strokeStyle = '#fff4b0'; ctx.lineWidth = 2;
              ctx.beginPath(); ctx.arc(this.x, this.y, 13, this.t * 8, this.t * 8 + TAU); ctx.stroke();
              ctx.fillStyle = '#ffffff'; ctx.font = `15px ${FONT_BRUSH}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
              ctx.fillText('佛', this.x, this.y);
              ctx.restore();
            },
          });
        });
      }
    },
    s2(p, G) { // 佛光普照 (heal + push AoE)
      p.lockMove(0.48);
      p.poseAnim = { dur: 0.5, t: 0, p0: POSES.castUp, p1: POSES.victory };
      Snd.play('heal'); Snd.play('bell');
      const healAmt = Math.round(p.maxHp * 0.22);
      p.heal(healAmt);
      FX.groundRing(p.x, '#ffe888', 240, 0.55);
      FX.embers(p.x, p.y - 30, 18, '#ffd868', 90, 160);
      G.attack({
        team: 'player', owner: p, x: p.x, y: p.y - 54, w: 300, h: 200,
        dmg: 1.55, kb: 420, up: -300, stun: 0.7, hitstop: 0.05, shake: 8,
        life: 0.28, color: '#ffe480',
        draw(ctx) {
          const u = this.t / this.life;
          ctx.save(); ctx.globalCompositeOperation = 'lighter';
          drawGlow(ctx, this.x, this.y, 180 * (0.5 + u * 0.8), '#ffd868', (1 - u) * 0.8);
          ctx.strokeStyle = rgba('#fff6c0', 1 - u); ctx.lineWidth = 5 * (1 - u);
          ctx.beginPath(); ctx.arc(this.x, this.y, 40 + u * 140, 0, TAU); ctx.stroke();
          ctx.restore();
        },
      });
    },
    s3(p, G) { // 紫金降魔钵
      p.lockMove(0.55);
      p.poseAnim = { dur: 0.55, t: 0, p0: POSES.castUp, p1: POSES.cast };
      Snd.play('cast');
      const tx = clamp(p.x + p.dir * 210, 100, G.room.w - 100);
      G.fx(fxWarnZone(tx, 220, 0.3, '#ffd060', GROUND, 340));
      G.after(0.3, () => {
        Snd.play('gong'); Snd.play('boom');
        G.addShake(15);
        FX.groundRing(tx, '#ffd060', 240, 0.5);
        FX.explosion(tx, GROUND - 30, 120, '#ffd060', '#ffffff');
        G.fx({
          layer: 'front', t: 0, life: 1.2, x: tx,
          update(dt) { this.t += dt; return this.t < this.life; },
          draw(ctx) {
            const u = this.t / this.life;
            const drop = u < 0.14 ? Ease.outBounce ? Ease.outCubic(u / 0.14) : Ease.outCubic(u / 0.14) : 1;
            const y = lerp(-240, GROUND, drop);
            const a = u > 0.65 ? 1 - (u - 0.65) / 0.35 : 1;
            ctx.save(); ctx.globalAlpha = a;
            ctx.globalCompositeOperation = 'lighter';
            drawGlow(ctx, this.x, y - 40, 130, '#ffb030', 0.45 * a);
            ctx.globalCompositeOperation = 'source-over';
            const g = ctx.createLinearGradient(this.x - 80, y - 90, this.x + 80, y);
            g.addColorStop(0, '#ffe888'); g.addColorStop(0.5, '#c88020'); g.addColorStop(1, '#5a3208');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(this.x, y - 70, 80, 0, PI, true);
            ctx.lineTo(this.x + 80, y); ctx.lineTo(this.x - 80, y);
            ctx.closePath(); ctx.fill();
            ctx.strokeStyle = '#fff2a0'; ctx.lineWidth = 3; ctx.stroke();
            ctx.restore();
          },
        });
        G.attack({
          team: 'player', owner: p, x: tx, y: GROUND - 80, w: 240, h: 190,
          dmg: 2.65, kb: 0, up: -260, stun: 1.85, hitstop: 0.08, shake: 12, poiseDmg: 85, life: 0.18, color: '#ffd060',
        });
      });
    },
    ult(p, G) { // 万佛朝宗 (Giant Descending Golden Buddha Palm)
      p.awaken(7.0);
      p.invuln = Math.max(p.invuln, 1.5);
      p.lockMove(0.85);
      p.poseAnim = { dur: 0.85, t: 0, p0: POSES.castUp, p1: POSES.victory };
      const tx = clamp(p.x + p.dir * 200, 220, G.room.w - 220);
      G.after(0.15, () => {
        Snd.play('gong'); Snd.play('boom');
        G.addShake(26); G.addFlash('#ffe880', 0.48, 0.35);
        FX.groundRing(tx, '#ffe880', 520, 0.85);
        FX.explosion(tx, GROUND - 40, 240, '#ffd060', '#ffffff');
        G.fx({
          layer: 'front', t: 0, life: 1.35, x: tx,
          update(dt) { this.t += dt; return this.t < this.life; },
          draw(ctx) {
            const u = this.t / this.life;
            const drop = u < 0.18 ? Ease.outCubic(u / 0.18) : 1;
            const a = u > 0.6 ? 1 - (u - 0.6) / 0.4 : 1;
            const py = lerp(-360, GROUND - 20, drop);
            ctx.save(); ctx.globalAlpha = a; ctx.globalCompositeOperation = 'lighter';
            drawGlow(ctx, this.x, py - 150, 320, '#ffd060', 0.65 * a);
            // radiant golden handprint silhouette
            ctx.fillStyle = rgba('#ffe478', 0.85 * a);
            ctx.strokeStyle = rgba('#ffffff', 0.9 * a); ctx.lineWidth = 4;
            ctx.beginPath(); ctx.ellipse(this.x, py - 100, 115, 95, 0, 0, TAU); ctx.fill(); ctx.stroke();
            const fOffsets = [[-95, -180, -0.2], [-48, -225, -0.08], [0, -240, 0], [48, -225, 0.08], [115, -125, 0.5]];
            for (const [ox, oy, rot] of fOffsets) {
              ctx.save(); ctx.translate(this.x + ox, py + oy); ctx.rotate(rot);
              ctx.beginPath(); ctx.ellipse(0, 0, 22, 62, 0, 0, TAU); ctx.fill(); ctx.stroke();
              ctx.restore();
            }
            // sacred character in center of palm
            ctx.fillStyle = '#ffffff'; ctx.font = `92px ${FONT_BRUSH}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText('卍', this.x, py - 100);
            ctx.restore();
          },
        });
        G.attack({
          team: 'player', owner: p, x: tx, y: GROUND - 180, w: 720, h: 440,
          dmg: 5.8, kb: 480, up: -500, stun: 1.6, hitstop: 0.12, shake: 22, poiseDmg: 160, life: 0.35, rehit: 0.16, color: '#ffe478',
        });
      });
    },
  },

  /* ========================================================
   *  小白龙
   * ======================================================== */
  bailong: {
    s1(p, G) { // 龙吟剑气
      p.lockMove(0.32);
      p.poseAnim = { dur: 0.32, t: 0, p0: POSES.castUp, p1: P(0.4, 0.05, 1.4, 0, -0.7, 0.5, 0.6, -0.5, -0.5, -0.2, 0.6) };
      Snd.play('ice'); Snd.play('swingHeavy');
      const dir = p.dir;
      G.attack({
        team: 'player', owner: p, x: p.x + dir * 48, y: p.y - 62, w: 68, h: 136,
        vx: dir * 880, dmg: 1.78, kb: dir * 240, up: -220, stun: 0.4, hitstop: 0.04, shake: 6,
        life: 0.9, pierce: true, color: '#6ad0ff',
        update(dt) {
          if (chance(0.65)) Parts.spawn('spark', this.x, this.y + rand(-50, 50), { vx: -dir * 120, vy: rand(-60, 60), color: '#b4f0ff', size: 2.2, life: 0.25 });
        },
        draw(ctx) {
          ctx.save(); ctx.translate(this.x, this.y); ctx.scale(dir, 1);
          ctx.globalCompositeOperation = 'lighter';
          drawGlow(ctx, 0, 0, 64, '#6ad0ff', 0.6);
          ctx.fillStyle = '#c8f4ff';
          ctx.beginPath(); ctx.arc(-18, 0, 74, -1.0, 1.0); ctx.arc(-34, 0, 62, 1.0, -1.0, true); ctx.closePath(); ctx.fill();
          ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.stroke();
          ctx.restore();
        },
      });
    },
    s2(p, G) { // 游龙闪
      p.lockMove(0.4);
      p.invuln = Math.max(p.invuln, 0.55);
      const x0 = p.x, dir = p.dir;
      p.x = clamp(p.x + dir * 330, 50, G.room.w - 50);
      p.poseAnim = { dur: 0.4, t: 0, p0: POSES.dash, p1: POSES.idleSw };
      Snd.play('dash'); Snd.play('ice', { pitch: 1.3 });
      // leave electric-frost trail & delayed bursts
      G.fx(fxLine(x0, p.y - 54, p.x, p.y - 54, 0.35, '#92ecff', 5));
      for (let i = 0; i < 5; i++) {
        const sx = lerp(x0, p.x, (i + 0.5) / 5);
        const sy = p.y - 54 + rand(-18, 18);
        G.after(0.18 + i * 0.055, () => {
          Snd.play('hit', { pitch: 1.2 + i * 0.06 });
          FX.slashMark(sx, sy, dir, '#88e8ff', 120);
          G.attack({
            team: 'player', owner: p, x: sx, y: sy, w: 110, h: 100,
            dmg: 0.65, kb: dir * 60, up: -180, stun: 0.35, hitstop: 0.025, shake: 4, life: 0.08, color: '#6ad0ff',
          });
        });
      }
    },
    s3(p, G) { // 冰龙破 (6 sequenced ice spikes erupting forward)
      p.lockMove(0.5);
      p.poseAnim = { dur: 0.5, t: 0, p0: POSES.castUp, p1: POSES.slam };
      Snd.play('ice'); Snd.play('hitHeavy');
      G.addShake(10);
      for (let i = 0; i < 6; i++) {
        G.after(i * 0.07, () => {
          const sx = clamp(p.x + p.dir * (95 + i * 82), 50, G.room.w - 50);
          Snd.play('ice', { pitch: 0.9 + i * 0.08, vol: 0.7 });
          FX.debris(sx, GROUND, 5, '#8ee8ff');
          G.attack({
            team: 'player', owner: p, x: sx, y: GROUND - 70, w: 72, h: 150,
            dmg: 0.85, kb: p.dir * 90, up: -560, stun: 0.45, hitstop: 0.02, shake: 4.5, poiseDmg: 22,
            life: 0.38, color: '#6ad0ff',
            onHit(t) { t.slowT = Math.max(t.slowT || 0, 2.2); },
            draw(ctx) {
              const u = this.t / this.life;
              const h = (u < 0.2 ? Ease.outExpo(u / 0.2) : 1) * (130 + i * 10);
              const a = u > 0.55 ? 1 - (u - 0.55) / 0.45 : 1;
              ctx.save(); ctx.globalAlpha = a; ctx.globalCompositeOperation = 'lighter';
              drawGlow(ctx, this.x, GROUND - h * 0.4, 52, '#6ad0ff', 0.45 * a);
              const g = ctx.createLinearGradient(this.x, GROUND - h, this.x, GROUND);
              g.addColorStop(0, '#ffffff'); g.addColorStop(0.5, '#76dcff'); g.addColorStop(1, '#1a6ea0');
              ctx.fillStyle = g;
              ctx.beginPath(); ctx.moveTo(this.x - 24, GROUND); ctx.lineTo(this.x - 4, GROUND - h); ctx.lineTo(this.x + 24, GROUND); ctx.closePath(); ctx.fill();
              ctx.restore();
            },
          });
        });
      }
    },
    ult(p, G) { // 白龙真身 (Articulated 18-segment dragon sweeping the entire arena)
      p.awaken(7.0);
      p.invuln = Math.max(p.invuln, 1.5);
      p.lockMove(0.75);
      p.poseAnim = { dur: 0.75, t: 0, p0: POSES.castUp, p1: POSES.cast };
      G.after(0.1, () => {
        Snd.play('roar', { vol: 0.8, pitch: 1.15 }); Snd.play('ice', { vol: 1 });
        G.addShake(22); G.addFlash('#92ecff', 0.4, 0.28);
        const dir = p.dir;
        const startX = dir > 0 ? Math.max(0, G.cam.x - 750) : Math.min(G.room.w, G.cam.x + 750);
        const hist = [];
        G.attack({
          team: 'player', owner: p, x: startX, y: GROUND - 170, w: 300, h: 280,
          vx: dir * 1080, dmg: 1.55, kb: dir * 320, up: -460, stun: 0.7, hitstop: 0.04, shake: 12, poiseDmg: 45,
          life: 1.65, rehit: 0.22, pierce: true, color: '#78dcff',
          update(dt) {
            this.y = GROUND - 185 + Math.sin(this.t * 7.5) * 105;
            hist.unshift({ x: this.x, y: this.y });
            if (hist.length > 70) hist.pop();
            if (chance(0.7)) Parts.spawn('ember', this.x + rand(-40, 40), this.y + rand(-40, 40), { color: '#b4f4ff', size: 3.5, life: 0.45 });
          },
          draw(ctx) {
            ctx.save(); ctx.globalCompositeOperation = 'lighter';
            // draw trailing frost dragon body segments
            for (let i = 18; i >= 1; i--) {
              const idx = Math.min(hist.length - 1, i * 3);
              const pt = hist[idx]; if (!pt) continue;
              const r = 34 * (1 - i / 22) + 8;
              drawGlow(ctx, pt.x, pt.y, r * 1.9, '#5ec8ff', 0.28);
              ctx.fillStyle = rgba(i % 2 ? '#e0f8ff' : '#80dcff', 0.82);
              ctx.beginPath(); ctx.arc(pt.x, pt.y, r, 0, TAU); ctx.fill();
            }
            // dragon head
            ctx.save(); ctx.translate(this.x, this.y); ctx.scale(dir, 1);
            drawGlow(ctx, 0, 0, 120, '#6ad0ff', 0.6);
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.moveTo(56, 0); ctx.lineTo(14, -28); ctx.lineTo(-42, -20); ctx.lineTo(-26, 0); ctx.lineTo(-42, 20); ctx.lineTo(14, 24);
            ctx.closePath(); ctx.fill();
            // dragon horns
            ctx.strokeStyle = '#92ecff'; ctx.lineWidth = 4;
            ctx.beginPath(); ctx.moveTo(0, -20); ctx.quadraticCurveTo(-24, -52, -58, -46); ctx.stroke();
            // glowing eye
            ctx.fillStyle = '#50f0ff';
            ctx.beginPath(); ctx.arc(20, -6, 5, 0, TAU); ctx.fill();
            ctx.restore();
            ctx.restore();
          },
        });
      });
    },
  },
};

/* ========================================================
 *  TREASURE (法宝) IMPLEMENTATIONS
 * ======================================================== */
const TreasureImpl = {
  gourd(p, G) { // 紫金红葫芦
    Snd.play('cast'); Snd.play('fire');
    p.heal(Math.round(p.maxHp * 0.16));
    const gx = p.x + p.dir * 85, gy = p.y - 120;
    G.attack({
      team: 'player', owner: p, x: gx, y: GROUND - 70, w: 360, h: 200,
      dmg: 0.55, kb: 0, up: -70, stun: 0.2, hitstop: 0, shake: 3,
      life: 2.6, rehit: 0.35, pierce: true, color: '#ff8a3a',
      onHit(e) { e.vx += sign(gx - e.x) * 260; },
      draw(ctx) {
        const a = Math.min(1, (this.life - this.t) * 2);
        ctx.save(); ctx.globalAlpha = a; ctx.globalCompositeOperation = 'lighter';
        drawGlow(ctx, gx, gy, 80, '#ff8a3a', 0.65);
        // swirling vortex lines toward gourd
        for (let i = 0; i < 4; i++) {
          const ang = this.t * 6 + i * 1.57;
          ctx.strokeStyle = rgba('#ffd070', 0.7); ctx.lineWidth = 3;
          ctx.beginPath(); ctx.arc(gx, gy + 45, 30 + (i * 22), ang, ang + 1.8); ctx.stroke();
        }
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = '#b43018';
        ctx.beginPath(); ctx.arc(gx, gy + 10, 18, 0, TAU); ctx.arc(gx, gy - 12, 12, 0, TAU); ctx.fill();
        ctx.strokeStyle = '#ffd260'; ctx.lineWidth = 2; ctx.stroke();
        ctx.restore();
      },
    });
  },
  umbrella(p, G) { // 混元珍珠伞
    Snd.play('shield');
    p.shieldT = Math.max(p.shieldT || 0, 5.0);
    p.shieldRatio = 0.3;
    G.attack({
      team: 'player', owner: p, ox: 0, oy: -60, w: 220, h: 170,
      dmg: 0.7, kb: 240, up: -160, stun: 0.3, hitstop: 0, shake: 4,
      life: 5.0, rehit: 0.85, pierce: true, color: '#ffd868',
      draw(ctx) {
        const a = Math.min(1, (this.life - this.t) * 2);
        ctx.save(); ctx.globalAlpha = a; ctx.globalCompositeOperation = 'lighter';
        const ux = this.x, uy = this.y - 68 + Math.sin(this.t * 4) * 5;
        drawGlow(ctx, ux, uy, 80, '#ffd868', 0.45);
        ctx.strokeStyle = rgba('#ffe488', 0.85); ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(ux, uy + 18, 44, PI, TAU); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(ux, uy - 28); ctx.lineTo(ux, uy + 24); ctx.stroke();
        // shield dome
        ctx.strokeStyle = rgba('#ffd868', 0.45); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(this.x, this.y, 92, 0, TAU); ctx.stroke();
        ctx.restore();
      },
    });
  },
  swords(p, G) { // 青云冰火剑阵
    Snd.play('ice'); Snd.play('cast');
    for (let i = 0; i < 6; i++) {
      const isIce = i % 2 === 0;
      const col = isIce ? '#6ad8ff' : '#ff7a30';
      const launchT = 0.45 + i * 0.12;
      let launched = false;
      G.attack({
        team: 'player', owner: p, x: p.x, y: p.y - 60, w: 46, h: 46,
        dmg: 1.05, kb: 160, up: -150, stun: 0.35, hitstop: 0.02, shake: 4,
        life: 2.2, color: col,
        update(dt, G2) {
          if (this.t < launchT) {
            const ang = this.t * 5 + (i / 6) * TAU;
            this.x = p.x + Math.cos(ang) * 58;
            this.y = p.y - 58 + Math.sin(ang) * 32;
            this.vx = 0; this.vy = 0;
          } else if (!launched) {
            launched = true;
            Snd.play('swing', { pitch: 1.3 });
            let best = null, bd = 900;
            for (const e of G2.enemies) { if (!e.dead) { const d = dist(this.x, this.y, e.x, e.y - 45); if (d < bd) { bd = d; best = e; } } }
            const a = best ? Math.atan2(best.y - 45 - this.y, best.x - this.x) : (p.dir > 0 ? 0 : PI);
            this.vx = Math.cos(a) * 950; this.vy = Math.sin(a) * 950;
          }
        },
        draw(ctx) {
          ctx.save(); ctx.translate(this.x, this.y);
          ctx.rotate(launched ? Math.atan2(this.vy, this.vx) : -PI / 2);
          ctx.globalCompositeOperation = 'lighter';
          drawGlow(ctx, 0, 0, 26, col, 0.75);
          ctx.fillStyle = '#ffffff';
          ctx.beginPath(); ctx.moveTo(22, 0); ctx.lineTo(-14, -5); ctx.lineTo(-10, 0); ctx.lineTo(-14, 5); ctx.closePath(); ctx.fill();
          ctx.restore();
        },
      });
    }
  },
  pagoda(p, G) { // 玲珑七宝塔
    Snd.play('gong'); Snd.play('boom');
    const tx = clamp(p.x + p.dir * 200, 120, G.room.w - 120);
    G.addShake(18);
    FX.groundRing(tx, '#ffa848', 360, 0.65);
    G.fx({
      layer: 'front', t: 0, life: 1.4, x: tx,
      update(dt) { this.t += dt; return this.t < this.life; },
      draw(ctx) {
        const u = this.t / this.life;
        const drop = u < 0.14 ? Ease.outCubic(u / 0.14) : 1;
        const a = u > 0.65 ? 1 - (u - 0.65) / 0.35 : 1;
        const base = lerp(-340, GROUND, drop);
        ctx.save(); ctx.globalAlpha = a; ctx.globalCompositeOperation = 'lighter';
        drawGlow(ctx, this.x, base - 130, 200, '#ffa848', 0.45 * a);
        ctx.globalCompositeOperation = 'source-over';
        for (let t = 0; t < 7; t++) {
          const tw = 96 - t * 11, ty = base - t * 32;
          ctx.fillStyle = '#6c3810'; ctx.fillRect(this.x - tw * 0.34, ty - 28, tw * 0.68, 28);
          ctx.fillStyle = '#ffd260';
          ctx.beginPath(); ctx.moveTo(this.x - tw * 0.56, ty - 26); ctx.lineTo(this.x, ty - 42); ctx.lineTo(this.x + tw * 0.56, ty - 26); ctx.closePath(); ctx.fill();
        }
        ctx.restore();
      },
    });
    G.attack({
      team: 'player', owner: p, x: tx, y: GROUND - 120, w: 620, h: 280,
      dmg: 2.8, kb: 0, up: -240, stun: 2.2, hitstop: 0.08, shake: 15, poiseDmg: 100, life: 0.22, color: '#ffa848',
    });
  },
  vessel(p, G) { // 太初阴阳瓶
    Snd.play('laser'); Snd.play('boom');
    G.addShake(14);
    const dir = p.dir;
    G.attack({
      team: 'player', owner: p, x: p.x + dir * 320, y: p.y - 54, w: 640, h: 125,
      dmg: 0.85, kb: dir * 180, up: -140, stun: 0.4, hitstop: 0.03, shake: 8, poiseDmg: 30,
      life: 0.9, rehit: 0.2, pierce: true, color: '#d090ff',
      draw(ctx) {
        const a = Math.sin(clamp(this.t / this.life, 0, 1) * PI);
        ctx.save(); ctx.globalAlpha = a; ctx.globalCompositeOperation = 'lighter';
        const sx = p.x + dir * 24, sy = p.y - 54, ex = sx + dir * 640;
        ctx.strokeStyle = rgba('#d090ff', 0.65); ctx.lineWidth = 48 * a;
        ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, sy); ctx.stroke();
        ctx.strokeStyle = rgba('#ffffff', 0.95); ctx.lineWidth = 14 * a;
        ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, sy); ctx.stroke();
        drawGlow(ctx, sx, sy, 55, '#d090ff', 0.8 * a);
        ctx.restore();
      },
    });
  },
};
