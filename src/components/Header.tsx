"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Gamepad2, LogOut, User } from 'lucide-react';
import { useAuth } from '@/firebase';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';


export function Header() {
  const { user, signOut, loading } = useAuth();

  return (
    <header className="py-4 px-4 sm:px-6 lg:px-8 border-b sticky top-0 bg-background/80 backdrop-blur-sm z-10">
      <div className="container mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Gamepad2 className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold font-headline">Consistent Clicker</h1>
        </Link>
        <nav>
          <ul className="flex items-center gap-4">
            <li>
              <Button asChild variant="ghost">
                <Link href="/">Game</Link>
              </Button>
            </li>
            <li>
              <Button asChild variant="ghost">
                <Link href="/history">History</Link>
              </Button>
            </li>
            <li className="flex items-center gap-4">
                {!loading && user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.photoURL || undefined} alt={user.displayName || "User"} />
                          <AvatarFallback>
                            {user.displayName ? user.displayName.charAt(0) : <User />}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none">{user.displayName}</p>
                          <p className="text-xs leading-none text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => signOut()}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button asChild>
                    <Link href="/login">Login</Link>
                  </Button>
                )}
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
