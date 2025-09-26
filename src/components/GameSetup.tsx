"use client";

import { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Player, GameMode, GameSettings, DarkSelfMode } from '@/lib/types';
import { getHistory } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { UserPlus, Trash2, Users, Timer as TimerIcon, Shield, Moon, ListChecks, PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth, useFirestore, useCollection } from '@/firebase';
import { collection, doc, writeBatch, onSnapshot } from 'firebase/firestore';

const formSchema = z.object({
  newPlayerName: z.string().min(1, 'Player name cannot be empty.').max(20, 'Player name is too long.'),
});

interface GameSetupProps {
  onStartGame: (settings: GameSettings) => void;
}

export default function GameSetup({ onStartGame }: GameSetupProps) {
  const { user } = useAuth();
  const db = useFirestore();
  
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [gameMode, setGameMode] = useState<GameMode>('Score Counter');
  const [useTimer, setUseTimer] = useState(false);
  const [timeLimit, setTimeLimit] = useState(60);

  // Dark Self State
  const [darkSelfMode, setDarkSelfMode] = useState<DarkSelfMode>('Task Completion');
  const [taskHours, setTaskHours] = useState(0);
  const [taskMinutes, setTaskMinutes] = useState(10);
  const [taskSeconds, setTaskSeconds] = useState(0);
  
  const [commitmentHours, setCommitmentHours] = useState(0);
  const [commitmentMinutes, setCommitmentMinutes] = useState(10);
  const [commitmentSeconds, setCommitmentSeconds] = useState(0);
  const [graceHours, setGraceHours] = useState(0);
  const [graceMinutes, setGraceMinutes] = useState(2);
  const [graceSeconds, setGraceSeconds] = useState(0);

  const [darkSelfTasks, setDarkSelfTasks] = useState<string[]>([]);
  const [newTask, setNewTask] = useState('');
  const [darkSelfStats, setDarkSelfStats] = useState<{ playerWins: number; darkSelfWins: number } | null>(null);

  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: { newPlayerName: '' },
  });
  
  // Set up a listener for players collection
  useEffect(() => {
    if (!user || !db) return;
    const playersCollectionRef = collection(db, 'users', user.uid, 'players');
    const unsubscribe = onSnapshot(playersCollectionRef, (snapshot) => {
        const playersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Player));
        setPlayers(playersData);
        if (playersData.length > 0 && selectedPlayerIds.length === 0) {
            // setSelectedPlayerIds(playersData.slice(0, 1).map(p => p.id));
        }
    });
    return () => unsubscribe();
  }, [user, db]);


  useEffect(() => {
    if (gameMode === 'Dark Self Challenge' && selectedPlayerIds.length === 1 && user && db) {
        const historyCollectionRef = collection(db, 'users', user.uid, 'history');
        const unsubscribe = onSnapshot(historyCollectionRef, (querySnapshot) => {
            const history = querySnapshot.docs.map(doc => doc.data());
            const currentPlayerId = selectedPlayerIds[0];
            const playerInGames = history.filter(game => 
                game.mode === 'Dark Self Challenge' && game.players.some((p: Player) => p.id === currentPlayerId)
            );

            let playerWins = 0;
            let darkSelfWins = 0;

            playerInGames.forEach(game => {
                if (game.winner?.id === currentPlayerId) {
                    playerWins++;
                } else if (game.winner?.id === 'dark-self') {
                    darkSelfWins++;
                }
            });
            
            setDarkSelfStats({ playerWins, darkSelfWins });
        });
        return () => unsubscribe();
    } else {
      setDarkSelfStats(null);
    }
  }, [gameMode, selectedPlayerIds, user, db]);

  const handleAddPlayer = async (data: { newPlayerName: string }) => {
    if (!user || !db) return;
    const newPlayerName = data.newPlayerName.trim();
    // Using player name as ID for simplicity here, but can be a generated ID
    const newPlayerRef = doc(db, 'users', user.uid, 'players', newPlayerName);
    const batch = writeBatch(db);
    batch.set(newPlayerRef, { name: newPlayerName });
    await batch.commit();
    form.reset();
  };

  const handleDeletePlayer = async (playerName: string) => {
    if (!user || !db) return;
    const playerDocRef = doc(db, 'users', user.uid, 'players', playerName);
    const batch = writeBatch(db);
    batch.delete(playerDocRef);
    await batch.commit();
    setSelectedPlayerIds(ids => ids.filter(id => id !== playerName));
  };
  
  const togglePlayerSelection = (id: string) => {
    setSelectedPlayerIds(prev =>
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
  };

  useEffect(() => {
    if (user) {
        const defaultPlayer: Player = { id: user.uid, name: user.displayName || user.email || 'You' };
        setPlayers(p => p.find(pl => pl.id === defaultPlayer.id) ? p : [defaultPlayer, ...p]);
        setSelectedPlayerIds([defaultPlayer.id]);
    }
  }, [user]);

  const handleAddTask = () => {
    if (newTask.trim()) {
      setDarkSelfTasks([...darkSelfTasks, newTask.trim()]);
      setNewTask('');
    }
  };

  const handleDeleteTask = (index: number) => {
    setDarkSelfTasks(darkSelfTasks.filter((_, i) => i !== index));
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
        settings.darkSelfMode = darkSelfMode;
        if (darkSelfMode === 'Task Completion') {
          const totalSeconds = (taskHours * 3600) + (taskMinutes * 60) + taskSeconds;
          if (totalSeconds < 5) {
            toast({ variant: 'destructive', title: 'Invalid Time', description: 'Task Completion requires a minimum of 5 seconds.' });
            return;
          }
          if (darkSelfTasks.length === 0) {
            toast({ variant: 'destructive', title: 'No Tasks', description: 'Please add at least one task to complete.' });
            return;
          }
          settings.timeLimit = totalSeconds;
          settings.tasks = darkSelfTasks;
        } else { // Commitment Challenge
            const commitmentSecs = (commitmentHours * 3600) + (commitmentMinutes * 60) + commitmentSeconds;
            const graceSecs = (graceHours * 3600) + (graceMinutes * 60) + graceSeconds;
            if(commitmentSecs <= 0 || graceSecs <= 0) {
              toast({ variant: 'destructive', title: 'Invalid Time', description: 'Commitment and grace times must be positive and non-zero.' });
              return;
            }
            settings.commitmentTime = commitmentSecs;
            settings.graceTime = graceSecs;
            settings.timeLimit = commitmentSecs + graceSecs;
        }

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
          <Label className="flex items-center gap-2 font-bold"><Users /> Select Players</Label>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
            {players.map(player => (
              <div key={player.id} 
                   className={`flex items-center justify-between p-3 rounded-md cursor-pointer transition-colors ${selectedPlayerIds.includes(player.id) ? 'bg-primary/20 ring-2 ring-primary' : 'bg-secondary'}`}
                   onClick={() => togglePlayerSelection(player.id)}>
                <span className="font-medium">{player.name}</span>
                {/* No deleting the main user player */}
                {player.id !== user?.uid && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0" onClick={(e) => {e.stopPropagation(); handleDeletePlayer(player.id);}}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                )}
              </div>
            ))}
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
          <div className="space-y-6 p-4 border rounded-lg bg-secondary/50">
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
            <Tabs value={darkSelfMode} onValueChange={(value) => setDarkSelfMode(value as DarkSelfMode)} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="Task Completion">Task Completion</TabsTrigger>
                <TabsTrigger value="Commitment Challenge">Commitment</TabsTrigger>
              </TabsList>
              <TabsContent value="Task Completion" className="space-y-6 pt-4">
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
                        value={taskHours} 
                        onChange={e => setTaskHours(Math.max(0, Number(e.target.value)))} 
                        min="0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="dark-self-minutes" className="text-xs text-muted-foreground">Minutes</Label>
                      <Input 
                        id="dark-self-minutes" 
                        type="number" 
                        value={taskMinutes} 
                        onChange={e => setTaskMinutes(Math.max(0, Number(e.target.value)))} 
                        min="0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="dark-self-seconds" className="text-xs text-muted-foreground">Seconds</Label>
                      <Input 
                        id="dark-self-seconds" 
                        type="number" 
                        value={taskSeconds} 
                        onChange={e => setTaskSeconds(Math.max(0, Number(e.target.value)))} 
                        min="0"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">Choose a total time of at least 5 seconds.</p>
                </div>
                 <div className="space-y-4">
                  <Label className="flex items-center gap-2 font-medium">
                    <ListChecks className="h-5 w-5" />
                    <span>Tasks to Complete</span>
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      value={newTask}
                      onChange={(e) => setNewTask(e.target.value)}
                      placeholder="e.g., 'Meditate for 10 minutes'"
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTask(); }}}
                    />
                    <Button type="button" onClick={handleAddTask}><PlusCircle /></Button>
                  </div>
                  <div className="space-y-2">
                    {darkSelfTasks.map((task, index) => (
                      <div key={index} className="flex items-center justify-between bg-background p-2 rounded-md">
                        <p className="text-sm">{task}</p>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDeleteTask(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    {darkSelfTasks.length === 0 && <p className="text-xs text-muted-foreground text-center pt-2">Add at least one task to start the challenge.</p>}
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="Commitment Challenge" className="space-y-6 pt-4">
                <p className="text-sm text-muted-foreground">Commit to starting a task. A button will appear when it's time. Click it before the grace period ends to win.</p>
                <div className="space-y-2">
                  <Label>Time to start</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label htmlFor="commitment-hours" className="text-xs text-muted-foreground">Hours</Label>
                      <Input 
                        id="commitment-hours" 
                        type="number" 
                        value={commitmentHours} 
                        onChange={e => setCommitmentHours(Math.max(0, Number(e.target.value)))} 
                        min="0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="commitment-minutes" className="text-xs text-muted-foreground">Minutes</Label>
                      <Input 
                        id="commitment-minutes" 
                        type="number" 
                        value={commitmentMinutes} 
                        onChange={e => setCommitmentMinutes(Math.max(0, Number(e.target.value)))} 
                        min="0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="commitment-seconds" className="text-xs text-muted-foreground">Seconds</Label>
                      <Input 
                        id="commitment-seconds" 
                        type="number" 
                        value={commitmentSeconds} 
                        onChange={e => setCommitmentSeconds(Math.max(0, Number(e.target.value)))} 
                        min="0"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">Time until you must start your task.</p>
                </div>
                <div className="space-y-2">
                  <Label>Grace period</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label htmlFor="grace-hours" className="text-xs text-muted-foreground">Hours</Label>
                      <Input 
                        id="grace-hours" 
                        type="number" 
                        value={graceHours} 
                        onChange={e => setGraceHours(Math.max(0, Number(e.target.value)))} 
                        min="0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="grace-minutes" className="text-xs text-muted-foreground">Minutes</Label>                      <Input 
                        id="grace-minutes" 
                        type="number" 
                        value={graceMinutes} 
                        onChange={e => setGraceMinutes(Math.max(0, Number(e.target.value)))} 
                        min="0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="grace-seconds" className="text-xs text-muted-foreground">Seconds</Label>
                      <Input 
                        id="grace-seconds" 
                        type="number" 
                        value={graceSeconds} 
                        onChange={e => setGraceSeconds(Math.max(0, Number(e.target.value)))} 
                        min="0"
                      />
                    </div>
                  </div>
                   <p className="text-xs text-muted-foreground">Extra time to press the button after the commitment time.</p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={handleStart} className="w-full text-lg py-6 font-bold font-headline" disabled={!user}>Start Game</Button>
      </CardFooter>
    </Card>
  );
}
