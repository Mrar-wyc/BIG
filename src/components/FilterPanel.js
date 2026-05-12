import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, FONT, SPACING, RADIUS } from '../styles/theme';
import { WEAPON_TYPES, SUB_STAT_LABELS } from '../data/gameData';

const WEAPON_LABELS = { A: 'A', B: 'B', C: 'C', D: 'D' };
const WEAPON_NAMES = { A: '生命', B: '攻击', C: '暴击', D: '增伤' };

const MAIN_STAT_FILTERS = [
  { type: 'hp', label: '生命值' },
  { type: 'atk', label: '攻击力' },
  { type: 'critRate', label: '暴击率' },
  { type: 'critDmg', label: '暴伤' },
  { type: 'physicalDmg', label: '物理' },
  { type: 'spellDmg', label: '法术' },
];

const SUB_STAT_FILTERS = ['hp', 'atk', 'critRate', 'critDmg', 'invalid'];

export default function FilterPanel({
  typeFilters,
  mainStatFilters,
  subStatFilters,
  onToggleType,
  onToggleMainStat,
  onToggleSubStat,
  onClear,
  hasActive,
  activeCount,
}) {
  return (
    <View style={styles.panel}>
      {/* Type tabs */}
      <View style={styles.tabRow}>
        {WEAPON_TYPES.map((t) => {
          const active = typeFilters.includes(t);
          return (
            <TouchableOpacity
              key={t}
              style={[styles.tab, active && styles.tabActive]}
              onPress={() => onToggleType(t)}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>
                {WEAPON_LABELS[t]}
              </Text>
              <Text style={[styles.tabSub, active && styles.tabSubActive]}>
                {WEAPON_NAMES[t]}
              </Text>
              {active && <View style={styles.tabLine} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Main stat chips */}
      <View style={styles.chipRow}>
        <Text style={styles.label}>主属性</Text>
        <View style={styles.chipWrap}>
          {MAIN_STAT_FILTERS.map((m) => {
            const active = mainStatFilters.includes(m.type);
            return (
              <TouchableOpacity
                key={m.type}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => onToggleMainStat(m.type)}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {m.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Sub stat chips */}
      <View style={styles.chipRow}>
        <Text style={styles.label}>副属性</Text>
        <View style={styles.chipWrap}>
          {SUB_STAT_FILTERS.map((t) => {
            const active = subStatFilters.includes(t);
            return (
              <TouchableOpacity
                key={t}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => onToggleSubStat(t)}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {SUB_STAT_LABELS[t]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {hasActive && (
        <TouchableOpacity style={styles.clearBtn} onPress={onClear}>
          <Text style={styles.clearText}>清除筛选</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },

  // Tab bar for weapon types
  tabRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  tab: {
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 16,
    position: 'relative',
  },
  tabActive: {},
  tabText: {
    fontSize: FONT.lg,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  tabTextActive: {
    color: COLORS.gold,
  },
  tabSub: {
    fontSize: FONT.xs,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  tabSubActive: {
    color: COLORS.gold,
  },
  tabLine: {
    position: 'absolute',
    bottom: -SPACING.sm - 0.5,
    height: 2,
    width: 28,
    backgroundColor: COLORS.gold,
    borderRadius: 1,
  },

  // Chip rows
  chipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  label: {
    fontSize: FONT.xs,
    color: COLORS.textMuted,
    width: 44,
    paddingTop: 6,
  },
  chipWrap: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.xs,
    marginRight: 6,
    marginBottom: 4,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  chipActive: {
    backgroundColor: 'rgba(201,169,110,0.12)',
  },
  chipText: {
    fontSize: FONT.xs,
    color: COLORS.textMuted,
  },
  chipTextActive: {
    color: COLORS.goldDark,
    fontWeight: '500',
  },

  clearBtn: {
    alignSelf: 'flex-end',
    marginTop: 2,
  },
  clearText: {
    fontSize: FONT.xs,
    color: COLORS.red,
  },
});
