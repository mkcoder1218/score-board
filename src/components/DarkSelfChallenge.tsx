
"use client";

import { useState, useEffect, useRef } from 'react';
import type { GameSettings, GameResult } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Shield, User, XCircle, Moon, CheckSquare, Square } from 'lucide-react';
import { generateDarkSelfMessage } from '@/ai/flows/dark-self-challenge-prompt';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface DarkSelfChallengeProps {
  settings: GameSettings;
  onGameEnd: (result: Omit<GameResult, 'id' | 'date' | 'players' | 'mode'>) => void;
  onNewGame: () => void;
}

type Task = {
    id: string;
    description: string;
    completed: boolean;
};

const DEFAULT_CHALLENGE_TIME = 10;
const ORIGINAL_TITLE = 'Consistent Clicker';

// Helper to request notification permission
const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
        console.log("This browser does not support desktop notification");
        return;
    }
    if (Notification.permission !== 'denied') {
        await Notification.requestPermission();
    }
};

// Helper to show a notification
const showNotification = (title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body });
    }
};

const formatTimeForTitle = (seconds: number) => {
    if (seconds <= 0) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

export default function DarkSelfChallenge({ settings, onGameEnd, onNewGame }: DarkSelfChallengeProps) {
  const challengeTime = settings.timeLimit || DEFAULT_CHALLENGE_TIME;
  const [outcome, setOutcome] = useState<'won' | 'lost' | null>(null);
  const [timeLeft, setTimeLeft] = useState(challengeTime);
  const [motivationalMessage, setMotivationalMessage] = useState('');
  const [showDefeatDialog, setShowDefeatDialog] = useState(false);
  const [tasks, setTasks] = useState<Task[]>(
    settings.tasks?.map((task, index) => ({
      id: `task-${index}`,
      description: task,
      completed: false,
    })) || []
  );

  const gameEndedRef = useRef(false);
  const player = settings.players[0];
  const endTimeRef = useRef<number | null>(null);

  // Effect to manage the document title
  useEffect(() => {
    const originalTitle = document.title;
    if (outcome) {
        document.title = originalTitle;
    } else {
        document.title = `${formatTimeForTitle(timeLeft)} | ${ORIGINAL_TITLE}`;
    }
    
    // Cleanup function to restore original title on unmount
    return () => {
        document.title = originalTitle;
    };
  }, [timeLeft, outcome]);


  useEffect(() => {
    // Request permission as soon as the component mounts
    requestNotificationPermission();

    if (outcome) return;

    // Set the end time when the challenge starts
    if (endTimeRef.current === null) {
      endTimeRef.current = Date.now() + challengeTime * 1000;
    }

    const timer = setInterval(() => {
      if (endTimeRef.current) {
        const remaining = endTimeRef.current - Date.now();
        if (remaining <= 0) {
          setTimeLeft(0);
          setOutcome('lost');
        } else {
          setTimeLeft(remaining / 1000);
        }
      }
    }, 50); // Update UI more frequently for a smoother progress bar

    return () => clearInterval(timer);
  }, [outcome, challengeTime]);

  useEffect(() => {
    if (gameEndedRef.current) return;

    if (outcome === 'lost') {
      gameEndedRef.current = true;
      document.title = `Defeat | ${ORIGINAL_TITLE}`;
      onGameEnd({ winner: { id: 'dark-self', name: 'Dark Self' }, scores: [] });
      showNotification('Dark Self Challenge', 'You ran out of time. The Dark Self has won.');
      generateDarkSelfMessage({ playerName: player.name, timeLimit: challengeTime })
        .then(response => {
          setMotivationalMessage(response.message);
          setShowDefeatDialog(true);
        }).catch(err => {
            console.error("AI message generation failed:", err);
            setMotivationalMessage("Every setback is a setup for a comeback. Analyze, adapt, and act.");
            setShowDefeatDialog(true);
        });
    } else if (outcome === 'won') {
        gameEndedRef.current = true;
        document.title = `Victory! | ${ORIGINAL_TITLE}`;
        onGameEnd({ winner: player, scores: [] });
    }
  }, [outcome, onGameEnd, player, challengeTime]);
  
  const handleTaskToggle = (taskId: string) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    );
  };
  
  const allTasksCompleted = tasks.length > 0 && tasks.every(t => t.completed);

  const handleWin = () => {
    if (outcome || !allTasksCompleted) return;
    setOutcome('won');
  };
  
  const progress = (timeLeft / challengeTime) * 100;

  return (
    <>
      <Card className="max-w-md mx-auto animate-in fade-in-0 zoom-in-95">
        <CardHeader className="text-center">
          <CardTitle className="font-headline text-3xl">Dark Self Challenge</CardTitle>
          <CardDescription className="flex items-center justify-center gap-2"><User /> {player.name}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6">
          {!outcome && (
            <>
               <div className="w-full space-y-2 text-center">
                 <p className="text-lg font-medium">Complete your tasks before time runs out!</p>
                 <Progress value={progress} className="w-full h-4" />
                 <p className="font-mono text-2xl font-bold">{Math.max(0, timeLeft).toFixed(2)}s</p>
               </div>
               
               {tasks.length > 0 && (
                <div className="w-full space-y-3 rounded-lg border p-4">
                  {tasks.map(task => (
                    <div key={task.id} className="flex items-center gap-3">
                      <Checkbox
                        id={task.id}
                        checked={task.completed}
                        onCheckedChange={() => handleTaskToggle(task.id)}
                      />
                      <Label
                        htmlFor={task.id}
                        className={`flex-1 text-sm ${task.completed ? 'text-muted-foreground line-through' : 'text-foreground'}`}
                      >
                        {task.description}
                      </Label>
                    </div>
                  ))}
                </div>
               )}

               <Button onClick={handleWin} disabled={!allTasksCompleted} className="w-full h-20 text-2xl font-bold font-headline transform transition-transform hover:scale-105">
                 <Shield className="mr-4 h-8 w-8" /> I DID IT
               </Button>
            </>
          )}

          {outcome === 'won' && (
            <div className="text-center p-8 bg-accent/20 rounded-lg w-full animate-in fade-in-0 zoom-in-95">
              <h2 className="text-4xl font-bold text-accent-foreground font-headline">You Won!</h2>
              <p className="mt-2 text-muted-foreground">Consistency is key. Keep it up!</p>
            </div>
          )}

          {outcome === 'lost' && (
            <div className="text-center p-8 bg-destructive/20 rounded-lg w-full animate-in fade-in-0 zoom-in-95">
              <h2 className="text-4xl font-bold text-destructive-foreground font-headline">Dark Self Won</h2>
              <p className="mt-2 text-muted-foreground">The shadows of procrastination took this round.</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="pt-6">
          <Button onClick={onNewGame} variant="outline" className="w-full">
            <XCircle className="mr-2" /> New Game
          </Button>
        </CardFooter>
      </Card>
      
      <AlertDialog open={showDefeatDialog} onOpenChange={setShowDefeatDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 font-headline"><Moon /> A word from the shadows...</AlertDialogTitle>
            <AlertDialogDescription className="text-lg py-4">
              {motivationalMessage || "Loading..."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>I understand.</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
