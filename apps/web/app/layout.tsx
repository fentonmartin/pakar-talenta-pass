import type { Metadata } from 'next';
import './globals.css';

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
    <html lang="en">
      <body className="antialiased bg-surface-50 text-surface-100 min-h-screen">
        {children}
      </body>
    </html>
  );
}
