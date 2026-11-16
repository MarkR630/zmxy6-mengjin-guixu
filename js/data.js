'use strict';
/* ============================================================
 *  DATA — 造梦西游Ⅵ · 梦烬归墟
 *  Heroes, Combat Combos, Treasures(法宝), Enemies, Stages, Loot
 * ============================================================ */
const HERO_ORDER = ['wukong', 'bajie', 'sha', 'tang', 'bailong'];

function xpNeed(lv) { return Math.round(60 * Math.pow(lv, 1.5)); }

function heroBaseStats(hero, lv) {
  const m = 1 + (lv - 1) * 0.095;
  const s = hero.stats;
  return {
    hp: Math.round(s.hp * m),
    mp: Math.round(s.mp * (1 + (lv - 1) * 0.06)),
    atk: Math.round(s.atk * m),
    def: Math.round(s.def * (1 + (lv - 1) * 0.085)),
    crit: s.crit,
    spd: s.spd,
  };
}

const HEROES = {
  wukong: {
    id: 'wukong',
    name: '孙悟空',
    title: '齐天焚烬',
    quote: '“天地若以此身作薪，俺便以金箍棒再劈鸿蒙！”',
    lore: '灵明石猴历七魔王、战十殿、踏天宫。归墟裂隙开启之时，战意化作永不熄灭的烬火。高机动连段与疾风棍法冠绝三界。',
    color: '#ff9a30',
    color2: '#3a0e06',
    accent: '#ffd868',
    idlePose: 'idle',
    stats: { hp: 560, mp: 180, atk: 54, def: 26, crit: 0.22, spd: 425 },
    radar: [0.92, 0.88, 0.65, 0.98, 0.62, 0.78], // 攻 爆 存 机 控 范
    combo: [
      {
        name: '横扫千军', windup: 0.055, active: 0.09, recover: 0.14,
        pose0: P(0.18, -0.1, 2.3, -0.3, -0.4, 0.6, 0.5, -0.4, -0.4, -0.2, 3.6),
        pose1: P(0.32, 0.05, 1.45, 0.1, -0.6, 0.5, 0.6, -0.5, -0.5, -0.2, 1.1),
        pose2: P(0.24, 0.05, 1.1, 0.25, -0.5, 0.6, 0.5, -0.4, -0.4, -0.2, 0.55),
        dmg: 1.0, kb: 160, up: -80, reach: 108, h: 86, yoff: -54, hitstop: 0.032, shake: 3.5, lunge: 130, snd: 'swing',
        crescent: [108, -1.35, 0.85],
      },
      {
        name: '反撩破风', windup: 0.05, active: 0.09, recover: 0.14,
        pose0: P(0.2, 0.05, 0.6, 0.3, -0.5, 0.5, 0.5, -0.4, -0.4, -0.2, 0.45),
        pose1: P(0.26, -0.15, 2.35, -0.15, -0.3, 0.7, 0.55, -0.45, -0.45, -0.25, 2.65),
        pose2: P(0.15, -0.1, 2.5, -0.2, -0.3, 0.6, 0.4, -0.3, -0.3, -0.2, 3.05),
        dmg: 1.12, kb: 180, up: -140, reach: 112, h: 92, yoff: -60, hitstop: 0.036, shake: 4.5, lunge: 160, snd: 'swing',
        crescent: [112, 0.9, -1.45],
      },
      {
        name: '灵猴突刺', windup: 0.055, active: 0.11, recover: 0.15,
        pose0: P(0.08, 0.05, -0.35, 1.45, 0.2, 0.9, 0.3, -0.3, -0.4, -0.3, 1.55),
        pose1: P(0.54, 0.1, 1.6, 0.0, -0.9, 0.3, 0.95, -0.7, -0.8, -0.3, 1.57),
        pose2: P(0.4, 0.08, 1.5, 0.15, -0.7, 0.4, 0.75, -0.5, -0.6, -0.25, 1.55),
        dmg: 1.25, kb: 220, up: -60, reach: 132, h: 68, yoff: -52, hitstop: 0.042, shake: 5.5, lunge: 310, snd: 'swingHeavy',
      },
      {
        name: '崩天裂地', windup: 0.09, active: 0.12, recover: 0.22,
        pose0: P(-0.15, -0.3, 2.95, -0.15, 2.4, 0.3, 0.4, -0.4, -0.4, -0.2, 3.55),
        pose1: P(0.62, 0.22, 1.15, 0.1, -0.8, 0.4, 0.95, -0.9, -0.7, -0.3, 0.65),
        pose2: P(0.45, 0.15, 0.85, 0.25, -0.6, 0.5, 0.8, -0.7, -0.5, -0.25, 0.45),
        dmg: 1.75, kb: 420, up: -380, reach: 135, h: 115, yoff: -62, hitstop: 0.075, shake: 11, lunge: 230, snd: 'swingHeavy',
        crescent: [132, -2.0, 0.95],
      },
    ],
    air: {
      windup: 0.05, active: 0.1, recover: 0.14,
      pose0: P(0.1, -0.2, 2.7, -0.2, -0.6, 0.8, 0.9, -1.3, 0.2, -1.0, 3.3),
      pose1: P(0.38, 0.15, 1.2, 0.15, -0.7, 0.6, 0.6, -0.9, -0.2, -0.8, 0.8),
      pose2: P(0.2, 0.05, 1.4, 0.3, -0.8, 0.6, 0.5, -0.8, -0.3, -0.6, 1.8),
      dmg: 1.18, kb: 190, up: -240, reach: 112, h: 100, yoff: -54, hitstop: 0.04, shake: 5, bounce: -320, snd: 'swing',
      crescent: [108, -1.7, 1.1],
    },
    launcher: {
      windup: 0.06, active: 0.11, recover: 0.16,
      pose0: P(0.3, 0.1, 0.35, 0.5, -0.3, 0.5, 0.7, -0.8, -0.4, -0.3, 0.3),
      pose1: P(-0.22, -0.3, 2.75, -0.1, 1.7, 0.2, 0.35, -0.2, -0.45, -0.3, 2.95),
      pose2: P(-0.1, -0.2, 2.5, 0.1, 1.2, 0.3, 0.3, -0.2, -0.3, -0.2, 2.7),
      dmg: 1.32, kb: 90, up: -820, reach: 105, h: 120, yoff: -68, hitstop: 0.055, shake: 7, lunge: 80, snd: 'swingHeavy',
      crescent: [106, 1.0, -1.85],
    },
    plunge: { dmg: 1.65, kb: 290, up: -320, reach: 124, h: 90, hitstop: 0.065, shake: 11 },
    skills: [
      { id: 's1', key: 'U', glyph: '影', name: '棍影千重', desc: '疾影向前爆发七段连续棍影戳击，压制并重创前方敌阵。', mp: 24, cd: 4.5, color: '#ff9a30' },
      { id: 's2', key: 'I', glyph: '云', name: '筋斗云破', desc: '踏云化金虹突进穿越敌群，无敌闪烁并在轨迹留下爆裂火焰。', mp: 28, cd: 6.0, color: '#ffd050' },
      { id: 's3', key: 'O', glyph: '擎', name: '如意擎天', desc: '金箍棒化作遮天巨柱从天坠落，引动烈焰震波挑飞周遭敌人。', mp: 42, cd: 8.5, color: '#ff5228' },
      { id: 'ult', key: 'Space', glyph: '天', name: '法天象地', desc: '梦烬满格时释放：化身万丈金色法相横扫九霄，并进入6秒梦烬觉醒状态！', mp: 0, cd: 0, color: '#ffc840' },
    ],
  },

  bajie: {
    id: 'bajie',
    name: '猪八戒',
    title: '净坛玄煞',
    quote: '“莫道呆子贪眠懒散，钉耙落处，山河亦要让三分！”',
    lore: '昔日天蓬元帅掌八万水兵，今身披玄铁重铠。极高气血与强力霸体技能使其成为冲阵不倒之砥柱。',
    color: '#5ac8ff',
    color2: '#0b182e',
    accent: '#a2e4ff',
    idlePose: 'idle',
    stats: { hp: 760, mp: 155, atk: 58, def: 42, crit: 0.14, spd: 345 },
    radar: [0.85, 0.78, 0.98, 0.52, 0.86, 0.85],
    combo: [
      {
        name: '横耙破阵', windup: 0.09, active: 0.11, recover: 0.17,
        pose0: P(0.14, -0.05, 2.4, -0.3, -0.5, 0.5, 0.45, -0.35, -0.4, -0.25, 3.65),
        pose1: P(0.34, 0.08, 1.35, 0.1, -0.6, 0.5, 0.65, -0.5, -0.5, -0.25, 1.05),
        pose2: P(0.24, 0.05, 1.05, 0.25, -0.5, 0.6, 0.5, -0.4, -0.4, -0.2, 0.6),
        dmg: 1.2, kb: 220, up: -90, reach: 116, h: 92, yoff: -54, hitstop: 0.045, shake: 6, lunge: 110, snd: 'swingHeavy',
        crescent: [112, -1.4, 0.95],
      },
      {
        name: '倒打一耙', windup: 0.08, active: 0.11, recover: 0.17,
        pose0: P(0.18, 0.05, 0.5, 0.4, -0.4, 0.5, 0.5, -0.4, -0.4, -0.2, 0.4),
        pose1: P(0.26, -0.1, 2.35, -0.1, -0.3, 0.7, 0.55, -0.45, -0.45, -0.25, 2.6),
        pose2: P(0.14, -0.08, 2.45, -0.2, -0.3, 0.6, 0.4, -0.3, -0.3, -0.2, 2.95),
        dmg: 1.32, kb: 160, up: -210, reach: 114, h: 98, yoff: -58, hitstop: 0.05, shake: 6.5, lunge: 130, snd: 'swingHeavy',
        crescent: [110, 0.9, -1.5],
      },
      {
        name: '旋耙推山', windup: 0.09, active: 0.12, recover: 0.18,
        pose0: P(-0.08, 0, -0.4, 1.2, 0.1, 0.8, 0.3, -0.3, -0.4, -0.3, 4.4),
        pose1: P(0.5, 0.14, 1.55, 0.05, -0.8, 0.3, 0.9, -0.7, -0.7, -0.3, 1.55),
        pose2: P(0.35, 0.1, 1.35, 0.2, -0.6, 0.4, 0.7, -0.5, -0.5, -0.25, 1.3),
        dmg: 1.45, kb: 320, up: -120, reach: 125, h: 88, yoff: -54, hitstop: 0.06, shake: 8, lunge: 190, snd: 'swingHeavy',
      },
      {
        name: '九齿崩岳', windup: 0.13, active: 0.14, recover: 0.25,
        pose0: P(-0.2, -0.3, 2.95, -0.1, 2.5, 0.2, 0.4, -0.4, -0.4, -0.2, 3.65),
        pose1: P(0.64, 0.24, 1.05, 0.15, -0.8, 0.4, 1.0, -0.95, -0.7, -0.3, 0.55),
        pose2: P(0.45, 0.15, 0.85, 0.25, -0.6, 0.5, 0.8, -0.7, -0.5, -0.25, 0.4),
        dmg: 2.15, kb: 470, up: -440, reach: 145, h: 120, yoff: -62, hitstop: 0.09, shake: 14, lunge: 200, snd: 'swingHeavy',
        crescent: [138, -2.1, 1.0],
      },
    ],
    air: {
      windup: 0.07, active: 0.12, recover: 0.16,
      pose0: P(0.1, -0.2, 2.7, -0.2, -0.6, 0.8, 0.9, -1.3, 0.2, -1.0, 3.3),
      pose1: P(0.42, 0.18, 1.1, 0.15, -0.7, 0.6, 0.6, -0.9, -0.2, -0.8, 0.7),
      pose2: P(0.2, 0.05, 1.4, 0.3, -0.8, 0.6, 0.5, -0.8, -0.3, -0.6, 1.7),
      dmg: 1.4, kb: 240, up: -280, reach: 118, h: 105, yoff: -54, hitstop: 0.055, shake: 7, bounce: -280, snd: 'swingHeavy',
      crescent: [114, -1.8, 1.15],
    },
    launcher: {
      windup: 0.08, active: 0.12, recover: 0.18,
      pose0: P(0.32, 0.1, 0.3, 0.5, -0.3, 0.5, 0.7, -0.8, -0.4, -0.3, 0.25),
      pose1: P(-0.24, -0.3, 2.8, -0.1, 1.7, 0.2, 0.35, -0.2, -0.45, -0.3, 3.0),
      pose2: P(-0.1, -0.2, 2.5, 0.1, 1.2, 0.3, 0.3, -0.2, -0.3, -0.2, 2.7),
      dmg: 1.5, kb: 100, up: -840, reach: 110, h: 122, yoff: -68, hitstop: 0.07, shake: 9, lunge: 80, snd: 'swingHeavy',
      crescent: [110, 1.0, -1.85],
    },
    plunge: { dmg: 1.95, kb: 360, up: -380, reach: 146, h: 98, hitstop: 0.085, shake: 15 },
    skills: [
      { id: 's1', key: 'U', glyph: '旋', name: '钉耙旋风', desc: '霸体旋转九齿钉耙化作寒潮旋风，牵引并连续绞杀周围敌军。', mp: 26, cd: 5.5, color: '#5ac8ff' },
      { id: 's2', key: 'I', glyph: '撞', name: '天蓬冲撞', desc: '化身玄铁重甲战车霸体猛冲，撞飞沿途一切敌怪并激起震荡气浪。', mp: 24, cd: 5.0, color: '#82d8ff' },
      { id: 's3', key: 'O', glyph: '裂', name: '猪突地裂', desc: '跃起全力以钉耙凿地，激起双向扩散的玄冰地裂冲击波！', mp: 40, cd: 8.0, color: '#38a4f0' },
      { id: 'ult', key: 'Space', glyph: '河', name: '银河倒悬', desc: '梦烬满格时释放：引天河水师怒涛横卷天地，镇碎群魔并唤醒天蓬战意！', mp: 0, cd: 0, color: '#68dcff' },
    ],
  },

  sha: {
    id: 'sha',
    name: '沙悟净',
    title: '卷帘镇渊',
    quote: '“流沙万骨沉渊底，半轮寒月镇妖邪。”',
    lore: '前身为天庭卷帘大将，镇守流沙河渊数百载。攻守一体，兼备牵制阵法、远程飞铲与护体神盾。',
    color: '#3ae0b0',
    color2: '#07221c',
    accent: '#9effe2',
    idlePose: 'idle',
    stats: { hp: 640, mp: 205, atk: 49, def: 34, crit: 0.17, spd: 375 },
    radar: [0.76, 0.72, 0.85, 0.74, 0.95, 0.90],
    combo: [
      {
        name: '新月横斩', windup: 0.065, active: 0.1, recover: 0.15,
        pose0: P(0.16, -0.05, 2.35, -0.25, -0.4, 0.5, 0.45, -0.35, -0.4, -0.2, 3.55),
        pose1: P(0.32, 0.06, 1.4, 0.08, -0.6, 0.5, 0.6, -0.45, -0.48, -0.22, 1.15),
        pose2: P(0.22, 0.04, 1.1, 0.22, -0.5, 0.5, 0.5, -0.4, -0.4, -0.2, 0.65),
        dmg: 1.05, kb: 170, up: -80, reach: 118, h: 86, yoff: -54, hitstop: 0.036, shake: 4.5, lunge: 115, snd: 'swing',
        crescent: [116, -1.4, 0.9],
      },
      {
        name: '宝杖回撩', windup: 0.06, active: 0.1, recover: 0.15,
        pose0: P(0.18, 0.05, 0.55, 0.35, -0.4, 0.5, 0.48, -0.4, -0.4, -0.2, 0.5),
        pose1: P(0.24, -0.12, 2.3, -0.1, -0.3, 0.65, 0.55, -0.45, -0.45, -0.22, 2.65),
        pose2: P(0.12, -0.08, 2.45, -0.2, -0.3, 0.55, 0.4, -0.3, -0.3, -0.2, 3.0),
        dmg: 1.15, kb: 170, up: -160, reach: 118, h: 92, yoff: -58, hitstop: 0.04, shake: 5, lunge: 135, snd: 'swing',
        crescent: [116, 0.9, -1.45],
      },
      {
        name: '渊流双连', windup: 0.065, active: 0.11, recover: 0.16,
        pose0: P(-0.05, 0.02, -0.3, 1.35, 0.15, 0.8, 0.32, -0.3, -0.4, -0.3, 1.55),
        pose1: P(0.48, 0.12, 1.58, 0.0, -0.8, 0.35, 0.9, -0.65, -0.75, -0.3, 1.57),
        pose2: P(0.35, 0.08, 1.45, 0.15, -0.65, 0.4, 0.7, -0.5, -0.55, -0.25, 1.55),
        dmg: 1.28, kb: 240, up: -90, reach: 132, h: 74, yoff: -54, hitstop: 0.045, shake: 6, lunge: 230, snd: 'swingHeavy',
      },
      {
        name: '半月斩渊', windup: 0.1, active: 0.13, recover: 0.22,
        pose0: P(-0.15, -0.25, 2.9, -0.1, 2.35, 0.25, 0.4, -0.4, -0.4, -0.2, 3.55),
        pose1: P(0.58, 0.2, 1.15, 0.1, -0.8, 0.4, 0.92, -0.85, -0.65, -0.3, 0.65),
        pose2: P(0.4, 0.14, 0.88, 0.22, -0.6, 0.48, 0.75, -0.65, -0.5, -0.25, 0.45),
        dmg: 1.85, kb: 380, up: -340, reach: 138, h: 112, yoff: -60, hitstop: 0.075, shake: 11, lunge: 210, snd: 'swingHeavy',
        crescent: [134, -2.0, 0.95],
      },
    ],
    air: {
      windup: 0.055, active: 0.1, recover: 0.14,
      pose0: P(0.1, -0.2, 2.65, -0.2, -0.6, 0.8, 0.85, -1.25, 0.2, -1.0, 3.2),
      pose1: P(0.36, 0.15, 1.2, 0.15, -0.7, 0.6, 0.6, -0.9, -0.2, -0.8, 0.8),
      pose2: P(0.18, 0.05, 1.4, 0.3, -0.8, 0.6, 0.5, -0.8, -0.3, -0.6, 1.8),
      dmg: 1.22, kb: 200, up: -240, reach: 116, h: 100, yoff: -54, hitstop: 0.045, shake: 5.5, bounce: -300, snd: 'swing',
      crescent: [112, -1.7, 1.1],
    },
    launcher: {
      windup: 0.065, active: 0.11, recover: 0.16,
      pose0: P(0.28, 0.1, 0.35, 0.48, -0.3, 0.5, 0.68, -0.8, -0.4, -0.3, 0.3),
      pose1: P(-0.2, -0.28, 2.75, -0.1, 1.65, 0.2, 0.35, -0.2, -0.45, -0.3, 2.95),
      pose2: P(-0.08, -0.18, 2.5, 0.1, 1.2, 0.3, 0.3, -0.2, -0.3, -0.2, 2.7),
      dmg: 1.35, kb: 95, up: -800, reach: 112, h: 120, yoff: -68, hitstop: 0.058, shake: 7.5, lunge: 85, snd: 'swingHeavy',
      crescent: [110, 1.0, -1.85],
    },
    plunge: { dmg: 1.7, kb: 300, up: -320, reach: 132, h: 90, hitstop: 0.07, shake: 12 },
    skills: [
      { id: 's1', key: 'U', glyph: '铲', name: '月牙飞铲', desc: '掷出旋转的寒光月牙宝铲向前穿透敌人，飞行至尽头后飞回再伤一次。', mp: 24, cd: 4.5, color: '#3ae0b0' },
      { id: 's2', key: 'I', glyph: '陷', name: '流沙陷阵', desc: '在前方召唤漩涡流沙法阵，大幅减速并持续吞噬阵内群魔生命。', mp: 32, cd: 7.5, color: '#45c8a0' },
      { id: 's3', key: 'O', glyph: '盾', name: '卷帘护体', desc: '九枚骷髅念珠化作玄碧护盾环绕周身6秒，减免65%伤害并震伤近敌。', mp: 30, cd: 9.0, color: '#88ffe0' },
      { id: 'ult', key: 'Space', glyph: '沙', name: '流沙天倾', desc: '梦烬满格时释放：唤起遮天蔽日的流沙龙卷狂飙撕碎天地，进入觉醒状态！', mp: 0, cd: 0, color: '#50ffd0' },
    ],
  },

  tang: {
    id: 'tang',
    name: '唐三藏',
    title: '旃檀禅心',
    quote: '“一念慈悲度苦厄，一念金刚破魔障！”',
    lore: '金蝉子十世修身，持九环锡杖披锦襕袈裟。中远程佛法灵弹与治愈普照兼具，擅长以法阵镇魔渡厄。',
    color: '#ffd060',
    color2: '#2e1606',
    accent: '#fff4ba',
    idlePose: 'idleCast',
    stats: { hp: 500, mp: 260, atk: 56, def: 24, crit: 0.19, spd: 365 },
    radar: [0.88, 0.85, 0.68, 0.65, 0.88, 0.96],
    combo: [
      {
        name: '禅杖点波', windup: 0.06, active: 0.09, recover: 0.14,
        pose0: P(0.05, -0.1, 2.0, -0.2, -0.3, 0.4, 0.3, -0.2, -0.25, -0.15, 3.0),
        pose1: P(0.18, 0, 1.55, 0.0, -0.4, 0.4, 0.45, -0.3, -0.35, -0.2, 2.2),
        pose2: P(0.1, -0.05, 1.4, 0.15, -0.3, 0.4, 0.35, -0.25, -0.3, -0.15, 2.6),
        dmg: 0.95, kb: 140, up: -60, reach: 100, h: 80, yoff: -54, hitstop: 0.028, shake: 3, lunge: 40, snd: 'bell',
        proj: { sp: 740, r: 16, dmg: 0.95, life: 0.48, color: '#ffd060' },
      },
      {
        name: '六环震音', windup: 0.06, active: 0.09, recover: 0.14,
        pose0: P(0.08, -0.05, 0.8, 0.3, -0.4, 0.5, 0.35, -0.3, -0.3, -0.2, 1.6),
        pose1: P(0.18, -0.1, 2.1, -0.1, -0.2, 0.5, 0.45, -0.35, -0.35, -0.2, 2.8),
        pose2: P(0.1, -0.05, 2.2, -0.15, -0.2, 0.4, 0.3, -0.2, -0.25, -0.15, 2.95),
        dmg: 1.05, kb: 160, up: -120, reach: 105, h: 86, yoff: -56, hitstop: 0.032, shake: 4, lunge: 50, snd: 'bell',
        proj: { sp: 780, r: 20, dmg: 1.05, life: 0.52, color: '#ffe480' },
      },
      {
        name: '禅光莲印', windup: 0.07, active: 0.1, recover: 0.15,
        pose0: P(-0.04, -0.1, 2.4, -0.2, 2.1, 0.2, 0.3, -0.2, -0.3, -0.2, 3.2),
        pose1: P(0.25, 0.05, 1.55, 0.0, 1.55, 0.0, 0.5, -0.35, -0.4, -0.2, 1.65),
        pose2: P(0.15, 0, 1.4, 0.1, 1.3, 0.1, 0.4, -0.3, -0.35, -0.2, 2.2),
        dmg: 1.25, kb: 220, up: -100, reach: 115, h: 88, yoff: -54, hitstop: 0.04, shake: 5, lunge: 70, snd: 'cast',
        proj: { sp: 860, r: 24, dmg: 1.25, life: 0.58, color: '#fff2a0', pierce: true },
      },
      {
        name: '大日如来印', windup: 0.1, active: 0.13, recover: 0.2,
        pose0: P(-0.15, -0.28, 2.95, -0.1, 2.8, -0.1, 0.35, -0.3, -0.35, -0.2, 3.3),
        pose1: P(0.35, 0.12, 1.5, 0.0, 1.35, 0.1, 0.65, -0.5, -0.5, -0.25, 1.45),
        pose2: P(0.2, 0.05, 1.3, 0.15, 1.1, 0.2, 0.5, -0.4, -0.4, -0.2, 2.3),
        dmg: 1.75, kb: 360, up: -300, reach: 175, h: 120, yoff: -60, hitstop: 0.07, shake: 10, lunge: 90, snd: 'gong',
        crescent: [155, -1.8, 0.9],
      },
    ],
    air: {
      windup: 0.05, active: 0.1, recover: 0.14,
      pose0: P(0.05, -0.15, 2.5, -0.1, -0.4, 0.6, 0.7, -1.0, 0.2, -0.8, 3.1),
      pose1: P(0.25, 0.1, 1.45, 0.05, -0.5, 0.5, 0.5, -0.8, -0.2, -0.7, 1.7),
      pose2: P(0.12, 0.05, 1.4, 0.2, -0.5, 0.5, 0.4, -0.6, -0.2, -0.5, 2.5),
      dmg: 1.15, kb: 170, up: -220, reach: 112, h: 96, yoff: -54, hitstop: 0.04, shake: 4.5, bounce: -300, snd: 'bell',
      proj: { sp: 780, r: 20, dmg: 1.05, life: 0.46, color: '#ffd060' },
    },
    launcher: {
      windup: 0.06, active: 0.11, recover: 0.16,
      pose0: P(0.15, 0.08, 0.6, 0.3, -0.2, 0.4, 0.5, -0.6, -0.3, -0.2, 1.0),
      pose1: P(-0.15, -0.25, 2.75, 0.0, 2.4, 0.1, 0.3, -0.2, -0.35, -0.2, 3.15),
      pose2: P(-0.05, -0.15, 2.5, 0.1, 2.0, 0.2, 0.25, -0.2, -0.3, -0.15, 2.9),
      dmg: 1.3, kb: 90, up: -800, reach: 112, h: 120, yoff: -68, hitstop: 0.052, shake: 7, lunge: 40, snd: 'cast',
      crescent: [108, 0.9, -1.85],
    },
    plunge: { dmg: 1.65, kb: 320, up: -300, reach: 144, h: 92, hitstop: 0.065, shake: 12 },
    skills: [
      { id: 's1', key: 'U', glyph: '咒', name: '紧箍金刚咒', desc: '念诵真言并发射五道追踪金色佛印符文，穿透敌群爆发出禅光伤害。', mp: 24, cd: 4.5, color: '#ffd060' },
      { id: 's2', key: 'I', glyph: '照', name: '佛光普照', desc: '展开慈悲莲华光环回复自身22%气血，同时净化震退周围一切妖邪。', mp: 36, cd: 9.0, color: '#fff2a0' },
      { id: 's3', key: 'O', glyph: '钵', name: '紫金降魔钵', desc: '凌空祭出巨大金色降魔钵砸落前方，困缚并震晕大范围敌人。', mp: 40, cd: 8.5, color: '#ffad38' },
      { id: 'ult', key: 'Space', glyph: '佛', name: '万佛朝宗', desc: '梦烬满格时释放：九天金佛巨掌轰然压顶碾碎万魔，并进入圣光觉醒！', mp: 0, cd: 0, color: '#ffe478' },
    ],
  },

  bailong: {
    id: 'bailong',
    name: '小白龙',
    title: '玉龙沧溟',
    quote: '“龙渊剑冷照霜雪，万里沧溟一剑开！”',
    lore: '西海玉龙三太子，脱胎龙身化剑客。极端敏捷与暴击爆发，以冰霜剑气与游龙身法斩尽一切虚妄。',
    color: '#6ad0ff',
    color2: '#071c2c',
    accent: '#daf6ff',
    idlePose: 'idleSw',
    stats: { hp: 525, mp: 195, atk: 52, def: 25, crit: 0.28, spd: 440 },
    radar: [0.95, 0.96, 0.60, 0.96, 0.72, 0.82],
    combo: [
      {
        name: '霜刃初绽', windup: 0.045, active: 0.08, recover: 0.13,
        pose0: P(0.18, -0.05, 2.2, -0.2, -0.4, 0.5, 0.45, -0.35, -0.4, -0.2, 2.7),
        pose1: P(0.36, 0.05, 1.45, 0.05, -0.6, 0.5, 0.65, -0.5, -0.5, -0.2, 0.85),
        pose2: P(0.24, 0.04, 1.1, 0.2, -0.5, 0.5, 0.5, -0.4, -0.4, -0.2, 0.5),
        dmg: 0.98, kb: 140, up: -70, reach: 106, h: 82, yoff: -54, hitstop: 0.028, shake: 3, lunge: 150, snd: 'swing',
        crescent: [104, -1.3, 0.85],
      },
      {
        name: '回雪流风', windup: 0.045, active: 0.08, recover: 0.13,
        pose0: P(0.18, 0.05, 0.5, 0.3, -0.5, 0.5, 0.5, -0.4, -0.4, -0.2, 0.45),
        pose1: P(0.28, -0.15, 2.3, -0.1, -0.3, 0.65, 0.55, -0.45, -0.45, -0.22, 2.55),
        pose2: P(0.15, -0.1, 2.45, -0.2, -0.3, 0.55, 0.4, -0.3, -0.3, -0.2, 2.9),
        dmg: 1.08, kb: 150, up: -150, reach: 108, h: 88, yoff: -58, hitstop: 0.032, shake: 4, lunge: 165, snd: 'swing',
        crescent: [106, 0.85, -1.4],
      },
      {
        name: '疾龙贯月', windup: 0.05, active: 0.1, recover: 0.14,
        pose0: P(0.06, 0.02, -0.4, 1.45, 0.15, 0.8, 0.3, -0.3, -0.4, -0.3, 1.55),
        pose1: P(0.58, 0.1, 1.6, 0.0, -0.9, 0.3, 0.98, -0.7, -0.82, -0.3, 1.57),
        pose2: P(0.42, 0.08, 1.5, 0.15, -0.7, 0.4, 0.75, -0.5, -0.6, -0.25, 1.55),
        dmg: 1.25, kb: 200, up: -60, reach: 132, h: 68, yoff: -52, hitstop: 0.04, shake: 5, lunge: 340, snd: 'ice',
      },
      {
        name: '沧溟断海', windup: 0.08, active: 0.12, recover: 0.2,
        pose0: P(-0.18, -0.3, 2.95, -0.1, 2.35, 0.25, 0.4, -0.4, -0.4, -0.2, 3.55),
        pose1: P(0.62, 0.2, 1.15, 0.1, -0.8, 0.4, 0.95, -0.85, -0.7, -0.3, 0.6),
        pose2: P(0.44, 0.14, 0.88, 0.22, -0.6, 0.48, 0.78, -0.65, -0.5, -0.25, 0.4),
        dmg: 1.82, kb: 390, up: -360, reach: 140, h: 112, yoff: -62, hitstop: 0.072, shake: 10.5, lunge: 240, snd: 'ice',
        crescent: [136, -2.0, 0.95],
      },
    ],
    air: {
      windup: 0.04, active: 0.09, recover: 0.13,
      pose0: P(0.1, -0.2, 2.65, -0.2, -0.6, 0.8, 0.85, -1.25, 0.2, -1.0, 3.2),
      pose1: P(0.4, 0.15, 1.2, 0.15, -0.7, 0.6, 0.6, -0.9, -0.2, -0.8, 0.75),
      pose2: P(0.2, 0.05, 1.4, 0.3, -0.8, 0.6, 0.5, -0.8, -0.3, -0.6, 1.75),
      dmg: 1.2, kb: 180, up: -250, reach: 110, h: 98, yoff: -54, hitstop: 0.038, shake: 4.5, bounce: -330, snd: 'swing',
      crescent: [106, -1.7, 1.1],
    },
    launcher: {
      windup: 0.05, active: 0.1, recover: 0.15,
      pose0: P(0.28, 0.1, 0.35, 0.48, -0.3, 0.5, 0.68, -0.8, -0.4, -0.3, 0.3),
      pose1: P(-0.22, -0.3, 2.78, -0.1, 1.65, 0.2, 0.35, -0.2, -0.45, -0.3, 2.98),
      pose2: P(-0.08, -0.18, 2.5, 0.1, 1.2, 0.3, 0.3, -0.2, -0.3, -0.2, 2.7),
      dmg: 1.35, kb: 90, up: -840, reach: 108, h: 122, yoff: -68, hitstop: 0.055, shake: 7, lunge: 95, snd: 'ice',
      crescent: [108, 1.0, -1.85],
    },
    plunge: { dmg: 1.72, kb: 300, up: -320, reach: 128, h: 90, hitstop: 0.065, shake: 11 },
    skills: [
      { id: 's1', key: 'U', glyph: '剑', name: '龙吟剑气', desc: '挥出高速极寒弦月剑气穿透整条战线，并留下冰霜裂隙伤害。', mp: 22, cd: 4.0, color: '#6ad0ff' },
      { id: 's2', key: 'I', glyph: '游', name: '游龙闪', desc: '化作霜电穿梭斩击前方320码，无敌闪现并在身后连续引爆五道斩击！', mp: 28, cd: 5.8, color: '#a8ecff' },
      { id: 's3', key: 'O', glyph: '冰', name: '冰龙破', desc: '剑插大地引爆寒脉，前方地面依次刺出六道巨型晶冰龙牙挑飞并冰冻敌军。', mp: 38, cd: 8.0, color: '#42b6ff' },
      { id: 'ult', key: 'Space', glyph: '龙', name: '白龙真身', desc: '梦烬满格时释放：化身太古苍霜玉龙盘旋席卷全屏撕裂千军，并进入冰龙觉醒！', mp: 0, cd: 0, color: '#8ee8ff' },
    ],
  },
};

