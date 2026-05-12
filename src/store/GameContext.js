import React, { createContext, useContext, useReducer } from 'react';
import { CHARACTER_A, CHARACTER_B, CHARACTER_C, upgradeWeapon, getDestroyUpgrades } from '../data/gameData';

const GameContext = createContext(null);

const initialState = {
  characters: [
    JSON.parse(JSON.stringify(CHARACTER_A)),
    JSON.parse(JSON.stringify(CHARACTER_B)),
    JSON.parse(JSON.stringify(CHARACTER_C)),
  ],
  weaponInventory: [],
  upgradeChances: 0,
};

function gameReducer(state, action) {
  switch (action.type) {
    case 'EQUIP_WEAPON': {
      const { characterId, weapon, slot } = action.payload;
      let oldWeapon = null;
      const chars = state.characters.map((c) => {
        if (c.id !== characterId) return c;
        const weapons = [...c.weapons];
        oldWeapon = weapons[slot];
        weapons[slot] = weapon;
        return { ...c, weapons };
      });
      const newInv = state.weaponInventory.filter((w) => w.id !== weapon.id);
      if (oldWeapon) newInv.push(oldWeapon);
      return { ...state, characters: chars, weaponInventory: newInv };
    }

    case 'UNEQUIP_WEAPON': {
      const { characterId, slot } = action.payload;
      const chars = state.characters.map((c) => {
        if (c.id !== characterId) return c;
        const weapons = [...c.weapons];
        weapons[slot] = null;
        return { ...c, weapons };
      });
      const char = state.characters.find((c) => c.id === characterId);
      const oldWeapon = char?.weapons[slot];
      const newInv = oldWeapon ? [...state.weaponInventory, oldWeapon] : state.weaponInventory;
      return { ...state, characters: chars, weaponInventory: newInv };
    }

    case 'UPGRADE_WEAPON': {
      const { weaponId } = action.payload;
      let found = state.weaponInventory.find((w) => w.id === weaponId);
      let source = 'inventory';
      let charId = null;
      let slotIdx = null;

      if (!found) {
        for (const c of state.characters) {
          for (let i = 0; i < c.weapons.length; i++) {
            if (c.weapons[i] && c.weapons[i].id === weaponId) {
              found = c.weapons[i];
              source = 'character';
              charId = c.id;
              slotIdx = i;
              break;
            }
          }
          if (found) break;
        }
      }

      if (!found) return state;
      if (state.upgradeChances <= 0) return state;

      const upgraded = upgradeWeapon(found);
      if (!upgraded) return state;

      if (source === 'inventory') {
        const newInv = state.weaponInventory.map((w) =>
          w.id === weaponId ? upgraded : w
        );
        return { ...state, weaponInventory: newInv, upgradeChances: state.upgradeChances - 1 };
      } else {
        const chars = state.characters.map((c) => {
          if (c.id !== charId) return c;
          const weapons = [...c.weapons];
          weapons[slotIdx] = upgraded;
          return { ...c, weapons };
        });
        return { ...state, characters: chars, upgradeChances: state.upgradeChances - 1 };
      }
    }

    case 'DESTROY_WEAPON': {
      const { weaponId } = action.payload;
      let wpn = state.weaponInventory.find((w) => w.id === weaponId);
      if (wpn) {
        const bonus = getDestroyUpgrades(wpn.level);
        const newInv = state.weaponInventory.filter((w) => w.id !== weaponId);
        return { ...state, weaponInventory: newInv, upgradeChances: state.upgradeChances + bonus };
      }
      // Check equipped weapons
      for (const c of state.characters) {
        for (let i = 0; i < c.weapons.length; i++) {
          if (c.weapons[i] && c.weapons[i].id === weaponId) {
            wpn = c.weapons[i];
            const bonus = getDestroyUpgrades(wpn.level);
            const chars = state.characters.map((ch) => {
              if (ch.id !== c.id) return ch;
              const weapons = [...ch.weapons];
              weapons[i] = null;
              return { ...ch, weapons };
            });
            return { ...state, characters: chars, upgradeChances: state.upgradeChances + bonus };
          }
        }
      }
      return state;
    }

    case 'ADD_WEAPONS': {
      return { ...state, weaponInventory: [...state.weaponInventory, ...action.payload.weapons] };
    }

    case 'ADD_UPGRADE_CHANCES': {
      return { ...state, upgradeChances: state.upgradeChances + action.payload.amount };
    }

    default:
      return state;
  }
}

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  const value = {
    state,
    dispatch,
    equipWeapon: (characterId, weapon, slot) =>
      dispatch({ type: 'EQUIP_WEAPON', payload: { characterId, weapon, slot } }),
    unequipWeapon: (characterId, slot) =>
      dispatch({ type: 'UNEQUIP_WEAPON', payload: { characterId, slot } }),
    upgradeWeaponById: (weaponId) =>
      dispatch({ type: 'UPGRADE_WEAPON', payload: { weaponId } }),
    destroyWeapon: (weaponId) =>
      dispatch({ type: 'DESTROY_WEAPON', payload: { weaponId } }),
    addWeapons: (weapons) =>
      dispatch({ type: 'ADD_WEAPONS', payload: { weapons } }),
    addUpgradeChances: (amount) =>
      dispatch({ type: 'ADD_UPGRADE_CHANCES', payload: { amount } }),
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}
