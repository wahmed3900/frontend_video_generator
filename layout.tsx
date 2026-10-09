import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Link from 'next/link';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AI Video Studio',
  description: 'Generate AI-powered short-form videos in minutes.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-white text-gray-900 min-h-screen`}>
        <nav className="border-b px-6 py-4 flex items-center justify-between">
          <Link href="/" className="font-bold text-lg tracking-tight">
            🎬 AI Video Studio
          </Link>
          <div className="flex gap-6 text-sm font-medium">
            <Link href="/dashboard" className="hover:text-black text-gray-600 transition-colors">
              Generate
            </Link>
            <Link href="/history" className="hover:text-black text-gray-600 transition-colors">
              My Videos
            </Link>
            <Link href="/pricing" className="hover:text-black text-gray-600 transition-colors">
              Pricing
            </Link>
          </div>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  );
}
