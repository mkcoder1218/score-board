import { collection, addDoc, getDocs, query, where, orderBy, writeBatch, Timestamp, Firestore } from 'firebase/firestore';
import type { Player, GameResult } from '@/lib/types';

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

    