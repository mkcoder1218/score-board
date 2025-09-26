
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { GoogleAuthProvider, signInWithPopup, User } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useAuth, useFirebaseAuth, useFirestore } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Chrome } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';

export default function LoginPage() {
  const { user, loading } = useAuth();
  const auth = useFirebaseAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [hostname, setHostname] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setHostname(window.location.hostname);
    }
  }, []);

  useEffect(() => {
    if (!loading && user) {
      router.push('/');
    }
  }, [user, loading, router]);

  const handleSignIn = async () => {
    if (!auth || !db) return;
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Create a document for the user in Firestore if it doesn't exist
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
      }, { merge: true });

      toast({ title: "Signed in successfully!" });
      router.push('/');
    } catch (error: any) {
      console.error("Authentication error:", error);
      toast({
        variant: "destructive",
        title: "Authentication Failed",
        description: error.message,
      });
    }
  };

  if (loading || user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-headline">Welcome</CardTitle>
          <CardDescription>Sign in to track your game history.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {hostname && (
            <Alert>
              <Terminal className="h-4 w-4" />
              <AlertTitle>Action Required!</AlertTitle>
              <AlertDescription>
                To fix the sign-in error, add the following domain to your Firebase project's authorized domains:
                <br />
                <strong className="text-foreground bg-muted px-2 py-1 rounded mt-2 inline-block">{hostname}</strong>
              </AlertDescription>
            </Alert>
          )}
          <Button onClick={handleSignIn} className="w-full" >
            <Chrome className="mr-2 h-4 w-4" /> Sign in with Google
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
