'use strict';
/* ============================================================
 *  MAIN — Persistent Profile, App Coordinator & Game Loop
 * ============================================================ */

const App = {
  canvas: null,
  ctx: null,
  scene: null,
  save: null,
  _lastTime: 0,

  makeDefaultSave() {
    const heroes = {};
    for (const id of HERO_ORDER) {
      const w = LootGen.roll(1, 1, 'weapon');
      w.name = ({
        wukong: '玄铁金箍棒',
        bajie: '冰魄九齿耙',
        sha: '新月流沙杖',
        tang: '九环紫檀杖',
        bailong: '玉龙寒霜剑',
      })[id];
      heroes[id] = {
        lv: 1,
        xp: 0,
        equip: { weapon: w, armor: LootGen.roll(1, 0, 'armor'), acc: null },
        treasure: null,
      };
    }
    return {
      heroId: 'wukong',
      unlockedStage: 1,
      nightmareUnlocked: false,
      nightmare: false,
      prologueSeen: false,
      coins: 120,
      souls: 25,
      bag: [
        LootGen.roll(1, 2, 'acc'),
        LootGen.roll(1, 1, 'weapon'),
      ],
      treasures: [],
      heroes,
      grades: {},
      audio: { master: 0.72, music: 0.48, sfx: 0.80, muted: false },
    };
  },

  sanitizeSave(raw) {
    const def = this.makeDefaultSave();
    if (!raw || typeof raw !== 'object') return def;
    const s = Object.assign(def, raw);
    if (!HEROES[s.heroId]) s.heroId = 'wukong';
    s.unlockedStage = clamp(s.unlockedStage || 1, 1, STAGES.length);
    s.coins = Math.max(0, Math.round(s.coins || 0));
    s.souls = Math.max(0, Math.round(s.souls || 0));
    if (!Array.isArray(s.bag)) s.bag = [];
    if (!Array.isArray(s.treasures)) s.treasures = [];
    if (!s.grades || typeof s.grades !== 'object') s.grades = {};
    if (!s.heroes || typeof s.heroes !== 'object') s.heroes = def.heroes;
    for (const id of HERO_ORDER) {
      if (!s.heroes[id]) s.heroes[id] = def.heroes[id];
      else {
        const hp = s.heroes[id];
        hp.lv = Math.max(1, hp.lv || 1);
        hp.xp = Math.max(0, hp.xp || 0);
        if (!hp.equip) hp.equip = { weapon: null, armor: null, acc: null };
      }
    }
    if (!s.nightmareUnlocked) s.nightmare = false;
    if (s.audio) Object.assign(Snd.settings, s.audio);
    return s;
  },

  resetSave() {
    this.save = this.makeDefaultSave();
    this.persist();
  },

  persist() {
    this.save.audio = Object.assign({}, Snd.settings);
    Save.write(this.save);
  },

  addItem(item) {
    if (!item) return false;
    if (this.save.bag.length >= 40) {
      const v = LootGen.sellValue(item);
      this.save.coins += v;
      if (this.scene && this.scene.stage && this.scene.stage.toast) {
        this.scene.stage.toast(`行囊已满，自动折价售出`, '#ffd868', `${item.name} → +${v} 灵石`);
      }
      return false;
    }
    this.save.bag.push(item);
    return true;
  },

  onStageWin(stageDef, stage, grade) {
    const idx = STAGES.findIndex(s => s.id === stageDef.id);
    if (idx >= 0) {
      this.save.unlockedStage = Math.max(this.save.unlockedStage, Math.min(STAGES.length, idx + 2));
    }
    let firstNightmare = false;
    if (stageDef.id === 's5' && !this.save.nightmareUnlocked) {
      this.save.nightmareUnlocked = true;
      firstNightmare = true;
    }
    const order = { '平': 1, '良': 2, '妙': 3, '神': 4 };
    const prev = this.save.grades[stageDef.id];
    if (!prev || (order[grade] || 0) > (order[prev] || 0)) {
      this.save.grades[stageDef.id] = grade;
    }
    this.persist();
    this.enterScene(new ResultScene(true, stageDef, stage, grade, firstNightmare));
  },

  enterScene(nextScene) {
    if (!this.scene) {
      this.scene = nextScene;
      return;
    }
    InkTransition.start(() => {
      this.scene = nextScene;
    });
  },

  toggleFullscreen() {
    const el = document.documentElement;
    if (!document.fullscreenElement) {
      if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
    } else {
      if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
    }
  },

  init() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d', { alpha: false });
    this.canvas.width = W;
    this.canvas.height = H;

    this.save = this.sanitizeSave(Save.load());
    Snd.applyVolumes();
    Post.init();
    Input.init(this.canvas);

    this.scene = new TitleScene();
    this._lastTime = performance.now();

    const step = (now) => {
      const dt = Math.min(0.05, Math.max(0.001, (now - this._lastTime) * 0.001));
      this._lastTime = now;
      this.tick(dt);
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  },

  tick(dt) {
    Input.pollPad();

    if (Input.hit('mute')) {
      Snd.settings.muted = !Snd.settings.muted;
      Snd.applyVolumes();
      this.persist();
    }
    if (Input.hit('fullscreen')) {
      this.toggleFullscreen();
    }

    const blockingTransition = InkTransition.update(dt);
    if (!blockingTransition && this.scene && this.scene.update) {
      this.scene.update(dt);
    }

    if (this.scene && this.scene.draw) {
      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      this.scene.draw(this.ctx);
    }
    InkTransition.draw(this.ctx);

    Input.endFrame();
  },
};

window.addEventListener('DOMContentLoaded', () => {
  App.init();
});
