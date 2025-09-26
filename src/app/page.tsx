"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Player, GameSettings, GameResult } from '@/lib/types';
import { addGameToHistory } from '@/lib/storage';
import GameSetup from '@/components/GameSetup';
import ScoreCounter from '@/components/ScoreCounter';
import FirstClickWins from '@/components/FirstClickWins';
import DarkSelfChallenge from '@/components/DarkSelfChallenge';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useFirestore } from '@/firebase';

type GameState = 'setup' | 'playing';

export default function Home() {
  const { user, loading } = useAuth();
  const db = useFirestore();
  const router = useRouter();

  const [gameState, setGameState] = useState<GameState>('setup');
  const [gameSettings, setGameSettings] = useState<GameSettings | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);


  const handleStartGame = (settings: GameSettings) => {
    setGameSettings(settings);
    setGameState('playing');
  };

  const handleGameEnd = async (result: Omit<GameResult, 'id' | 'date' | 'players' | 'mode' | 'userId'>) => {
    if (!gameSettings || !user || !db) return;
    
    const gameResultForDb: Omit<GameResult, 'id' | 'date' | 'userId'> = {
        ...result,
        players: gameSettings.players,
        mode: gameSettings.mode,
    };

    try {
        await addGameToHistory(db, user.uid, gameResultForDb);
        toast({
            title: 'Game Over!',
            description: `${result.winner?.name || 'Nobody'} wins. The result has been saved to your history.`,
        });
    } catch (error) {
        console.error("Failed to save game history:", error);
        toast({
            variant: "destructive",
            title: 'Oh no!',
            description: 'Could not save your game result. Please try again.',
        });
    }
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

  if (loading || !user) {
    return <div>Loading...</div>; // Or a proper loading spinner
  }

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
