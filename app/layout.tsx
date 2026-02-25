import type { Metadata } from 'next';
import { Montserrat, Inter } from 'next/font/google';
import './globals.css';

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
  weight: ['400', '500', '600', '700'],
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Work Reimagined In The Age of AI',
  description: 'AI Executive Coach for Speaking Training',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${montserrat.variable} ${inter.variable}`}>
      <body suppressHydrationWarning className="font-sans bg-[#F8F9FA] text-[#1A1A1A]">
        {children}
      </body>
    </html>
  );
}