/* ============================================================
 *  法宝 (Magic Treasures — Classic 造梦西游 Feature, Key: E)
 * ============================================================ */
const TREASURES = {
  gourd: {
    id: 'gourd', name: '紫金红葫芦', glyph: '葫', color: '#ff8a3a', cd: 14,
    desc: '吸聚方圆内众妖并持续灼烧，同时汲取灵气回复自身16%气血。',
  },
  umbrella: {
    id: 'umbrella', name: '混元珍珠伞', glyph: '伞', color: '#ffd868', cd: 15,
    desc: '展开黄金伞盖结界5秒：所受伤害减免70%，并反弹震荡金波！',
  },
  swords: {
    id: 'swords', name: '青云冰火剑阵', glyph: '剑', color: '#6ad8ff', cd: 12,
    desc: '周身凝结六柄御空飞剑，自动索敌急射穿透群魔！',
  },
  pagoda: {
    id: 'pagoda', name: '玲珑七宝塔', glyph: '塔', color: '#ffa848', cd: 16,
    desc: '祭出七宝玲珑塔凌空镇压，对全屏敌军造成重创与2秒眩晕破韧。',
  },
  vessel: {
    id: 'vessel', name: '太初阴阳瓶', glyph: '瓶', color: '#d090ff', cd: 15,
    desc: '吸纳归墟二气，向前轰出毁灭性黑白阴阳混沌洪流！',
  },
};

