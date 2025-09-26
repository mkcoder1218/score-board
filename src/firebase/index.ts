'use client';
import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { firebaseConfig } from './config';

// App
let firebaseApp: FirebaseApp;
if (!getApps().length) {
  firebaseApp = initializeApp(firebaseConfig);
} else {
  firebaseApp = getApp();
}

const db = getFirestore(firebaseApp);
const auth = getAuth(firebaseApp);

export const app = firebaseApp;
export { db, auth };

export { FirebaseClientProvider } from './client-provider';
export { useAuth } from './auth/use-user';
export { useCollection } from './firestore/use-collection';
export { useDoc } from './firestore/use-doc';
export { useFirebaseApp, useFirestore, useAuth as useFirebaseAuth } from './provider';
