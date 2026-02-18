import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Providers from './providers';
import { cn } from '@/lib/utils'; // Ensure this path is correct based on your aliases

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Hind Social Network',
  description: 'A modern social networking platform.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={cn(inter.className, 'bg-gray-50 min-h-screen')}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
