import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONT, RADIUS } from '../styles/theme';

function hpColor(pct) {
  if (pct > 0.5) return COLORS.green;
  if (pct > 0.2) return COLORS.gold;
  return COLORS.red;
}

export default function HpBar({ current, max, height = 8, dead }) {
  const pct = max > 0 ? Math.max(0, Math.min(1, current / max)) : 0;
  const barColor = dead ? COLORS.textMuted : hpColor(pct);

  return (
    <View style={styles.row}>
      <View style={[styles.track, { height }]}>
        <View
          style={[
            styles.fill,
            {
              width: `${pct * 100}%`,
              height,
              backgroundColor: barColor,
            },
          ]}
        />
      </View>
      <Text style={styles.label}>
        {Math.round(current)}/{max}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    gap: 8,
  },
  track: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderRadius: RADIUS.xs,
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.1)',
    overflow: 'hidden',
  },
  fill: {
    borderRadius: RADIUS.xs,
  },
  label: {
    fontSize: FONT.xs,
    color: COLORS.textSecondary,
    width: 54,
    textAlign: 'right',
  },
});
