# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

Expo (React Native) 回合制角色战斗游戏，竖屏原神风格浅色主题（象牙白底 `#f5f0eb`，香槟金 `#C9A96E`，玻璃态卡片）。使用 EAS 云端构建 Android APK。10 个关卡，3 个可选角色。

## 命令

```bash
npm install                                                    # 安装依赖
npx expo install @expo/metro-runtime react-native-web react-dom # Web 所需额外依赖
npx expo start                                                 # 启动开发服务器
npx expo start --web                                           # 启动 Web 版本
eas build -p android --profile preview                         # EAS 云端构建 APK
```

## 核心架构

**入口**: `App.js` — `SafeAreaProvider` > `GameProvider` > `AppNavigator`。使用 `registerRootComponent(App)` 注册。`AppNavigator` 用 `useState('main'|'character'|'battle')` 切换页面，props 回调传导航。

**状态管理**: `src/store/GameContext.js` — React Context + `useReducer`。全局 state：
- `characters` — 角色数组，每个角色有 `weapons[4]` 对应 A/B/C/D 四个槽位（null 表示空）
- `weaponInventory` — 未装备的武器背包
- `upgradeChances` — 可用升级次数

Provider 导出便捷方法: `equipWeapon`, `unequipWeapon`, `upgradeWeaponById`, `destroyWeapon`, `addWeapons`, `addUpgradeChances`。通过 `useGame()` hook 访问。

**游戏数据**: `src/data/gameData.js` — 纯函数，无副作用，无平台依赖。
- `CHARACTER_A/B/C` — 3 个角色常量，各有不同 `baseAttack`, `baseHp`, `damageType`
- `generateWeapon(type?)` — 生成武器，type 不传则随机
- `upgradeWeapon(weapon)` — 深拷贝升级，满级返回 null
- `getDestroyUpgrades(level)` — 销毁返还次数：1 级以下返 1，2 级以上返 2
- `calculateCharacterStats(character)` — 汇总 base + 4 武器主/副词条
- `calculateDamage(stats)` — 暴击判定 + 增伤叠加（加法），返回 `{ damage, isCrit }`
- `getEnemyForLevel(level)` — HP = `100 * 2^(level-1)`，伤害 = `5 + (level-1)`

**角色差异化**:
| 角色 | baseAttack | baseHp | damageType | 定位 |
|------|-----------|--------|------------|------|
| 角色A | 10 | 100 | physical | 均衡战士 |
| 角色B | 16 | 60 | spell | 法术玻璃大炮 |
| 角色C | 6 | 160 | physical | 物理坦克 |

`damageType` 决定 `calculateDamage` 使用 `physicalDmg` 还是 `spellDmg` 加成。暴击公式: `totalMultiplier = dmgMultiplier + critDmg/100`（加法叠加）。

**武器词条系统**:
- A(生命) / B(攻击) 主词条固定
- C(暴击率|暴击伤害) / D(物理增伤|法术增伤) 主词条随机二选一
- 副词条从 `[hp, atk, critRate, critDmg, invalid]` 中随机 3 个不重复（invalid 可重复）
- 满级 3 级，每升一级主词条 +base，随机一个副词条 +base

**样式系统**: `src/styles/theme.js` — `COLORS`, `GLASS`, `SPACING`, `FONT`, `RADIUS`, `SHADOW`, `MIN_TOUCH=44`。各组件 `StyleSheet.create()` 内联样式，RN Flexbox 布局。

**战斗系统**: `src/screens/BattleScreen.js` — 4 个 phase: `select → battle → victory/defeat`。单个 `battleState` 对象 `{ enemy, chars, log, dmgNums }`。`setInterval` 1000ms tick，角色和敌人每 tick 各行动一次。胜利/失败在独立 `useEffect` 中检测。`DamageNum` 组件用 `Animated.timing` translateY -50 + opacity 渐变实现飘字，暴击显示更大字号 + "暴击!" 标记。

**角色编队**: `src/screens/CharacterScreen.js` — 角色卡片展示头像/名称/伤害类型标签/基础属性/最终属性，展开后显示完整属性汇总（基础 → 武器加成 → 最终）和 4 武器槽。武器背包支持筛选：武器类型单选、主属性多选、副属性多选，三类之间 AND。

## 武器装备流程

1. 角色页展开角色 → 显示属性汇总 + 4 武器槽
2. 槽位与武器类型严格对应：slot[0]=A, slot[1]=B, slot[2]=C, slot[3]=D
3. `EQUIP_WEAPON` 自动换装：新武器装入，旧武器退回背包
4. `UPGRADE_WEAPON` 消耗 upgradeChances，可升级背包或已装备武器，最多 3 级
5. `DESTROY_WEAPON` 返还 upgradeChances，可销毁已装备武器

## 已知注意事项

- `upgradeWeapon` 使用 `JSON.parse(JSON.stringify())` 深拷贝
- 战斗 `setBattleState` 使用函数式更新避免闭包过期
- 全局 `nextWeaponId` 在模块作用域递增
- RN 中 `gap` 属性在 Expo 52 可用
- 伤害数字 `dmgNum` 使用 `position: 'absolute'`，父容器需 `position: 'relative'`
- 初始 state 中角色用 `JSON.parse(JSON.stringify())` 深拷贝避免引用共享
- 稀有度色: Lv0=灰, Lv1=蓝(#6BA4C9), Lv2=紫(#A785C9), Lv3=金(#C9A96E)
- HP 血条: >50% 绿, >20% 金, ≤20% 红, 阵亡灰
