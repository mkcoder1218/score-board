import { GameHistoryClient } from '@/components/GameHistoryClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Game History | Consistent Clicker',
    description: 'View your past game results.',
};

export default function HistoryPage() {
  return (
    <div className="animate-in fade-in-0">
      <h1 className="text-4xl font-bold mb-8 font-headline">Game History</h1>
      <GameHistoryClient />
    </div>
  );
}
