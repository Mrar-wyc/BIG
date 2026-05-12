// ============ Constants ============

export const WEAPON_TYPES = ['A', 'B', 'C', 'D'];

export const MAIN_STAT_CONFIG = {
  A: { type: 'hp', label: '生命值', base: 10 },
  B: { type: 'atk', label: '攻击力', base: 5 },
  C: {
    options: [
      { type: 'critRate', label: '暴击率', base: 10 },
      { type: 'critDmg', label: '暴击伤害', base: 20 },
    ],
  },
  D: {
    options: [
      { type: 'physicalDmg', label: '物理伤害增加', base: 10 },
      { type: 'spellDmg', label: '法术伤害增加', base: 10 },
    ],
  },
};

export const SUB_STAT_TYPES = ['hp', 'atk', 'critRate', 'critDmg', 'invalid'];

export const SUB_STAT_LABELS = {
  hp: '生命值',
  atk: '攻击力',
  critRate: '暴击率',
  critDmg: '暴击伤害',
  invalid: '无效',
};

export const SUB_STAT_BASE = {
  hp: 5,
  atk: 2.5,
  critRate: 5,
  critDmg: 10,
  invalid: 0,
};

export const MAIN_STAT_BASE = {
  hp: 10,
  atk: 5,
  critRate: 10,
  critDmg: 20,
  physicalDmg: 10,
  spellDmg: 10,
};

export const MAX_WEAPON_LEVEL = 3;
export const MAX_TEAM_SIZE = 3;
export const MIN_TEAM_SIZE = 1;
export const TOTAL_LEVELS = 10;
export const WEAPON_DROP_COUNT = 5;
export const UPGRADE_DROP_COUNT = 3;

export const BASE_CRIT_RATE = 5;
export const BASE_CRIT_DMG = 50;

export const CHARACTER_A = {
  id: 'char_a',
  name: '角色A',
  baseAttack: 10,
  baseHp: 100,
  weapons: [null, null, null, null],
  damageType: 'physical',
};

export const CHARACTER_B = {
  id: 'char_b',
  name: '角色B',
  baseAttack: 16,
  baseHp: 60,
  weapons: [null, null, null, null],
  damageType: 'spell',
};

export const CHARACTER_C = {
  id: 'char_c',
  name: '角色C',
  baseAttack: 6,
  baseHp: 160,
  weapons: [null, null, null, null],
  damageType: 'physical',
};

// ============ Utility Functions ============

let nextWeaponId = 1;
export function generateWeaponId() {
  return `wpn_${nextWeaponId++}`;
}

export function getMainStatForWeapon(weaponType) {
  const config = MAIN_STAT_CONFIG[weaponType];
  if (config.options) {
    const picked = config.options[Math.floor(Math.random() * config.options.length)];
    return { type: picked.type, label: picked.label, value: picked.base };
  }
  return { type: config.type, label: config.label, value: config.base };
}

function randomSubStatType() {
  return SUB_STAT_TYPES[Math.floor(Math.random() * SUB_STAT_TYPES.length)];
}

export function generateWeapon(type) {
  const actualType = type || WEAPON_TYPES[Math.floor(Math.random() * WEAPON_TYPES.length)];
  const mainStat = getMainStatForWeapon(actualType);
  const subStats = [];
  const usedTypes = new Set();
  while (subStats.length < 3) {
    const st = randomSubStatType();
    if (st === 'invalid' || !usedTypes.has(st)) {
      usedTypes.add(st);
      subStats.push({
        type: st,
        label: SUB_STAT_LABELS[st],
        value: SUB_STAT_BASE[st],
      });
    }
  }
  return {
    id: generateWeaponId(),
    type: actualType,
    level: 0,
    mainStat: { ...mainStat },
    subStats,
  };
}

export function upgradeWeapon(weapon) {
  if (weapon.level >= MAX_WEAPON_LEVEL) return null;
  const newWeapon = JSON.parse(JSON.stringify(weapon));
  newWeapon.level += 1;
  const mainBase = MAIN_STAT_BASE[newWeapon.mainStat.type];
  newWeapon.mainStat.value += mainBase;
  if (newWeapon.subStats.length > 0) {
    const idx = Math.floor(Math.random() * newWeapon.subStats.length);
    const sub = newWeapon.subStats[idx];
    sub.value += SUB_STAT_BASE[sub.type];
  }
  return newWeapon;
}

export function getDestroyUpgrades(level) {
  return level <= 1 ? 1 : 2;
}

export function calculateCharacterStats(character) {
  let hp = character.baseHp;
  let atk = character.baseAttack;
  let critRate = BASE_CRIT_RATE;
  let critDmg = BASE_CRIT_DMG;
  let physicalDmg = 0;
  let spellDmg = 0;

  (character.weapons || []).forEach((weapon) => {
    if (!weapon) return;
    const ms = weapon.mainStat;
    switch (ms.type) {
      case 'hp': hp += ms.value; break;
      case 'atk': atk += ms.value; break;
      case 'critRate': critRate += ms.value; break;
      case 'critDmg': critDmg += ms.value; break;
      case 'physicalDmg': physicalDmg += ms.value; break;
      case 'spellDmg': spellDmg += ms.value; break;
    }
    weapon.subStats.forEach((ss) => {
      switch (ss.type) {
        case 'hp': hp += ss.value; break;
        case 'atk': atk += ss.value; break;
        case 'critRate': critRate += ss.value; break;
        case 'critDmg': critDmg += ss.value; break;
      }
    });
  });

  return {
    hp: Math.round(hp * 10) / 10,
    maxHp: Math.round(hp * 10) / 10,
    atk: Math.round(atk * 10) / 10,
    critRate: Math.round(critRate * 10) / 10,
    critDmg: Math.round(critDmg * 10) / 10,
    physicalDmg: Math.round(physicalDmg * 10) / 10,
    spellDmg: Math.round(spellDmg * 10) / 10,
    damageType: character.damageType || 'physical',
  };
}

export function getEnemyForLevel(level) {
  const hp = 100 * Math.pow(2, level - 1);
  return { hp, maxHp: hp, damage: 5 + (level - 1) };
}

export function calculateDamage(stats) {
  const baseDmg = stats.atk;
  const dmgIncrease = stats.damageType === 'physical' ? stats.physicalDmg : stats.spellDmg;
  const dmgMultiplier = 1 + dmgIncrease / 100;
  const critRoll = Math.random() * 100;
  const isCrit = critRoll < stats.critRate;
  if (isCrit) {
    const totalMultiplier = dmgMultiplier + stats.critDmg / 100;
    return {
      damage: Math.round(baseDmg * totalMultiplier * 10) / 10,
      isCrit: true,
    };
  }
  return {
    damage: Math.round(baseDmg * dmgMultiplier * 10) / 10,
    isCrit: false,
  };
}