/* ============================================================
 *  ENEMIES
 * ============================================================ */
const ENEMIES = {
  imp: {
    id: 'imp', name: '烬妖矛兵', style: 'imp', ai: 'melee',
    hp: 135, atk: 18, def: 6, spd: 195, w: 38, h: 72, xp: 24, coin: [6, 12],
    range: 84, cd: 1.35, windup: 0.36, active: 0.14, recover: 0.45, color: '#ff6a28',
  },
  crow: {
    id: 'crow', name: '焚羽火鸦', style: null, ai: 'fly',
    hp: 95, atk: 20, def: 4, spd: 210, w: 46, h: 42, xp: 26, coin: [7, 13],
    range: 360, cd: 2.1, windup: 0.45, color: '#ff5220',
  },
  skeleton: {
    id: 'skeleton', name: '沉渊骨卒', style: 'skeleton', ai: 'melee',
    hp: 170, atk: 24, def: 10, spd: 175, w: 40, h: 78, xp: 32, coin: [9, 16],
    range: 80, cd: 1.3, windup: 0.34, active: 0.14, recover: 0.4, color: '#3ae8d8',
  },
  archer: {
    id: 'archer', name: '玄骨弓手', style: 'archer', ai: 'ranged',
    hp: 120, atk: 23, def: 6, spd: 145, w: 38, h: 78, xp: 34, coin: [10, 18],
    range: 460, minDist: 200, cd: 2.0, windup: 0.5, color: '#40f0dc',
  },
  wisp: {
    id: 'wisp', name: '幽冥鬼火', style: null, ai: 'kamikaze',
    hp: 90, atk: 34, def: 2, spd: 255, w: 36, h: 36, xp: 30, coin: [8, 15],
    range: 56, windup: 0.45, color: '#78ffe8',
  },
  yaksha: {
    id: 'yaksha', name: '巡渊夜叉', style: 'yaksha', ai: 'yaksha',
    hp: 310, atk: 30, def: 16, spd: 220, w: 48, h: 86, xp: 52, coin: [16, 28],
    range: 105, cd: 1.65, windup: 0.38, active: 0.16, recover: 0.45, poise: 60, color: '#40d8ff',
  },
  brute: {
    id: 'brute', name: '熔岩力士', style: 'brute', ai: 'brute',
    hp: 520, atk: 38, def: 22, spd: 125, w: 66, h: 112, xp: 75, coin: [22, 38],
    range: 118, cd: 2.2, windup: 0.62, active: 0.18, recover: 0.7, poise: 100, color: '#ff5a18',
  },
  soldier: {
    id: 'soldier', name: '碎霄天兵', style: 'soldier', ai: 'melee',
    hp: 340, atk: 34, def: 20, spd: 185, w: 44, h: 86, xp: 62, coin: [18, 30],
    range: 105, cd: 1.45, windup: 0.36, active: 0.15, recover: 0.42, poise: 45, color: '#ffd060',
  },
  archerGold: {
    id: 'archerGold', name: '金甲神弩', style: 'archerGold', ai: 'ranged',
    hp: 250, atk: 36, def: 14, spd: 155, w: 42, h: 84, xp: 58, coin: [18, 28],
    range: 540, minDist: 230, cd: 1.85, windup: 0.48, color: '#ffe070',
  },
  shade: {
    id: 'shade', name: '归墟心魔', style: null, ai: 'shade',
    hp: 820, atk: 42, def: 20, spd: 320, w: 42, h: 82, xp: 140, coin: [40, 70],
    range: 105, cd: 1.0, windup: 0.25, active: 0.12, recover: 0.3, poise: 80, color: '#c870ff',
  },
};

