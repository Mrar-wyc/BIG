import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { COLORS, FONT, RADIUS, SHADOW } from '../styles/theme';

const WEAPON_LABELS = { A: 'A', B: 'B', C: 'C', D: 'D' };
const WEAPON_NAMES = { A: '生命', B: '攻击', C: '暴击', D: '增伤' };
const SCREEN_W = Dimensions.get('window').width;
const CARD_W = Math.min((SCREEN_W - 40) / 3, 140);

function rarityForLevel(lv) {
  if (lv >= 3) return { stars: 5, color: COLORS.rarity5, bg: 'rgba(201,169,110,0.1)' };
  if (lv >= 2) return { stars: 4, color: COLORS.rarity4, bg: 'rgba(167,133,201,0.1)' };
  if (lv >= 1) return { stars: 3, color: COLORS.rarity3, bg: 'rgba(107,164,201,0.1)' };
  return { stars: 2, color: '#999', bg: 'rgba(0,0,0,0.03)' };
}

export default function WeaponCard({ weapon, selected, onPress, compact = true }) {
  const rarity = rarityForLevel(weapon.level);
  const stars = '★'.repeat(rarity.stars) + '☆'.repeat(Math.max(0, 5 - rarity.stars));

  if (compact) {
    return (
      <TouchableOpacity
        style={[styles.compactCard, selected && styles.compactSelected]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={[styles.compactInner, { borderColor: rarity.color }]}>
          <Text style={styles.compactType}>{WEAPON_LABELS[weapon.type]}</Text>
          <Text style={[styles.compactStars, { color: rarity.color }]}>{stars}</Text>
          <Text style={styles.compactMain}>{weapon.mainStat.label}</Text>
          <Text style={[styles.compactValue, { color: rarity.color }]}>
            +{weapon.mainStat.value}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  // Full detail card
  return (
    <TouchableOpacity
      style={[styles.fullCard, selected && styles.fullSelected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.fullHeader}>
        <View style={styles.fullLeft}>
          <Text style={styles.fullType}>
            {WEAPON_LABELS[weapon.type]} · {WEAPON_NAMES[weapon.type]}
          </Text>
          <Text style={[styles.fullStars, { color: rarity.color }]}>{stars}</Text>
        </View>
        <View style={styles.fullMainBadge}>
          <Text style={styles.fullMainLabel}>{weapon.mainStat.label}</Text>
          <Text style={[styles.fullMainValue, { color: rarity.color }]}>+{weapon.mainStat.value}</Text>
        </View>
      </View>
      <View style={styles.fullSubRow}>
        {weapon.subStats.map((ss, i) => (
          <View key={i} style={[styles.fullSubTag, ss.type === 'invalid' && styles.fullSubInvalid]}>
            <Text style={[styles.fullSubText, ss.type === 'invalid' && styles.fullSubTextInvalid]}>
              {ss.label} +{ss.value}
            </Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Compact mode (square grid card)
  compactCard: {
    width: CARD_W,
    marginBottom: 8,
  },
  compactSelected: {
    transform: [{ scale: 1.05 }],
  },
  compactInner: {
    aspectRatio: 1,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    ...SHADOW.card,
  },
  compactType: {
    fontSize: FONT.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  compactStars: {
    fontSize: 9,
    letterSpacing: 1,
    marginTop: 2,
  },
  compactMain: {
    fontSize: FONT.xs,
    color: COLORS.textSecondary,
    marginTop: 6,
  },
  compactValue: {
    fontSize: FONT.md,
    fontWeight: '700',
    marginTop: 1,
  },

  // Full detail card
  fullCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    marginBottom: 6,
    ...SHADOW.card,
  },
  fullSelected: {
    borderColor: COLORS.gold,
    backgroundColor: COLORS.cardStrong,
  },
  fullHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fullLeft: {},
  fullType: {
    fontSize: FONT.sm,
    fontWeight: '600',
    color: COLORS.text,
  },
  fullStars: {
    fontSize: 11,
    letterSpacing: 1,
    marginTop: 2,
  },
  fullMainBadge: {
    alignItems: 'flex-end',
  },
  fullMainLabel: {
    fontSize: FONT.xs,
    color: COLORS.textMuted,
  },
  fullMainValue: {
    fontSize: FONT.lg,
    fontWeight: '700',
  },
  fullSubRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.border,
  },
  fullSubTag: {
    backgroundColor: 'rgba(0,0,0,0.04)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.xs,
  },
  fullSubInvalid: {
    opacity: 0.4,
  },
  fullSubText: {
    fontSize: FONT.xs,
    color: COLORS.textSecondary,
  },
  fullSubTextInvalid: {
    textDecorationLine: 'line-through',
    color: COLORS.textMuted,
  },
});
