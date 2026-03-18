import './globals.css';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Clinical Data Normalization Engine',
  description: 'AI-Powered Clinical & Administrative Data Normalization Engine for Hackathon',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-[#09090b] text-zinc-50 flex flex-col antialiased`}>
        <nav className="w-full glass-panel rounded-none border-t-0 border-x-0 border-b border-white/10 px-6 py-4 fixed top-0 z-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center font-bold text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]">
              ⚕️
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
              Jilo Health AI
            </h1>
          </div>
          <div className="text-sm text-slate-400 font-medium">
            Demo Environment v1.0
          </div>
        </nav>
        <main className="flex-1 pt-24 px-4 pb-12 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </body>
    </html>
  );
}
