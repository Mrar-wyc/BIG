import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGame } from '../store/GameContext';
import { TOTAL_LEVELS, getEnemyForLevel } from '../data/gameData';
import { COLORS, FONT, SPACING, RADIUS, SHADOW, MIN_TOUCH } from '../styles/theme';

const CHAPTER_NAMES = [
  '启程之风', '岩间迷踪', '雷光一闪', '冰霜试炼', '烈焰之路',
  '深海暗流', '圣光降临', '暗影潜行', '星辰之门', '终焉决战',
];

export default function MainScreen({ onBattle, onCharacter }) {
  const { state } = useGame();
  const levels = Array.from({ length: TOTAL_LEVELS }, (_, i) => i + 1);

  return (
    <SafeAreaView style={styles.page} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>异世之旅</Text>
          <View style={styles.titleLine} />
        </View>
        <View style={styles.upgradeBadge}>
          <Text style={styles.upgradeIcon}>&#9679;</Text>
          <Text style={styles.upgradeCount}>{state.upgradeChances}</Text>
        </View>
      </View>

      {/* Chapter list */}
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {levels.map((lvl) => {
          const enemy = getEnemyForLevel(lvl);
          return (
            <TouchableOpacity
              key={lvl}
              style={styles.chapterCard}
              onPress={() => onBattle(lvl)}
              activeOpacity={0.6}
            >
              <View style={styles.chapterLeft}>
                <Text style={styles.chapterNum}>{String(lvl).padStart(2, '0')}</Text>
                <View style={styles.chapterDot} />
              </View>
              <View style={styles.chapterMid}>
                <Text style={styles.chapterName}>{CHAPTER_NAMES[lvl - 1]}</Text>
                <Text style={styles.chapterLabel}>第 {lvl} 幕</Text>
              </View>
              <View style={styles.chapterRight}>
                <View style={styles.enemyStat}>
                  <Text style={styles.enemyStatIcon}>&#9829;</Text>
                  <Text style={styles.enemyStatVal}>{enemy.maxHp}</Text>
                </View>
                <View style={styles.enemyStat}>
                  <Text style={styles.enemyStatIcon}>&#9876;</Text>
                  <Text style={styles.enemyStatVal}>{enemy.damage}</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
        <View style={{ height: 16 }} />
      </ScrollView>

      {/* Bottom: character button */}
      <View style={styles.bottom}>
        <TouchableOpacity style={styles.btnChar} onPress={onCharacter} activeOpacity={0.6}>
          <View style={styles.btnCharInner}>
            <Text style={styles.btnCharIcon}>&#9830;</Text>
            <Text style={styles.btnCharText}>角色编队</Text>
          </View>
          <View style={styles.charCountBadge}>
            <Text style={styles.charCountText}>{state.characters.length}</Text>
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: COLORS.bg,
    maxWidth: 480,
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: SPACING.lg,
  },
  scroll: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  title: {
    fontSize: FONT.title,
    fontWeight: '300',
    color: COLORS.text,
    letterSpacing: 4,
  },
  titleLine: {
    width: 32,
    height: 2,
    backgroundColor: COLORS.gold,
    marginTop: 6,
    borderRadius: 1,
  },
  upgradeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(201,169,110,0.12)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: RADIUS.pill,
    borderWidth: 0.5,
    borderColor: 'rgba(201,169,110,0.25)',
  },
  upgradeIcon: {
    fontSize: 8,
    color: COLORS.gold,
  },
  upgradeCount: {
    fontSize: FONT.sm,
    fontWeight: '600',
    color: COLORS.goldDark,
  },

  // Chapter cards
  chapterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    marginBottom: SPACING.sm,
    minHeight: 72,
    ...SHADOW.card,
  },
  chapterLeft: {
    alignItems: 'center',
    marginRight: SPACING.lg,
  },
  chapterNum: {
    fontSize: 24,
    fontWeight: '200',
    color: COLORS.gold,
    letterSpacing: 2,
  },
  chapterDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.gold,
    marginTop: 4,
  },
  chapterMid: {
    flex: 1,
  },
  chapterName: {
    fontSize: FONT.md,
    fontWeight: '500',
    color: COLORS.text,
  },
  chapterLabel: {
    fontSize: FONT.xs,
    color: COLORS.textMuted,
    marginTop: 3,
  },
  chapterRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  enemyStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  enemyStatIcon: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  enemyStatVal: {
    fontSize: FONT.xs,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },

  // Bottom
  bottom: {
    paddingVertical: SPACING.md,
  },
  btnChar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(201,169,110,0.1)',
    borderWidth: 0.5,
    borderColor: COLORS.borderGold,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    minHeight: MIN_TOUCH + 4,
  },
  btnCharInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  btnCharIcon: {
    fontSize: 14,
    color: COLORS.gold,
  },
  btnCharText: {
    fontSize: FONT.md,
    fontWeight: '500',
    color: COLORS.text,
  },
  charCountBadge: {
    backgroundColor: 'rgba(201,169,110,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
    marginLeft: 10,
  },
  charCountText: {
    fontSize: FONT.xs,
    fontWeight: '600',
    color: COLORS.goldDark,
  },
});