/* ============================================================
 *  STAGES (5 Chapters — 3 rooms + 1 Boss room each)
 * ============================================================ */
const STAGES = [
  {
    id: 's1', num: '第一回', name: '花果山·烬', subtitle: '水帘余烬燃昔日，通臂魔猿啸青山',
    theme: 'ember', music: 's1', bossMusic: 'boss', recLv: 1, scale: 1.0,
    bossId: 'ape', bossName: '通臂烬猿', bossTitle: '焚天魔将',
    bossQuote: '“齐天？那不过是三界编造的旧梦！今日连你带这花果山，一并化烬！”',
    rewardTreasure: 'gourd',
    rooms: [
      {
        w: 1650,
        plats: [{ x: 420, y: 465, w: 220 }, { x: 960, y: 420, w: 240 }],
        waves: [
          [{ type: 'imp', x: 900 }, { type: 'imp', x: 1120 }, { type: 'crow', x: 1260 }],
          [{ type: 'imp', x: 520 }, { type: 'imp', x: 1280 }, { type: 'crow', x: 900 }, { type: 'crow', x: 1380 }],
        ],
      },
      {
        w: 1850, shrine: { x: 920 },
        plats: [{ x: 350, y: 455, w: 210 }, { x: 820, y: 390, w: 240 }, { x: 1320, y: 465, w: 220 }],
        waves: [
          [{ type: 'imp', x: 750 }, { type: 'imp', x: 1150 }, { type: 'crow', x: 1450 }, { type: 'brute', x: 1550 }],
          [{ type: 'imp', x: 400 }, { type: 'imp', x: 1480 }, { type: 'crow', x: 720 }, { type: 'crow', x: 1220 }],
        ],
      },
      {
        w: 1450, bossRoom: true,
        plats: [{ x: 260, y: 460, w: 190 }, { x: 1000, y: 460, w: 190 }],
        waves: [],
      },
    ],
  },
  {
    id: 's2', num: '第二回', name: '流沙河·渊', subtitle: '弱水鹅毛沉万骨，玄渊古蛟破浪来',
    theme: 'river', music: 's2', bossMusic: 'boss', recLv: 4, scale: 1.38,
    bossId: 'dragon', bossName: '玄渊骨蛟', bossTitle: '沉沙冥龙',
    bossQuote: '“八百里流沙沉尽白骨，尔等魂灵，亦当随江流永堕幽冥！”',
    rewardTreasure: 'umbrella',
    rooms: [
      {
        w: 1750,
        plats: [{ x: 450, y: 460, w: 220 }, { x: 1050, y: 420, w: 230 }],
        waves: [
          [{ type: 'skeleton', x: 860 }, { type: 'skeleton', x: 1120 }, { type: 'archer', x: 1360 }],
          [{ type: 'skeleton', x: 520 }, { type: 'wisp', x: 920 }, { type: 'wisp', x: 1280 }, { type: 'archer', x: 1450 }],
        ],
      },
      {
        w: 1900, shrine: { x: 950 },
        plats: [{ x: 340, y: 450, w: 220 }, { x: 840, y: 390, w: 240 }, { x: 1360, y: 460, w: 220 }],
        waves: [
          [{ type: 'yaksha', x: 900 }, { type: 'skeleton', x: 1200 }, { type: 'archer', x: 1520 }, { type: 'wisp', x: 1400 }],
          [{ type: 'yaksha', x: 450 }, { type: 'yaksha', x: 1480 }, { type: 'archer', x: 950 }, { type: 'wisp', x: 750 }],
        ],
      },
      {
        w: 1550, bossRoom: true,
        plats: [{ x: 260, y: 465, w: 200 }, { x: 1090, y: 465, w: 200 }],
        waves: [],
      },
    ],
  },
  {
    id: 's3', num: '第三回', name: '火焰山·劫', subtitle: '八百里火烧残梦，平天魔尊怒冲霄',
    theme: 'flame', music: 's3', bossMusic: 'boss', recLv: 7, scale: 1.85,
    bossId: 'bull', bossName: '魔·牛魔王', bossTitle: '焚天平天圣',
    bossQuote: '“贤弟，当年结义情分早随积雷山火烧尽！吃俺这记混天魔角！”',
    rewardTreasure: 'swords',
    rooms: [
      {
        w: 1750,
        plats: [{ x: 430, y: 460, w: 220 }, { x: 1080, y: 430, w: 240 }],
        waves: [
          [{ type: 'imp', x: 820 }, { type: 'brute', x: 1120 }, { type: 'crow', x: 1380 }, { type: 'wisp', x: 1480 }],
          [{ type: 'brute', x: 520 }, { type: 'imp', x: 1220 }, { type: 'crow', x: 880 }, { type: 'crow', x: 1420 }],
        ],
      },
      {
        w: 1950, shrine: { x: 980 },
        plats: [{ x: 350, y: 455, w: 220 }, { x: 850, y: 395, w: 250 }, { x: 1390, y: 455, w: 220 }],
        waves: [
          [{ type: 'brute', x: 960 }, { type: 'yaksha', x: 1340 }, { type: 'archer', x: 1580 }, { type: 'wisp', x: 1200 }],
          [{ type: 'brute', x: 480 }, { type: 'brute', x: 1480 }, { type: 'crow', x: 750 }, { type: 'crow', x: 1180 }],
        ],
      },
      {
        w: 1550, bossRoom: true,
        plats: [{ x: 240, y: 455, w: 190 }, { x: 1120, y: 455, w: 190 }],
        waves: [],
      },
    ],
  },
  {
    id: 's4', num: '第四回', name: '天宫·碎', subtitle: '南天玉柱倾残照，三目显圣堕天罚',
    theme: 'heaven', music: 's4', bossMusic: 'boss', recLv: 10, scale: 2.45,
    bossId: 'erlang', bossName: '二郎显圣·堕', bossTitle: '天罚真君',
    bossQuote: '“天庭已倾，法度已崩。唯以吾眉心天眼照灭一切虚妄，方得清明！”',
    rewardTreasure: 'pagoda',
    rooms: [
      {
        w: 1800,
        plats: [{ x: 420, y: 460, w: 240 }, { x: 1080, y: 410, w: 240 }],
        waves: [
          [{ type: 'soldier', x: 860 }, { type: 'soldier', x: 1150 }, { type: 'archerGold', x: 1450 }],
          [{ type: 'soldier', x: 500 }, { type: 'yaksha', x: 1020 }, { type: 'archerGold', x: 1460 }, { type: 'archerGold', x: 1580 }],
        ],
      },
      {
        w: 2000, shrine: { x: 1000 },
        plats: [{ x: 350, y: 455, w: 230 }, { x: 880, y: 385, w: 250 }, { x: 1420, y: 455, w: 230 }],
        waves: [
          [{ type: 'soldier', x: 880 }, { type: 'soldier', x: 1240 }, { type: 'brute', x: 1550 }, { type: 'archerGold', x: 1650 }],
          [{ type: 'soldier', x: 420 }, { type: 'yaksha', x: 980 }, { type: 'soldier', x: 1520 }, { type: 'archerGold', x: 1320 }],
        ],
      },
      {
        w: 1600, bossRoom: true,
        plats: [{ x: 250, y: 455, w: 210 }, { x: 1140, y: 455, w: 210 }],
        waves: [],
      },
    ],
  },
  {
    id: 's5', num: '第五回', name: '归墟·终劫', subtitle: '梦烬聚散万象生灭，太初无相待斩因果',
    theme: 'void', music: 's5', bossMusic: 'final', recLv: 13, scale: 3.15,
    bossId: 'dreamlord', bossName: '无相梦主·太初', bossTitle: '归墟万象之渊',
    bossQuote: '“汝等五劫所战、所念、所伤、所破之执念，皆化为吾身……来吧，直面汝心之梦烬！”',
    rewardTreasure: 'vessel',
    rooms: [
      {
        w: 1850,
        plats: [{ x: 430, y: 455, w: 230 }, { x: 1120, y: 405, w: 240 }],
        waves: [
          [{ type: 'yaksha', x: 840 }, { type: 'soldier', x: 1160 }, { type: 'wisp', x: 1380 }, { type: 'archerGold', x: 1540 }],
          [{ type: 'brute', x: 540 }, { type: 'yaksha', x: 1180 }, { type: 'archerGold', x: 1480 }, { type: 'wisp', x: 900 }],
        ],
      },
      {
        w: 1950, shrine: { x: 960 },
        plats: [{ x: 340, y: 455, w: 230 }, { x: 860, y: 385, w: 250 }, { x: 1400, y: 455, w: 230 }],
        waves: [
          [{ type: 'shade', x: 1200 }, { type: 'yaksha', x: 880 }, { type: 'archerGold', x: 1580 }],
          [{ type: 'brute', x: 460 }, { type: 'soldier', x: 1050 }, { type: 'soldier', x: 1460 }, { type: 'wisp', x: 1300 }, { type: 'wisp', x: 750 }],
        ],
      },
      {
        w: 1650, bossRoom: true,
        plats: [{ x: 240, y: 450, w: 220 }, { x: 1190, y: 450, w: 220 }],
        waves: [],
      },
    ],
  },
];

