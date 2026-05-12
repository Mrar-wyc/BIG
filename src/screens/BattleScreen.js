import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGame } from '../store/GameContext';
import {
  calculateCharacterStats,
  calculateDamage,
  getEnemyForLevel,
  generateWeapon,
  MAX_TEAM_SIZE,
  MIN_TEAM_SIZE,
  WEAPON_DROP_COUNT,
  UPGRADE_DROP_COUNT,
} from '../data/gameData';
import HpBar from '../components/HpBar';
import { COLORS, FONT, SPACING, RADIUS, SHADOW, MIN_TOUCH } from '../styles/theme';

const WEAPON_LABELS = { A: '武器A', B: '武器B', C: '武器C', D: '武器D' };
const WEAPON_ICONS = { A: 'A', B: 'B', C: 'C', D: 'D' };
const CHAPTER_NAMES = [
  '启程之风', '岩间迷踪', '雷光一闪', '冰霜试炼', '烈焰之路',
  '深海暗流', '圣光降临', '暗影潜行', '星辰之门', '终焉决战',
];

function rarityColor(level) {
  if (level >= 3) return COLORS.rarity5;
  if (level >= 2) return COLORS.rarity4;
  if (level >= 1) return COLORS.rarity3;
  return COLORS.textMuted;
}

function DamageNum({ value, isCrit, style, positive }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: -50,
      duration: 1200,
      useNativeDriver: true,
    }).start();
  }, []);

  const prefix = positive ? '+' : '';

  return (
    <Animated.View
      style={[
        styles.dmgNum,
        style,
        {
          transform: [{ translateY: anim }],
          opacity: anim.interpolate({
            inputRange: [-50, 0],
            outputRange: [0, 1],
          }),
        },
      ]}
    >
      <Text style={[styles.dmgText, isCrit && styles.dmgCrit]}>
        {prefix}{Math.round(value)}
      </Text>
      {isCrit && <Text style={styles.critLabel}>暴击!</Text>}
    </Animated.View>
  );
}

