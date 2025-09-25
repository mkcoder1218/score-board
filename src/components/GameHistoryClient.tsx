"use client";

import { useState, useEffect } from 'react';
import type { GameResult } from '@/lib/types';
import * as storage from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Card } from '@/components/ui/card';

export function GameHistoryClient() {
  const [history, setHistory] = useState<GameResult[]>([]);
  
  useEffect(() => {
    setHistory(storage.getHistory());
  }, []);

  const handleClearHistory = () => {
    storage.clearHistory();
    setHistory([]);
  };
  
  const getBadgeVariant = (mode: string) => {
    switch (mode) {
      case 'Score Counter': return 'default';
      case 'First-Click Wins': return 'secondary';
      case 'Dark Self Challenge': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <Card className="space-y-6 p-6">
       <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" disabled={history.length === 0}>
            <Trash2 className="mr-2 h-4 w-4" /> Clear All History
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete all your game history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearHistory}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <Table>
        {history.length === 0 && <TableCaption>No game history yet. Play a game to see it here!</TableCaption>}
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Game Mode</TableHead>
            <TableHead>Players</TableHead>
            <TableHead>Winner</TableHead>
            <TableHead className="text-right">Scores</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {history.map(game => (
            <TableRow key={game.id}>
              <TableCell className='text-xs text-muted-foreground'>{format(new Date(game.date), 'PPp')}</TableCell>
              <TableCell>
                <Badge variant={getBadgeVariant(game.mode)}>{game.mode}</Badge>
              </TableCell>
              <TableCell>{game.players.map(p => p.name).join(', ')}</TableCell>
              <TableCell className="font-semibold">{game.winner?.name || 'N/A'}</TableCell>
              <TableCell className="text-right font-mono text-sm">
                {game.scores && game.scores.length > 0
                  ? game.scores.map(s => {
                      const player = game.players.find(p => p.id === s.playerId);
                      return `${player?.name.split(' ')[0]}: ${s.score}`;
                    }).join(' | ')
                  : 'N/A'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
