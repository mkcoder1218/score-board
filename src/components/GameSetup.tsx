"use client";

import { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Player, GameMode, GameSettings } from '@/lib/types';
import * as storage from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { UserPlus, Trash2, Users, Timer as TimerIcon, Shield, Moon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  newPlayerName: z.string().min(1, 'Player name cannot be empty.').max(20, 'Player name is too long.'),
});

interface GameSetupProps {
  onStartGame: (settings: GameSettings) => void;
}

export default function GameSetup({ onStartGame }: GameSetupProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [gameMode, setGameMode] = useState<GameMode>('Score Counter');
  const [useTimer, setUseTimer] = useState(false);
  const [timeLimit, setTimeLimit] = useState(60);
  const [darkSelfHours, setDarkSelfHours] = useState(0);
  const [darkSelfMinutes, setDarkSelfMinutes] = useState(0);
  const [darkSelfSeconds, setDarkSelfSeconds] = useState(10);
  const [darkSelfStats, setDarkSelfStats] = useState<{ playerWins: number; darkSelfWins: number } | null>(null);

  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: { newPlayerName: '' },
  });

  useEffect(() => {
    const storedPlayers = storage.getPlayers();
    setPlayers(storedPlayers);
    if(storedPlayers.length > 0) {
      setSelectedPlayerIds(storedPlayers.slice(0, 2).map(p => p.id));
    }
  }, []);

  useEffect(() => {
    if (gameMode === 'Dark Self Challenge' && selectedPlayerIds.length === 1) {
        const history = storage.getHistory();
        const currentPlayerId = selectedPlayerIds[0];
        const challengeHistory = history.filter(g => g.mode === 'Dark Self Challenge' && g.players.some(p => p.id === currentPlayerId));
        
        const playerWins = challengeHistory.filter(g => g.winner?.id === currentPlayerId).length;
        const darkSelfWins = challengeHistory.filter(g => g.winner?.id === 'dark-self').length;
        
        setDarkSelfStats({ playerWins, darkSelfWins });
    } else {
        setDarkSelfStats(null);
    }
  }, [gameMode, selectedPlayerIds]);

  const handleAddPlayer = (data: { newPlayerName: string }) => {
    const newPlayer: Player = { id: Date.now().toString(), name: data.newPlayerName.trim() };
    const updatedPlayers = [...players, newPlayer];
    setPlayers(updatedPlayers);
    storage.savePlayers(updatedPlayers);
    form.reset();
  };

  const handleDeletePlayer = (id: string) => {
    const updatedPlayers = players.filter(p => p.id !== id);
    setPlayers(updatedPlayers);
    storage.savePlayers(updatedPlayers);
    setSelectedPlayerIds(ids => ids.filter(playerId => playerId !== id));
  };
  
  const togglePlayerSelection = (id: string) => {
    setSelectedPlayerIds(prev =>
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
  };

  const handleStart = () => {
    const selectedPlayers = players.filter(p => selectedPlayerIds.includes(p.id));

    let settings: GameSettings = {
      mode: gameMode,
      players: selectedPlayers,
    };

    if (gameMode === 'Dark Self Challenge') {
        if (selectedPlayers.length !== 1) {
            toast({ variant: 'destructive', title: 'Invalid Selection', description: 'Dark Self Challenge requires exactly one player.' });
            return;
        }
        const totalSeconds = (darkSelfHours * 3600) + (darkSelfMinutes * 60) + darkSelfSeconds;
        if (totalSeconds < 5) {
          toast({ variant: 'destructive', title: 'Invalid Time', description: 'Dark Self Challenge requires a minimum of 5 seconds.' });
          return;
        }
        settings.timeLimit = totalSeconds;
    } else if (gameMode === 'First-Click Wins') {
       if (selectedPlayers.length < 1) {
            toast({ variant: 'destructive', title: 'Invalid Selection', description: 'Please select at least one player.' });
            return;
        }
    } else if (gameMode === 'Score Counter') {
        if (selectedPlayers.length < 2) {
            toast({ variant: 'destructive', title: 'Invalid Selection', description: 'Score Counter requires at least two players.' });
            return;
        }
        if (useTimer) {
          settings.timeLimit = timeLimit;
        }
    }

    onStartGame(settings);
  };

  return (
    <Card className="max-w-2xl mx-auto animate-in fade-in-0 zoom-in-95">
      <CardHeader>
        <CardTitle className="font-headline text-3xl">New Game</CardTitle>
        <CardDescription>Set up players and choose a game mode.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="space-y-4">
          <Label htmlFor="new-player" className="flex items-center gap-2 font-bold"><UserPlus /> Add New Player</Label>
          <form onSubmit={form.handleSubmit(handleAddPlayer)} className="flex gap-2">
            <Input id="new-player" placeholder="Enter player name" {...form.register('newPlayerName')} />
            <Button type="submit">Add</Button>
          </form>
          {form.formState.errors.newPlayerName && <p className="text-sm text-destructive">{form.formState.errors.newPlayerName.message}</p>}
        </div>

        <div className="space-y-4">
          <Label className="flex items-center gap-2 font-bold"><Users /> Select Players</Label>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
            {players.length > 0 ? players.map(player => (
              <div key={player.id} 
                   className={`flex items-center justify-between p-3 rounded-md cursor-pointer transition-colors ${selectedPlayerIds.includes(player.id) ? 'bg-primary/20 ring-2 ring-primary' : 'bg-secondary'}`}
                   onClick={() => togglePlayerSelection(player.id)}>
                <span className="font-medium">{player.name}</span>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0" onClick={(e) => {e.stopPropagation(); handleDeletePlayer(player.id);}}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )) : <p className="text-muted-foreground text-sm">No players added yet. Add some to get started!</p>}
          </div>
        </div>
        
        <div className="space-y-4">
          <Label className="font-bold">Game Mode</Label>
          <RadioGroup value={gameMode} onValueChange={(value) => setGameMode(value as GameMode)} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['Score Counter', 'First-Click Wins', 'Dark Self Challenge'].map(mode => (
              <Label key={mode} className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 cursor-pointer transition-colors ${gameMode === mode ? 'border-primary bg-primary/10' : 'border-border hover:bg-accent/50'}`}>
                <RadioGroupItem value={mode} id={mode} className="sr-only" />
                <span className="font-semibold text-center">{mode}</span>
              </Label>
            ))}
          </RadioGroup>
        </div>
        
        {gameMode === 'Score Counter' && (
          <div className="space-y-4 p-4 border rounded-lg bg-secondary/50">
             <div className="flex items-center justify-between">
              <Label htmlFor="use-timer" className="flex items-center gap-2 font-medium">
                <TimerIcon className="h-5 w-5" />
                <span>Enable Timer</span>
              </Label>
              <Switch id="use-timer" checked={useTimer} onCheckedChange={setUseTimer} />
            </div>
            {useTimer && (
               <div className="space-y-2 pt-4">
                 <Label htmlFor="time-limit">Time Limit (seconds)</Label>
                 <Input id="time-limit" type="number" value={timeLimit} onChange={e => setTimeLimit(Number(e.target.value))} min="10" />
               </div>
            )}
          </div>
        )}

        {gameMode === 'Dark Self Challenge' && (
          <div className="space-y-4 p-4 border rounded-lg bg-secondary/50">
            {darkSelfStats && selectedPlayerIds.length === 1 && (
              <div className="p-3 bg-background/50 rounded-lg">
                  <h4 className="font-semibold text-center mb-2">Overall Record</h4>
                  <div className="flex justify-around text-center">
                      <div>
                          <div className="flex items-center justify-center gap-2 font-bold text-lg"><Shield /> You</div>
                          <p className="text-2xl font-mono">{darkSelfStats.playerWins}</p>
                      </div>
                      <div>
                          <div className="flex items-center justify-center gap-2 font-bold text-lg"><Moon /> Dark Self</div>
                          <p className="text-2xl font-mono">{darkSelfStats.darkSelfWins}</p>
                      </div>
                  </div>
              </div>
            )}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 font-medium">
                <TimerIcon className="h-5 w-5" />
                <span>Time Limit</span>
              </Label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label htmlFor="dark-self-hours" className="text-xs text-muted-foreground">Hours</Label>
                  <Input 
                    id="dark-self-hours" 
                    type="number" 
                    value={darkSelfHours} 
                    onChange={e => setDarkSelfHours(Math.max(0, Number(e.target.value)))} 
                    min="0"
                  />
                </div>
                <div>
                  <Label htmlFor="dark-self-minutes" className="text-xs text-muted-foreground">Minutes</Label>
                  <Input 
                    id="dark-self-minutes" 
                    type="number" 
                    value={darkSelfMinutes} 
                    onChange={e => setDarkSelfMinutes(Math.max(0, Number(e.target.value)))} 
                    min="0"
                  />
                </div>
                <div>
                  <Label htmlFor="dark-self-seconds" className="text-xs text-muted-foreground">Seconds</Label>
                  <Input 
                    id="dark-self-seconds" 
                    type="number" 
                    value={darkSelfSeconds} 
                    onChange={e => setDarkSelfSeconds(Math.max(0, Number(e.target.value)))} 
                    min="0"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Choose a total time of at least 5 seconds.</p>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={handleStart} className="w-full text-lg py-6 font-bold font-headline">Start Game</Button>
      </CardFooter>
    </Card>
  );
}

    