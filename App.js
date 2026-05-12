import React, { useState } from 'react';
import { StatusBar, Platform } from 'react-native';
import { registerRootComponent } from 'expo';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GameProvider } from './src/store/GameContext';
import MainScreen from './src/screens/MainScreen';
import CharacterScreen from './src/screens/CharacterScreen';
import BattleScreen from './src/screens/BattleScreen';

function AppNavigator() {
  const [page, setPage] = useState('main');
  const [battleLevel, setBattleLevel] = useState(1);

  const goToBattle = (level) => {
    setBattleLevel(level);
    setPage('battle');
  };

  switch (page) {
    case 'character':
      return <CharacterScreen onBack={() => setPage('main')} />;
    case 'battle':
      return <BattleScreen level={battleLevel} onBack={() => setPage('main')} />;
    default:
      return (
        <MainScreen
          onBattle={goToBattle}
          onCharacter={() => setPage('character')}
        />
      );
  }
}

export default function App() {
  return (
    <SafeAreaProvider>
      {Platform.OS !== 'web' && (
        <StatusBar barStyle="dark-content" backgroundColor="#f5f0eb" />
      )}
      <GameProvider>
        <AppNavigator />
      </GameProvider>
    </SafeAreaProvider>
  );
}

registerRootComponent(App);
