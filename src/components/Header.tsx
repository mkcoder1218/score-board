import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Gamepad2 } from 'lucide-react';

export function Header() {
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
          </ul>
        </nav>
      </div>
    </header>
  );
}
