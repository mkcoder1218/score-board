"use client";

import { useState, useEffect } from 'react';
import type { Player, GameSettings, GameResult } from '@/lib/types';
import * as storage from '@/lib/storage';
import GameSetup from '@/components/GameSetup';
import ScoreCounter from '@/components/ScoreCounter';
import FirstClickWins from '@/components/FirstClickWins';
import DarkSelfChallenge from '@/components/DarkSelfChallenge';
import { useToast } from '@/hooks/use-toast';

type GameState = 'setup' | 'playing';

export default function Home() {
  const [gameState, setGameState] = useState<GameState>('setup');
  const [gameSettings, setGameSettings] = useState<GameSettings | null>(null);
  const { toast } = useToast();

  const handleStartGame = (settings: GameSettings) => {
    setGameSettings(settings);
    setGameState('playing');
  };

  const handleGameEnd = (result: Omit<GameResult, 'id' | 'date' | 'players' | 'mode'>) => {
    if (!gameSettings) return;
    const gameResult: GameResult = {
      ...result,
      id: new Date().toISOString() + Math.random(),
      date: new Date().toISOString(),
      players: gameSettings.players,
      mode: gameSettings.mode,
    };
    storage.addGameToHistory(gameResult);
    toast({
      title: 'Game Over!',
      description: `${gameResult.winner?.name || 'Nobody'} wins. The result has been saved to your history.`,
    });
  };
  
  const handleNewGame = () => {
    setGameState('setup');
    setGameSettings(null);
  }

  const renderGameMode = () => {
    if (!gameSettings) return null;

    switch (gameSettings.mode) {
      case 'Score Counter':
        return <ScoreCounter settings={gameSettings} onGameEnd={handleGameEnd} onNewGame={handleNewGame} />;
      case 'First-Click Wins':
        return <FirstClickWins settings={gameSettings} onGameEnd={handleGameEnd} onNewGame={handleNewGame} />;
      case 'Dark Self Challenge':
        return <DarkSelfChallenge settings={gameSettings} onGameEnd={handleGameEnd} onNewGame={handleNewGame} />;
      default:
        return null;
    }
  };

  return (
    <div className="w-full">
      {gameState === 'setup' ? (
        <GameSetup onStartGame={handleStartGame} />
      ) : (
        renderGameMode()
      )}
    </div>
  );
}
