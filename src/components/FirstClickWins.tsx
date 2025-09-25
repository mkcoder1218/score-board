"use client";

import { useState } from 'react';
import type { Player, GameSettings, GameResult } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Award, Users, XCircle } from 'lucide-react';

interface FirstClickWinsProps {
  settings: GameSettings;
  onGameEnd: (result: Omit<GameResult, 'id' | 'date' | 'players' | 'mode'>) => void;
  onNewGame: () => void;
}

export default function FirstClickWins({ settings, onGameEnd, onNewGame }: FirstClickWinsProps) {
  const [winner, setWinner] = useState<Player | null>(null);

  const handleClick = (player: Player) => {
    if (winner) return;
    setWinner(player);
    onGameEnd({ winner: player, scores: [] });
  };

  return (
    <Card className="max-w-4xl mx-auto animate-in fade-in-0 zoom-in-95">
      <CardHeader>
        <CardTitle className="font-headline text-3xl">First-Click Wins</CardTitle>
        <CardDescription className="flex items-center gap-2"><Users /> {settings.players.map(p => p.name).join(', ')}</CardDescription>
      </CardHeader>
      <CardContent>
        {winner ? (
          <div className="text-center p-8 bg-accent/20 rounded-lg animate-in fade-in-0 zoom-in-95">
            <h2 className="text-4xl font-bold text-accent-foreground font-headline">
              <Award className="inline-block h-10 w-10 mr-4" />
              {winner.name} Wins!
            </h2>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {settings.players.map(player => (
              <Button key={player.id} onClick={() => handleClick(player)} className="h-48 text-2xl font-bold font-headline transition-transform transform hover:scale-105" variant="secondary">
                {player.name}
              </Button>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-6">
        <Button onClick={onNewGame} variant="outline" className="w-full">
          <XCircle className="mr-2" /> New Game
        </Button>
      </CardFooter>
    </Card>
  );
}