/* ============================================================
 *  LOOT & EQUIPMENT SYSTEM
 * ============================================================ */
const QUALITIES = [
  { id: 0, name: '凡', color: '#dcdcdc', mult: 1.0, affixes: 0, price: 25 },
  { id: 1, name: '灵', color: '#58e078', mult: 1.24, affixes: 1, price: 55 },
  { id: 2, name: '仙', color: '#58b4ff', mult: 1.55, affixes: 2, price: 110 },
  { id: 3, name: '圣', color: '#c868ff', mult: 1.95, affixes: 3, price: 220 },
  { id: 4, name: '梦烬', color: '#ffaa30', mult: 2.48, affixes: 3, price: 460 },
];

const SLOTS = {
  weapon: { name: '兵器', icon: '刃', mainStat: 'atk', label: '攻击' },
  armor:  { name: '战铠', icon: '铠', mainStat: 'def', label: '防御' },
  acc:    { name: '法饰', icon: '佩', mainStat: 'hp',  label: '气血' },
};

const GEAR_NAMES = {
  weapon: ['铁脊棍', '碎玉锋', '流火刃', '镇渊戟', '星陨神兵', '紫霄焚劫杵'],
  armor:  ['玄铁甲', '流云袍', '龙鳞战铠', '混元金锁甲', '太虚神衣', '梦烬圣铠'],
  acc:    ['青玉坠', '聚灵珠', '避尘佩', '九幽魂玉', '定海神珠', '归墟道印'],
};

