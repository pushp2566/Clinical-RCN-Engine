'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function NavigationLinks() {
  const pathname = usePathname();

  return (
    <div className="hidden md:flex items-center gap-2 ml-8">
      <Link 
        href="/" 
        className={`text-base px-4 py-2 rounded-lg transition-all ${
          pathname === '/' 
            ? 'font-bold text-white bg-blue-500/10 border border-blue-500/20' 
            : 'font-medium text-zinc-400 hover:text-zinc-200 hover:bg-white/5 border border-transparent'
        }`}
      >
        Dashboard
      </Link>
      <Link 
        href="/database" 
        className={`text-base px-4 py-2 rounded-lg transition-all ${
          pathname === '/database' 
            ? 'font-bold text-white bg-blue-500/10 border border-blue-500/20' 
            : 'font-medium text-zinc-400 hover:text-zinc-200 hover:bg-white/5 border border-transparent'
        }`}
      >
        Patient Records & DB
      </Link>
    </div>
  );
}
