import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Inspect | Propertech',
  description: 'Offline-first property inspection tool',
};

export default function InspectLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 max-w-lg mx-auto">
      {children}
    </div>
  );
}