const AFFIX_POOL = [
  { key: 'atk',  name: '攻击', fmt: (v) => '+' + v, base: [5, 11] },
  { key: 'def',  name: '防御', fmt: (v) => '+' + v, base: [4, 9] },
  { key: 'hp',   name: '气血', fmt: (v) => '+' + v, base: [36, 78] },
  { key: 'mp',   name: '法力', fmt: (v) => '+' + v, base: [14, 32] },
  { key: 'crit', name: '暴击', fmt: (v) => '+' + Math.round(v * 100) + '%', base: [0.02, 0.05] },
  { key: 'spd',  name: '身法', fmt: (v) => '+' + v, base: [12, 28] },
];

const LEGENDARY_FX = [
  { id: 'thunder_crit', name: '天罚雷脉', desc: '暴击时降下天雷轰击目标，额外造成60%雷霆伤害' },
  { id: 'lifesteal',    name: '噬魂返元', desc: '击中敌人恢复造成伤害6%的气血与少量法力' },
  { id: 'cdr_flow',     name: '灵渊流转', desc: '所有技能冷却速度加快22%，法力恢复提升50%' },
  { id: 'ember_nova',   name: '梦烬灼魂', desc: '击杀敌人或每6次连击引发一次烈焰爆破冲击' },
];

let _uidCounter = 1;
const LootGen = {
  roll(lv = 1, forceQ = null, slot = null) {
    slot = slot || pick(['weapon', 'armor', 'acc']);
    let q = forceQ;
    if (q === null) {
      const r = Math.random();
      q = r < 0.05 ? 4 : r < 0.16 ? 3 : r < 0.38 ? 2 : r < 0.7 ? 1 : 0;
    }
    const Q = QUALITIES[q];
    const baseNames = GEAR_NAMES[slot];
    const prefix = ['破旧', '精炼', '玄霜', '赤霄', '太初', '梦烬'][Math.min(5, q + (lv > 8 ? 1 : 0))];
    const name = `${prefix}·${baseNames[Math.min(baseNames.length - 1, Math.floor((lv - 1) / 3) + (q >= 3 ? 1 : 0))]}`;
    const scale = (1 + (lv - 1) * 0.22) * Q.mult;
    let mainVal = 0;
    if (slot === 'weapon') mainVal = Math.round(rand(10, 15) * scale);
    else if (slot === 'armor') mainVal = Math.round(rand(7, 11) * scale);
    else mainVal = Math.round(rand(65, 95) * scale);

    const pool = AFFIX_POOL.slice();
    const affixes = [];
    for (let i = 0; i < Q.affixes; i++) {
      if (!pool.length) break;
      const idx = (Math.random() * pool.length) | 0;
      const af = pool.splice(idx, 1)[0];
      let val = rand(af.base[0], af.base[1]) * (af.key === 'crit' ? (1 + q * 0.18) : scale * 0.65);
      val = af.key === 'crit' ? Math.round(val * 100) / 100 : Math.max(1, Math.round(val));
      affixes.push({ key: af.key, name: af.name, val, text: `${af.name} ${af.fmt(val)}` });
    }
    const legend = q === 4 ? pick(LEGENDARY_FX) : null;
    return {
      uid: 'it_' + Date.now().toString(36) + '_' + (_uidCounter++),
      slot, q, lv, enh: 0,
      name,
      mainStat: SLOTS[slot].mainStat,
      mainVal,
      affixes,
      legend,
    };
  },
  effectiveMain(item) {
    if (!item) return 0;
    return Math.round(item.mainVal * (1 + (item.enh || 0) * 0.14));
  },
  enhanceCost(item) {
    const e = item.enh || 0;
    return { coins: Math.round((40 + item.lv * 18) * (1 + e * 0.55) * (1 + item.q * 0.3)), souls: Math.round(12 * (1 + e * 0.6)) };
  },
  sellValue(item) {
    return Math.round(QUALITIES[item.q].price * (1 + item.lv * 0.12) * (1 + (item.enh || 0) * 0.25));
  },
};
