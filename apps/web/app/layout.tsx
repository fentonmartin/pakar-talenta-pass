import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Pakar Talenta Pass',
    template: `%s | Pakar Talenta Pass`,
  },
  description: 'Exclusive digital access pass for vetted professionals.',
  icons: {
    icon: '/favicon.ico',
  },
  openGraph: {
    type: 'website',
    locale: 'en-US',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased bg-surface-50 text-surface-100 min-h-screen">
        {children}
      </body>
    </html>
  );
}
