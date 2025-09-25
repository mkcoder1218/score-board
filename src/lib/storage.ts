import type { Player, GameResult } from '@/lib/types';

const PLAYERS_KEY = 'consistent-clicker-players';
const HISTORY_KEY = 'consistent-clicker-history';

// Helper to safely access localStorage
const safeLocalStorage = <T>(key: string, defaultValue: T): [() => T, (value: T | ((val: T) => T)) => void] => {
  const get = (): T => {
    if (typeof window === 'undefined') {
      return defaultValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(error);
      return defaultValue;
    }
  };

  const set = (value: T | ((val: T) => T)) => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      const valueToStore = value instanceof Function ? value(get()) : value;
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };

  return [get, set];
};

const [getStoredPlayers, setStoredPlayers] = safeLocalStorage<Player[]>(PLAYERS_KEY, []);
const [getStoredHistory, setStoredHistory] = safeLocalStorage<GameResult[]>(HISTORY_KEY, []);

export const getPlayers = getStoredPlayers;
export const savePlayers = setStoredPlayers;

export const getHistory = getStoredHistory;

export const addGameToHistory = (result: GameResult) => {
  const history = getStoredHistory();
  setStoredHistory([result, ...history]);
};

export const clearHistory = () => {
  setStoredHistory([]);
};
