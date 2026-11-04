import type { Metadata } from 'next';
import { Host_Grotesk } from 'next/font/google';
import './globals.css';

// Pakar Talenta brand font — Host Grotesk (as used on pakartalenta.co.id)
const hostGrotesk = Host_Grotesk({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-host-grotesk',
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
    <html lang="en">
      <body className={`${hostGrotesk.variable} antialiased bg-white text-slate-900 min-h-screen`}>
        {children}
      </body>
    </html>
  );
}
