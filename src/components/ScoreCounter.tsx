"use client";

import { useState, useEffect, useCallback } from 'react';
import type { GameSettings, Player, GameResult } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Award, Timer, Users, XCircle } from 'lucide-react';

interface ScoreCounterProps {
  settings: GameSettings;
  onGameEnd: (result: Omit<GameResult, 'id' | 'date' | 'players' | 'mode'>) => void;
  onNewGame: () => void;
}

export default function ScoreCounter({ settings, onGameEnd, onNewGame }: ScoreCounterProps) {
  const [scores, setScores] = useState<{ [key: string]: number }>(
    settings.players.reduce((acc, p) => ({ ...acc, [p.id]: 0 }), {})
  );
  const [timeLeft, setTimeLeft] = useState(settings.timeLimit);
  const [isFinished, setIsFinished] = useState(false);
  const [winner, setWinner] = useState<Player | null>(null);

  const determineWinner = useCallback(() => {
    if (settings.players.length === 0) return null;
    const winnerPlayer = settings.players.reduce((prev, current) => (scores[prev.id] > scores[current.id] ? prev : current));
    setWinner(winnerPlayer);
    return winnerPlayer;
  }, [scores, settings.players]);


  useEffect(() => {
    if (settings.timeLimit && timeLeft !== undefined && timeLeft > 0 && !isFinished) {
      const timer = setInterval(() => {
        setTimeLeft(t => (t !== undefined ? t - 1 : 0));
      }, 1000);
      return () => clearInterval(timer);
    } else if (settings.timeLimit && timeLeft !== undefined && timeLeft <= 0 && !isFinished) {
      handleFinishGame();
    }
  }, [timeLeft, settings.timeLimit, isFinished]);

  const handleIncrement = (playerId: string) => {
    if (isFinished) return;
    setScores(s => ({ ...s, [playerId]: s[playerId] + 1 }));
  };

  const handleFinishGame = () => {
    if(isFinished) return;
    const finalWinner = determineWinner();
    setIsFinished(true);
    const finalScores = Object.entries(scores).map(([playerId, score]) => ({ playerId, score }));
    onGameEnd({ winner: finalWinner, scores: finalScores });
  };

  return (
    <Card className="max-w-4xl mx-auto animate-in fade-in-0 zoom-in-95">
      <CardHeader>
        <CardTitle className="font-headline text-3xl">Score Counter</CardTitle>
        <div className="flex justify-between items-center text-muted-foreground">
          <div className="flex items-center gap-2"><Users /> {settings.players.map(p => p.name).join(', ')}</div>
          {settings.timeLimit && <div className="flex items-center gap-2 font-mono text-lg"><Timer /> {timeLeft}s</div>}
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {settings.players.map(player => (
          <div key={player.id} className="p-4 border rounded-lg flex flex-col items-center justify-center gap-4 bg-secondary/50 transform transition-transform hover:scale-105">
            <h3 className="text-xl font-semibold font-headline">{player.name}</h3>
            <p className="text-6xl font-bold">{scores[player.id]}</p>
            <Button onClick={() => handleIncrement(player.id)} disabled={isFinished} className="w-full text-lg h-12">
              +1
            </Button>
          </div>
        ))}
      </CardContent>
      <CardFooter className="flex-col gap-4 pt-6">
        {!settings.timeLimit && !isFinished && (
          <Button onClick={handleFinishGame} variant="destructive" className="w-full text-lg py-6 font-bold font-headline">
            <Award className="mr-2" /> Finish Game
          </Button>
        )}
         {isFinished && winner && (
          <div className="text-center p-4 bg-accent/20 rounded-lg w-full animate-in fade-in-0 zoom-in-95">
            <h2 className="text-2xl font-bold text-accent-foreground font-headline">Winner: {winner.name}!</h2>
            <p>With a score of {scores[winner.id]}</p>
          </div>
        )}
        <Button onClick={onNewGame} variant="outline" className="w-full">
            <XCircle className="mr-2"/> New Game
        </Button>
      </CardFooter>
    </Card>
  );
}
