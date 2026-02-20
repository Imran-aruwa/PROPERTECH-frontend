import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Property Listing | PROPERTECH',
  description: 'Find your next home with PROPERTECH',
};

export default function ListingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
}