export default function BattleScreen({ level, onBack }) {
  const { state, addWeapons, addUpgradeChances } = useGame();
  const [phase, setPhase] = useState('select');
  const [selectedIds, setSelectedIds] = useState([]);
  const [battleState, setBattleState] = useState(null);
  const [drops, setDrops] = useState(null);

  const tickRef = useRef(0);
  const intervalRef = useRef(null);
  const logIdRef = useRef(0);
  const dmgIdRef = useRef(0);

  const toggleCharacter = (charId) => {
    setSelectedIds((prev) => {
      if (prev.includes(charId)) {
        if (prev.length <= MIN_TEAM_SIZE) return prev;
        return prev.filter((id) => id !== charId);
      }
      if (prev.length >= MAX_TEAM_SIZE) return prev;
      return [...prev, charId];
    });
  };

  const startBattle = () => {
    if (selectedIds.length < MIN_TEAM_SIZE) return;
    const selectedChars = state.characters.filter((c) => selectedIds.includes(c.id));
    const enemyData = getEnemyForLevel(level);
    const chars = selectedChars.map((c) => {
      const stats = calculateCharacterStats(c);
      return { ...c, currentHp: stats.maxHp, maxHp: stats.maxHp, stats };
    });
    setBattleState({ enemy: { ...enemyData }, chars, log: [], dmgNums: [] });
    setDrops(null);
    tickRef.current = 0;
    logIdRef.current = 0;
    dmgIdRef.current = 0;
    setPhase('battle');
  };

  useEffect(() => {
    if (phase !== 'battle') return;
    intervalRef.current = setInterval(() => {
      tickRef.current += 1;
      setBattleState((prev) => {
        if (!prev) return prev;
        const { enemy, chars, log, dmgNums } = prev;
        const aliveChars = chars.filter((c) => c.currentHp > 0);
        if (aliveChars.length === 0 || enemy.hp <= 0) return prev;

        let newEnemy = { ...enemy };
        let newChars = chars.map((c) => ({ ...c }));
        let newLog = [...log];
        let newDmgNums = [...dmgNums];

        const addLog = (msg) => {
          newLog = [{ id: ++logIdRef.current, msg }, ...newLog].slice(0, 50);
        };
        const addDmg = (value, isCrit, target) => {
          newDmgNums = [...newDmgNums, { id: ++dmgIdRef.current, value, isCrit, target, time: Date.now() }];
        };

        for (const bc of newChars) {
          if (bc.currentHp <= 0) continue;
          const result = calculateDamage(bc.stats);
          newEnemy = { ...newEnemy, hp: Math.max(0, newEnemy.hp - result.damage) };
          addDmg(result.damage, result.isCrit, 'enemy');
          if (result.isCrit) addLog(`${bc.name} 暴击！造成 ${result.damage} 点伤害`);
          else addLog(`${bc.name} 造成 ${result.damage} 点伤害`);
        }

        const stillAlive = newChars.filter((c) => c.currentHp > 0);
        if (stillAlive.length > 0 && newEnemy.hp > 0) {
          const target = stillAlive[Math.floor(Math.random() * stillAlive.length)];
          const targetIdx = newChars.findIndex((c) => c.id === target.id);
          if (targetIdx >= 0) {
            newChars[targetIdx] = {
              ...newChars[targetIdx],
              currentHp: Math.max(0, newChars[targetIdx].currentHp - newEnemy.damage),
            };
            addDmg(newEnemy.damage, false, target.id);
            addLog(`${target.name} 受到 ${newEnemy.damage} 点伤害`);
            if (newChars[targetIdx].currentHp <= 0) addLog(`${target.name} 已阵亡`);
          }
        }

        return { enemy: newEnemy, chars: newChars, log: newLog, dmgNums: newDmgNums };
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [phase]);

  useEffect(() => {
    if (phase !== 'battle') return;
    const timer = setInterval(() => {
      const now = Date.now();
      setBattleState((prev) => {
        if (!prev) return prev;
        return { ...prev, dmgNums: prev.dmgNums.filter((d) => now - d.time < 1500) };
      });
    }, 500);
    return () => clearInterval(timer);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'battle' || !battleState) return;
    const { enemy, chars } = battleState;
    if (enemy.hp <= 0) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      const dropWeapons = Array.from({ length: WEAPON_DROP_COUNT }, () => generateWeapon());
      setDrops({ weapons: dropWeapons, upgrades: UPGRADE_DROP_COUNT });
      addWeapons(dropWeapons);
      addUpgradeChances(UPGRADE_DROP_COUNT);
      setPhase('victory');
      return;
    }
    if (chars.every((c) => c.currentHp <= 0)) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setPhase('defeat');
    }
  }, [phase, battleState, addWeapons, addUpgradeChances]);

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  // ===== Select Phase =====
  if (phase === 'select') {
    return (
      <SafeAreaView style={styles.page} edges={['top', 'bottom']}>
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.btnBack} onPress={onBack}>
            <Text style={styles.btnBackText}>← 返回</Text>
          </TouchableOpacity>
          <View style={styles.levelBadge}>
            <Text style={styles.levelBadgeText}>第 {level} 幕</Text>
          </View>
        </View>

        <Text style={styles.pageTitle}>{CHAPTER_NAMES[level - 1]}</Text>
        <Text style={styles.hint}>
          选择 {MIN_TEAM_SIZE}-{MAX_TEAM_SIZE} 名角色出战
        </Text>

        <ScrollView style={styles.flex1}>
          {state.characters.map((c) => {
            const stats = calculateCharacterStats(c);
            const isSelected = selectedIds.includes(c.id);
            return (
              <TouchableOpacity
                key={c.id}
                style={[styles.selectCard, isSelected && styles.selectCardOn]}
                onPress={() => toggleCharacter(c.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.selectAvatar, isSelected && styles.selectAvatarOn]}>
                  <Text style={styles.selectAvatarText}>{c.name[0]}</Text>
                </View>
                <View style={styles.flex1}>
                  <Text style={styles.selectName}>{c.name}</Text>
                  <View style={styles.selectStats}>
                    <Text style={styles.selectStat}>♥ {stats.maxHp}</Text>
                    <Text style={styles.selectStat}>⚔ {stats.atk}</Text>
                    <Text style={styles.selectStat}>✧ {stats.critRate}%</Text>
                    <Text style={styles.selectStat}>◆ {stats.critDmg}%</Text>
                  </View>
                </View>
                {isSelected && (
                  <View style={styles.checkMark}>
                    <Text style={styles.checkMarkText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <TouchableOpacity
          style={[styles.btnStart, selectedIds.length < MIN_TEAM_SIZE && styles.btnDisabled]}
          disabled={selectedIds.length < MIN_TEAM_SIZE}
          onPress={startBattle}
        >
          <Text style={styles.btnStartText}>
            开始战斗 ({selectedIds.length}/{MAX_TEAM_SIZE})
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ===== Battle Phase =====
  if (phase === 'battle' && battleState) {
    const { enemy, chars, dmgNums, log } = battleState;

    return (
      <SafeAreaView style={styles.page} edges={['top', 'bottom']}>
        {/* Enemy area */}
        <View style={styles.enemyArea}>
          <Text style={styles.enemyTitle}>{CHAPTER_NAMES[level - 1]}</Text>
          <Text style={styles.enemySubtitle}>第 {level} 幕</Text>
          <View style={{ alignSelf: 'stretch', width: '100%' }}>
            <HpBar current={enemy.hp} max={enemy.maxHp} height={10} />
          </View>
          {dmgNums.filter((d) => d.target === 'enemy').map((d) => (
            <DamageNum key={d.id} value={d.value} isCrit={d.isCrit} style={styles.dmgEnemy} />
          ))}
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Characters + Log */}
        <ScrollView style={styles.flex1} contentContainerStyle={styles.charList}>
          {chars.map((bc) => {
            const dead = bc.currentHp <= 0;
            const hpPct = bc.currentHp / bc.maxHp;
            const statusColor = dead
              ? COLORS.textMuted
              : hpPct > 0.5
              ? COLORS.green
              : hpPct > 0.2
              ? COLORS.gold
              : COLORS.red;

            return (
              <View key={bc.id} style={[styles.battleCharCard, dead && styles.battleCharDead]}>
                <View style={styles.battleCharRow}>
                  {/* Status indicator line */}
                  <View style={[styles.statusLine, { backgroundColor: statusColor }]} />

                  <View style={styles.battleCharContent}>
                    <View style={styles.battleCharHeader}>
                      <Text style={styles.battleCharName}>{bc.name}</Text>
                      {dead && <Text style={styles.deadTag}>阵亡</Text>}
                    </View>
                    <HpBar current={bc.currentHp} max={bc.maxHp} dead={dead} />
                  </View>
                </View>

                {dmgNums.filter((d) => d.target === bc.id).map((d) => (
                  <DamageNum key={d.id} value={-d.value} style={styles.dmgChar} />
                ))}
              </View>
            );
          })}

          {/* Battle Log — inside scroll, middle-lower area */}
          <View style={styles.logArea}>
            {log.slice(0, 5).map((entry) => (
              <Text key={entry.id} style={styles.logEntry} numberOfLines={1}>
                {entry.msg}
              </Text>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ===== Victory =====
  if (phase === 'victory') {
    return (
      <SafeAreaView style={[styles.page, styles.centerPage]} edges={['top', 'bottom']}>
        <View style={styles.victoryEmblem}>
          <Text style={styles.victoryStar}>&#10022;</Text>
        </View>
        <Text style={styles.victoryTitle}>挑战成功</Text>
        <Text style={styles.victorySub}>{CHAPTER_NAMES[level - 1]} · 通关</Text>

        {drops && (
          <View style={styles.dropsCard}>
            <View style={styles.dropRow}>
              <Text style={styles.dropIcon}>&#9830;</Text>
              <Text style={styles.dropText}>升级次数</Text>
              <Text style={styles.dropValue}>+{drops.upgrades}</Text>
            </View>
            <View style={styles.dropDivider} />
            <View style={styles.dropRow}>
              <Text style={styles.dropIcon}>&#9733;</Text>
              <Text style={styles.dropText}>获得武器</Text>
              <Text style={styles.dropValue}>{drops.weapons.length} 件</Text>
            </View>
            <View style={styles.dropWpnGrid}>
              {drops.weapons.map((wpn) => (
                <View
                  key={wpn.id}
                  style={[styles.dropWpnSquare, { borderColor: rarityColor(wpn.level) }]}
                >
                  <Text style={styles.dropWpnType}>{WEAPON_ICONS[wpn.type]}</Text>
                  <Text style={[styles.dropWpnLevel, { color: rarityColor(wpn.level) }]}>
                    {'★'.repeat(wpn.level + 1)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <TouchableOpacity style={styles.btnVictory} onPress={onBack}>
          <Text style={styles.btnVictoryText}>返回主界面</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ===== Defeat =====
  if (phase === 'defeat') {
    return (
      <SafeAreaView style={[styles.page, styles.centerPage]} edges={['top', 'bottom']}>
        <Text style={styles.defeatTitle}>挑战失败</Text>
        <Text style={styles.defeatSub}>{CHAPTER_NAMES[level - 1]} · 第 {level} 幕</Text>
        <Text style={styles.defeatHint}>强化角色装备后再次尝试</Text>
        <View style={styles.defeatBtns}>
          <TouchableOpacity
            style={styles.btnRetry}
            onPress={() => { setPhase('select'); setSelectedIds([]); }}
          >
            <Text style={styles.btnRetryText}>重新挑战</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnDefeatMenu} onPress={onBack}>
            <Text style={styles.btnDefeatMenuText}>返回</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingHorizontal: SPACING.lg,
    maxWidth: 480,
    alignSelf: 'center',
    width: '100%',
  },
  centerPage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  flex1: { flex: 1 },

  // Top bar
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  btnBack: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
    minHeight: MIN_TOUCH,
    justifyContent: 'center',
  },
  btnBackText: { fontSize: FONT.md, color: COLORS.textSecondary },
  levelBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    borderWidth: 0.5,
    borderColor: 'rgba(201,169,110,0.3)',
    backgroundColor: 'rgba(201,169,110,0.08)',
  },
  levelBadgeText: {
    fontSize: FONT.sm,
    fontWeight: '500',
    color: COLORS.goldDark,
  },

  pageTitle: {
    fontSize: FONT.title,
    fontWeight: '300',
    textAlign: 'center',
    marginTop: SPACING.md,
    color: COLORS.text,
    letterSpacing: 4,
  },
  hint: {
    textAlign: 'center',
    fontSize: FONT.sm,
    color: COLORS.textMuted,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xl,
  },

  // Select cards
  selectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOW.card,
  },
  selectCardOn: {
    borderColor: COLORS.gold,
    borderWidth: 1,
    backgroundColor: COLORS.cardStrong,
  },
  selectAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectAvatarOn: {
    backgroundColor: 'rgba(201,169,110,0.12)',
  },
  selectAvatarText: {
    fontSize: FONT.md,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  selectName: {
    fontSize: FONT.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  selectStats: { flexDirection: 'row', gap: 10 },
  selectStat: { fontSize: FONT.xs, color: COLORS.textSecondary },
  checkMark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMarkText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },

  btnStart: {
    backgroundColor: COLORS.gold,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    minHeight: 52,
    marginTop: SPACING.sm,
  },
  btnDisabled: { opacity: 0.35 },
  btnStartText: {
    fontSize: FONT.lg,
    fontWeight: '600',
    color: '#fff',
    letterSpacing: 2,
  },

  // Battle - Enemy
  enemyArea: {
    paddingTop: SPACING.xxxl,
    paddingBottom: SPACING.lg,
    alignItems: 'center',
    position: 'relative',
  },
  enemyTitle: {
    fontSize: FONT.lg,
    fontWeight: '500',
    color: COLORS.text,
    letterSpacing: 2,
    textAlign: 'center',
  },
  enemySubtitle: {
    fontSize: FONT.xs,
    color: COLORS.textMuted,
    marginBottom: SPACING.lg,
    marginTop: 2,
    textAlign: 'center',
  },
  divider: {
    height: 0.5,
    backgroundColor: COLORS.border,
    marginBottom: SPACING.lg,
  },

  // Battle - Characters
  charList: {
    paddingBottom: SPACING.lg,
  },
  battleCharCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
    overflow: 'visible',
    position: 'relative',
  },
  battleCharDead: { opacity: 0.45 },
  battleCharRow: {
    flexDirection: 'row',
  },
  statusLine: {
    width: 3,
  },
  battleCharContent: {
    flex: 1,
    padding: SPACING.md,
  },
  battleCharHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  battleCharName: {
    fontSize: FONT.sm,
    fontWeight: '600',
    color: COLORS.text,
  },
  deadTag: {
    color: COLORS.red,
    fontSize: FONT.xs,
    fontWeight: '500',
  },

  // Battle log
  logArea: {
    backgroundColor: 'rgba(0,0,0,0.04)',
    borderRadius: RADIUS.sm,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    padding: SPACING.sm,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  logEntry: {
    fontSize: 10,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },

  // Damage numbers
  dmgNum: { position: 'absolute', zIndex: 10, alignItems: 'center' },
  dmgEnemy: { right: 10, top: -10 },
  dmgChar: { right: 10, top: 8 },
  dmgText: { fontSize: 14, fontWeight: '500', color: COLORS.text },
  dmgCrit: { fontSize: 20, fontWeight: '800', color: COLORS.goldDark },
  critLabel: { fontSize: 9, fontWeight: '700', color: COLORS.red, marginTop: 1 },

  // Victory
  victoryEmblem: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(201,169,110,0.3)',
    backgroundColor: 'rgba(201,169,110,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  victoryStar: {
    fontSize: 28,
    color: COLORS.gold,
  },
  victoryTitle: {
    fontSize: FONT.title,
    fontWeight: '300',
    color: COLORS.gold,
    letterSpacing: 8,
    marginBottom: 4,
  },
  victorySub: {
    fontSize: FONT.sm,
    color: COLORS.textMuted,
    marginBottom: SPACING.xxxl,
  },

  // Drops card
  dropsCard: {
    width: '100%',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    padding: SPACING.xl,
    marginBottom: SPACING.xxxl,
    ...SHADOW.card,
  },
  dropRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dropIcon: {
    fontSize: 12,
    color: COLORS.gold,
    width: 20,
    textAlign: 'center',
  },
  dropText: {
    fontSize: FONT.md,
    fontWeight: '500',
    color: COLORS.text,
    flex: 1,
  },
  dropValue: {
    fontSize: FONT.lg,
    fontWeight: '700',
    color: COLORS.gold,
  },
  dropDivider: {
    height: 0.5,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.md,
  },
  dropWpnGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: SPACING.md,
  },
  dropWpnSquare: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.sm,
    borderWidth: 1.5,
    backgroundColor: COLORS.cardStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropWpnType: {
    fontSize: FONT.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  dropWpnLevel: {
    fontSize: 7,
    letterSpacing: 1,
    marginTop: -1,
  },

  btnVictory: {
    width: '100%',
    backgroundColor: COLORS.gold,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    minHeight: 52,
  },
  btnVictoryText: {
    fontSize: FONT.lg,
    fontWeight: '600',
    color: '#fff',
    letterSpacing: 3,
  },

  // Defeat
  defeatTitle: {
    fontSize: FONT.title,
    fontWeight: '300',
    color: COLORS.red,
    letterSpacing: 8,
    marginBottom: 4,
  },
  defeatSub: {
    fontSize: FONT.sm,
    color: COLORS.textMuted,
    marginBottom: 8,
  },
  defeatHint: {
    fontSize: FONT.xs,
    color: COLORS.textMuted,
    marginBottom: SPACING.xxxl,
  },
  defeatBtns: {
    width: '100%',
    gap: SPACING.sm,
  },
  btnRetry: {
    width: '100%',
    borderWidth: 0.5,
    borderColor: 'rgba(201,169,110,0.4)',
    backgroundColor: 'rgba(201,169,110,0.1)',
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    minHeight: 52,
  },
  btnRetryText: {
    fontSize: FONT.md,
    fontWeight: '600',
    color: COLORS.goldDark,
    letterSpacing: 2,
  },
  btnDefeatMenu: {
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.03)',
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    minHeight: 48,
  },
  btnDefeatMenuText: {
    fontSize: FONT.md,
    color: COLORS.textMuted,
  },
});
