# 战斗游戏 (Battle Game)

基于 Expo (React Native) 的竖屏回合制角色战斗游戏，象牙白底浅色主题，10 个关卡，3 个可选角色。

## 快速开始

```bash
npm install
npx expo install @expo/metro-runtime react-native-web react-dom
npx expo start
```

- 按 `w` 在浏览器中打开 Web 版
- 按 `a` 在 Android 模拟器中打开（需先安装 Android Studio）

### EAS 云端构建 APK

```bash
npx eas-cli build -p android --profile preview
```

## 游戏机制

### 角色

| 角色 | 基础攻击 | 基础生命 | 伤害类型 | 定位 |
|------|---------|---------|---------|------|
| 角色A | 10 | 100 | 物理 | 均衡战士 |
| 角色B | 16 | 60 | 法术 | 玻璃大炮 |
| 角色C | 6 | 160 | 物理 | 肉盾坦克 |

### 武器系统

- **4 种武器类型**：A（生命）、B（攻击）、C（暴击率/暴击伤害）、D（物理/法术增伤）
- 武器可通过消耗升级次数升至 3 级，每级强化主词条和随机副词条
- 销毁武器返还升级次数，未装备武器存入背包
- 武器槽位与类型严格对应，自动换装

### 战斗

- 回合制自动战斗（每 tick 角色与敌人各行动一次）
- 暴击判定 + 增伤叠加计算伤害
- 飘字动画显示伤害数值，暴击有特殊标记
- HP 血条颜色随血量变化（绿 → 金 → 红）

### 关卡

共 10 关，敌人 HP 为 `100 × 2^(关卡-1)`，伤害随关卡递增。

## 技术架构

- **入口**：`App.js` — `SafeAreaProvider` → `GameProvider` → `AppNavigator`
- **状态管理**：`src/store/GameContext.js` — React Context + useReducer
- **游戏数据**：`src/data/gameData.js` — 纯函数（武器生成、升级、伤害计算）
- **样式**：`src/styles/theme.js` — 象牙白底 `#f5f0eb`，香槟金 `#C9A96E`，玻璃态卡片
- **构建**：Expo SDK 52，EAS 云端构建 Android APK

## 项目结构

```
├── App.js                      # 应用入口
├── eas.json                    # EAS 构建配置
├── src/
│   ├── store/GameContext.js    # 全局状态管理
│   ├── data/gameData.js        # 游戏数据与逻辑
│   ├── screens/
│   │   ├── MainScreen.js       # 主菜单
│   │   ├── CharacterScreen.js  # 角色编队与武器管理
│   │   └── BattleScreen.js     # 战斗界面
│   ├── components/
│   │   ├── WeaponCard.js       # 武器卡片
│   │   ├── FilterPanel.js      # 武器筛选面板
│   │   └── HpBar.js            # 血量条
│   └── styles/theme.js         # 主题样式常量
└── assets/                     # 图片与图标资源
```
