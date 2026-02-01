import './globals.css';
import { Nunito, Fira_Code } from 'next/font/google';

export const metadata = {
  title: 'VoiceTask',
  description: 'Voice-driven tasks and events manager.'
};

const nunito = Nunito({
  subsets: ['latin', 'latin-ext'],
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-sans'
});

const firaCode = Fira_Code({
  subsets: ['latin'],
  weight: ['400', '500'],
  display: 'swap',
  variable: '--font-mono'
});

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${nunito.variable} ${firaCode.variable}`}>
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        />
      </head>
      <body className="text-slate-900 transition-colors duration-300 overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
