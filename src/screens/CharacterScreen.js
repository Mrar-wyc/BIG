import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGame } from '../store/GameContext';
import {
  calculateCharacterStats,
  WEAPON_TYPES,
  MAX_WEAPON_LEVEL,
  BASE_CRIT_RATE,
  BASE_CRIT_DMG,
} from '../data/gameData';
import WeaponCard from '../components/WeaponCard';
import FilterPanel from '../components/FilterPanel';
import { COLORS, GLASS, FONT, SPACING, RADIUS, SHADOW, MIN_TOUCH } from '../styles/theme';

const WEAPON_LABELS = { A: '武器A', B: '武器B', C: '武器C', D: '武器D' };
const SLOT_NAMES = ['生命', '攻击', '暴击', '增伤'];
const SLOT_ICONS = ['♥', '⚔', '✧', '♦'];

export default function CharacterScreen({ onBack }) {
  const { state, equipWeapon, unequipWeapon, upgradeWeaponById, destroyWeapon } = useGame();
  const [selectedCharId, setSelectedCharId] = useState(null);
  const [selectedWeaponId, setSelectedWeaponId] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [typeFilters, setTypeFilters] = useState([]);
  const [mainStatFilters, setMainStatFilters] = useState([]);
  const [subStatFilters, setSubStatFilters] = useState([]);

  const toggleTypeFilter = (t) =>
    setTypeFilters((prev) => (prev.includes(t) ? [] : [t]));
  const toggleMainStatFilter = (t) =>
    setMainStatFilters((prev) => (prev.includes(t) ? prev.filter((v) => v !== t) : [...prev, t]));
  const toggleSubStatFilter = (t) =>
    setSubStatFilters((prev) => (prev.includes(t) ? prev.filter((v) => v !== t) : [...prev, t]));
  const clearFilters = () => { setTypeFilters([]); setMainStatFilters([]); setSubStatFilters([]); };
  const hasActiveFilters = typeFilters.length > 0 || mainStatFilters.length > 0 || subStatFilters.length > 0;
  const activeCount = typeFilters.length + mainStatFilters.length + subStatFilters.length;

  const filteredInventory = useMemo(() => {
    let items = state.weaponInventory;
    if (typeFilters.length > 0) items = items.filter((w) => typeFilters.includes(w.type));
    if (mainStatFilters.length > 0) items = items.filter((w) => mainStatFilters.includes(w.mainStat.type));
    if (subStatFilters.length > 0) items = items.filter((w) => w.subStats.some((ss) => subStatFilters.includes(ss.type)));
    return items;
  }, [state.weaponInventory, typeFilters, mainStatFilters, subStatFilters]);

  // Find selected weapon in inventory OR equipped on a character
  const selectedWeapon = useMemo(() => {
    let found = state.weaponInventory.find((w) => w.id === selectedWeaponId);
    if (found) return found;
    for (const c of state.characters) {
      for (const w of c.weapons) {
        if (w && w.id === selectedWeaponId) return w;
      }
    }
    return null;
  }, [state.weaponInventory, state.characters, selectedWeaponId]);

  const handleEquip = (slot) => {
    if (!selectedWeaponId || !selectedCharId) return;
    if (selectedWeapon.type !== WEAPON_TYPES[slot]) {
      Alert.alert('类型不匹配', `${WEAPON_LABELS[selectedWeapon.type]} 不能装备到 ${SLOT_NAMES[slot]}槽位`);
      return;
    }
    equipWeapon(selectedCharId, selectedWeapon, slot);
    setSelectedWeaponId(null);
  };

  const handleUpgrade = () => {
    if (!selectedWeaponId || !selectedWeapon) return;
    if (selectedWeapon.level >= MAX_WEAPON_LEVEL) { Alert.alert('提示', '已达最高等级'); return; }
    if (state.upgradeChances <= 0) { Alert.alert('提示', '升级次数不足'); return; }
    upgradeWeaponById(selectedWeaponId);
  };

  const handleDestroy = () => {
    if (!selectedWeaponId) return;
    Alert.alert('确认', '确定要销毁该武器吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '销毁',
        style: 'destructive',
        onPress: () => { destroyWeapon(selectedWeaponId); setSelectedWeaponId(null); },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.page} edges={['top', 'bottom']}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.btnBack} onPress={onBack}>
          <Text style={styles.btnBackText}>← 返回</Text>
        </TouchableOpacity>
        <View style={styles.upgradeBadge}>
          <Text style={styles.upgradeIcon}>&#9679;</Text>
          <Text style={styles.upgradeText}>{state.upgradeChances}</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>角色编队</Text>

        {/* Character List */}
        {state.characters.map((c) => {
          const stats = calculateCharacterStats(c);
          const bonusAtk = Math.round((stats.atk - c.baseAttack) * 10) / 10;
          const bonusHp = Math.round((stats.maxHp - c.baseHp) * 10) / 10;
          const bonusCritRate = Math.round((stats.critRate - BASE_CRIT_RATE) * 10) / 10;
          const bonusCritDmg = Math.round((stats.critDmg - BASE_CRIT_DMG) * 10) / 10;
          const hasBonus = bonusAtk > 0 || bonusHp > 0 || bonusCritRate > 0 || bonusCritDmg > 0;
          const isSelected = selectedCharId === c.id;
          return (
            <View key={c.id} style={styles.charBlock}>
              <TouchableOpacity
                style={[styles.charCard, isSelected && styles.charCardSelected]}
                onPress={() => { setSelectedCharId(isSelected ? null : c.id); setSelectedWeaponId(null); }}
                activeOpacity={0.7}
              >
                <View style={styles.charMain}>
                  <View style={styles.charAvatar}>
                    <Text style={styles.charAvatarText}>{c.name[0]}</Text>
                  </View>
                  <View style={styles.charInfo}>
                    <View style={styles.charNameRow}>
                      <Text style={styles.charName}>{c.name}</Text>
                      <Text style={[styles.dmgTypeBadge, c.damageType === 'spell' && styles.dmgTypeSpell]}>
                        {c.damageType === 'physical' ? '物理' : '法术'}
                      </Text>
                    </View>
                    <Text style={styles.charBaseRow}>基础 ⚔{c.baseAttack}  ♥{c.baseHp}</Text>
                    <View style={styles.charStats}>
                      <Text style={styles.charStat}>♥ {stats.maxHp}</Text>
                      <Text style={styles.charStat}>⚔ {stats.atk}</Text>
                      <Text style={styles.charStat}>✧ {stats.critRate}%</Text>
                      <Text style={styles.charStat}>◆ {stats.critDmg}%</Text>
                    </View>
                  </View>
                  <Text style={styles.charArrow}>{isSelected ? '▾' : '▸'}</Text>
                </View>
              </TouchableOpacity>

              {/* Expanded stat summary + weapon slots */}
              {isSelected && (
                <>
                  <View style={styles.statSummary}>
                    <View style={styles.statSummaryRow}>
                      <Text style={styles.statSummaryLabel}>基础</Text>
                      <Text style={styles.statSummaryVal}>⚔{c.baseAttack}</Text>
                      <Text style={styles.statSummaryVal}>♥{c.baseHp}</Text>
                      <Text style={styles.statSummaryVal}>✧{BASE_CRIT_RATE}%</Text>
                      <Text style={styles.statSummaryVal}>◆{BASE_CRIT_DMG}%</Text>
                    </View>
                    <View style={styles.statSummaryRow}>
                      <Text style={styles.statSummaryLabel}>加成</Text>
                      <Text style={[styles.statSummaryVal, bonusAtk > 0 && styles.statBonus]}>⚔{bonusAtk > 0 ? '+' : ''}{bonusAtk}</Text>
                      <Text style={[styles.statSummaryVal, bonusHp > 0 && styles.statBonus]}>♥{bonusHp > 0 ? '+' : ''}{bonusHp}</Text>
                      <Text style={[styles.statSummaryVal, bonusCritRate > 0 && styles.statBonus]}>✧{bonusCritRate > 0 ? '+' : ''}{bonusCritRate}%</Text>
                      <Text style={[styles.statSummaryVal, bonusCritDmg > 0 && styles.statBonus]}>◆{bonusCritDmg > 0 ? '+' : ''}{bonusCritDmg}%</Text>
                    </View>
                    <View style={styles.statSummaryDivider} />
                    <View style={styles.statSummaryRow}>
                      <Text style={styles.statSummaryLabel}>最终</Text>
                      <Text style={[styles.statSummaryVal, styles.statSummaryFinal]}>⚔{stats.atk}</Text>
                      <Text style={[styles.statSummaryVal, styles.statSummaryFinal]}>♥{stats.maxHp}</Text>
                      <Text style={[styles.statSummaryVal, styles.statSummaryFinal]}>✧{stats.critRate}%</Text>
                      <Text style={[styles.statSummaryVal, styles.statSummaryFinal]}>◆{stats.critDmg}%</Text>
                    </View>
                  </View>
                  <View style={styles.slotRow}>
                  {WEAPON_TYPES.map((type, idx) => {
                    const wpn = c.weapons[idx];
                    return (
                      <TouchableOpacity
                        key={idx}
                        style={[styles.slot, !wpn && styles.slotEmpty]}
                        onPress={() => {
                          if (selectedWeaponId) handleEquip(idx);
                          else if (wpn) unequipWeapon(c.id, idx);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.slotIcon}>{SLOT_ICONS[idx]}</Text>
                        <Text style={styles.slotLabel}>{SLOT_NAMES[idx]}</Text>
                        {wpn ? (
                          <View style={styles.slotWpn}>
                            <Text style={styles.slotWpnType}>{WEAPON_LABELS[wpn.type][2]} Lv.{wpn.level}</Text>
                            <Text style={styles.slotWpnStat}>{wpn.mainStat.label} +{wpn.mainStat.value}</Text>
                          </View>
                        ) : (
                          <Text style={styles.slotEmptyText}>
                            {selectedWeaponId ? '点击装备' : '-'}
                          </Text>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
                </>
              )}
            </View>
          );
        })}

        {/* Weapon Inventory */}
        <View style={styles.invSection}>
          <View style={styles.invHeader}>
            <Text style={styles.sectionTitle}>
              武器背包 ({filteredInventory.length}{hasActiveFilters ? `/${state.weaponInventory.length}` : ''})
            </Text>
            <TouchableOpacity
              style={[styles.btnFilter, hasActiveFilters && styles.btnFilterActive]}
              onPress={() => setFilterOpen(!filterOpen)}
            >
              <Text style={[styles.btnFilterText, hasActiveFilters && styles.btnFilterTextActive]}>
                {filterOpen ? '收起' : '筛选'}
                {hasActiveFilters ? ` (${activeCount})` : ''}
              </Text>
            </TouchableOpacity>
          </View>

          {filterOpen && (
            <FilterPanel
              typeFilters={typeFilters}
              mainStatFilters={mainStatFilters}
              subStatFilters={subStatFilters}
              onToggleType={toggleTypeFilter}
              onToggleMainStat={toggleMainStatFilter}
              onToggleSubStat={toggleSubStatFilter}
              onClear={clearFilters}
              hasActive={hasActiveFilters}
              activeCount={activeCount}
            />
          )}

          {/* Selected weapon actions */}
          {selectedWeaponId && selectedWeapon && (
            <View style={styles.weaponActions}>
              <TouchableOpacity
                style={[styles.btnAction, styles.btnUpgrade]}
                onPress={handleUpgrade}
                disabled={state.upgradeChances <= 0 || selectedWeapon.level >= MAX_WEAPON_LEVEL}
              >
                <Text style={styles.btnActionText}>
                  升级 · {selectedWeapon.level}/{MAX_WEAPON_LEVEL}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btnAction, styles.btnDestroy]}
                onPress={handleDestroy}
              >
                <Text style={styles.btnActionText}>销毁</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Inventory grid */}
          {state.weaponInventory.length === 0 && (
            <Text style={styles.emptyText}>暂无武器，前往战斗获取</Text>
          )}
          {state.weaponInventory.length > 0 && filteredInventory.length === 0 && (
            <Text style={styles.emptyText}>无匹配武器</Text>
          )}
          <View style={styles.invGrid}>
            {filteredInventory.map((wpn) => (
              <WeaponCard
                key={wpn.id}
                weapon={wpn}
                selected={selectedWeaponId === wpn.id}
                onPress={() => setSelectedWeaponId(selectedWeaponId === wpn.id ? null : wpn.id)}
                compact={selectedWeaponId !== wpn.id}
              />
            ))}
          </View>

          <View style={{ height: 40 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
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
  scroll: { flex: 1 },

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
  upgradeIcon: { fontSize: 8, color: COLORS.gold },
  upgradeText: { fontSize: FONT.sm, fontWeight: '600', color: COLORS.goldDark },

  pageTitle: {
    fontSize: FONT.title,
    fontWeight: '300',
    textAlign: 'center',
    marginBottom: SPACING.xl,
    color: COLORS.text,
    letterSpacing: 4,
  },

  // Character cards
  charBlock: {
    marginBottom: SPACING.sm,
  },
  charCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    padding: SPACING.md,
    ...SHADOW.card,
  },
  charCardSelected: {
    borderColor: COLORS.gold,
    backgroundColor: COLORS.cardStrong,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  charMain: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  charAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(201,169,110,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(201,169,110,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  charAvatarText: {
    fontSize: FONT.lg,
    fontWeight: '600',
    color: COLORS.gold,
  },
  charInfo: {
    flex: 1,
  },
  charName: {
    fontSize: FONT.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  charStats: {
    flexDirection: 'row',
    gap: 10,
  },
  charStat: {
    fontSize: FONT.xs,
    color: COLORS.textSecondary,
  },
  charNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
    gap: 6,
  },
  dmgTypeBadge: {
    fontSize: 9,
    fontWeight: '600',
    color: COLORS.rarity3,
    backgroundColor: 'rgba(107,164,201,0.1)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: RADIUS.xs,
    overflow: 'hidden',
  },
  dmgTypeSpell: {
    color: COLORS.purple,
    backgroundColor: 'rgba(167,133,201,0.1)',
  },
  charBaseRow: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  charArrow: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginLeft: SPACING.sm,
  },

  // Expanded stat summary
  statSummary: {
    backgroundColor: 'rgba(0,0,0,0.02)',
    padding: SPACING.sm,
    borderTopWidth: 0.5,
    borderColor: COLORS.border,
  },
  statSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statSummaryLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: COLORS.textMuted,
    width: 32,
  },
  statSummaryVal: {
    fontSize: 10,
    color: COLORS.textSecondary,
    flex: 1,
    textAlign: 'center',
  },
  statBonus: {
    color: COLORS.green,
  },
  statSummaryDivider: {
    height: 0.5,
    backgroundColor: COLORS.border,
    marginVertical: 4,
  },
  statSummaryFinal: {
    fontWeight: '600',
    color: COLORS.text,
  },

  // Weapon slots
  slotRow: {
    flexDirection: 'row',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderWidth: 0.5,
    borderTopWidth: 0,
    borderColor: COLORS.gold,
    borderBottomLeftRadius: RADIUS.md,
    borderBottomRightRadius: RADIUS.md,
    padding: SPACING.sm,
  },
  slot: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.sm,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    padding: 8,
    minHeight: 62,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotEmpty: {
    borderStyle: 'dashed',
    borderColor: COLORS.border,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  slotIcon: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginBottom: 2,
  },
  slotLabel: {
    fontSize: FONT.xs - 1,
    color: COLORS.textMuted,
    marginBottom: 3,
  },
  slotWpn: {
    alignItems: 'center',
  },
  slotWpnType: {
    fontWeight: '600',
    fontSize: 10,
    color: COLORS.gold,
  },
  slotWpnStat: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  slotEmptyText: {
    fontSize: 10,
    color: COLORS.textMuted,
  },

  // Inventory
  invSection: { marginTop: SPACING.xl },
  invHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: FONT.lg,
    fontWeight: '300',
    color: COLORS.text,
    letterSpacing: 2,
  },
  btnFilter: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: RADIUS.xs,
    borderWidth: 0.5,
    borderColor: COLORS.border,
  },
  btnFilterActive: {
    borderColor: COLORS.gold,
    backgroundColor: 'rgba(201,169,110,0.08)',
  },
  btnFilterText: { fontSize: FONT.xs, color: COLORS.textSecondary },
  btnFilterTextActive: { color: COLORS.goldDark },

  weaponActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  btnAction: {
    flex: 1,
    padding: 10,
    borderRadius: RADIUS.sm,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnUpgrade: {
    backgroundColor: 'rgba(123,165,135,0.15)',
    borderWidth: 0.5,
    borderColor: COLORS.green,
  },
  btnDestroy: {
    backgroundColor: 'rgba(212,117,107,0.08)',
    borderWidth: 0.5,
    borderColor: COLORS.red,
  },
  btnActionText: {
    fontSize: FONT.xs,
    fontWeight: '500',
    color: COLORS.text,
  },

  invGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: 6,
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.textMuted,
    padding: 24,
    fontSize: FONT.sm,
  },
});
