'use client';

import { ReactNode } from 'react';
import { app, auth, db } from './index';
import { FirebaseProvider } from './provider';
import { AuthProvider } from './auth/use-user';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  return (
    <FirebaseProvider value={{ app, auth, db }}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </FirebaseProvider>
  );
}
