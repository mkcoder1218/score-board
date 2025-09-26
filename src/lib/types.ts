export type Player = {
  id: string;
  name: string;
};

export type GameMode = 'Score Counter' | 'First-Click Wins' | 'Dark Self Challenge';

export type DarkSelfMode = 'Task Completion' | 'Commitment Challenge';

export type GameSettings = {
  mode: GameMode;
  timeLimit?: number;
  players: Player[];
  tasks?: string[];
  // Dark Self Challenge specific settings
  darkSelfMode?: DarkSelfMode;
  commitmentTime?: number; // Time until the action must be taken
  graceTime?: number; // Extra time to press the button
};

export type GameResult = {
  id: string;
  mode: GameMode;
  players: Player[];
  winner: Player | { id: 'dark-self'; name: 'Dark Self' } | null;
  scores?: { playerId: string; score: number }[];
  date: string; // ISO string
};
