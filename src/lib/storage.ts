import { collection, addDoc, getDocs, query, where, orderBy, writeBatch, Timestamp, Firestore } from 'firebase/firestore';
import type { Player, GameResult } from '@/lib/types';

// NOTE: These localStorage functions are being replaced by Firestore.
// They are kept here for reference during the migration but will be removed.

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

// New Firestore functions

export const addGameToHistory = async (db: Firestore, userId: string, result: Omit<GameResult, 'id' | 'userId' | 'date'>) => {
  if (!userId) throw new Error('User not authenticated');
  
  const historyCollection = collection(db, 'users', userId, 'history');
  
  const gameResult: Omit<GameResult, 'id'> = {
    ...result,
    date: new Date().toISOString(),
    userId: userId,
  };

  await addDoc(historyCollection, gameResult);
};


export const getHistory = async (db: Firestore, userId: string): Promise<GameResult[]> => {
    if (!userId) return [];
    const historyCollection = collection(db, 'users', userId, 'history');
    const q = query(historyCollection, orderBy('date', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GameResult));
};

export const clearHistory = async (db: Firestore, userId: string) => {
  if (!userId) throw new Error('User not authenticated');
  const historyCollection = collection(db, 'users', userId, 'history');
  const querySnapshot = await getDocs(historyCollection);
  
  const batch = writeBatch(db);
  querySnapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
  });
  
  await batch.commit();
};
