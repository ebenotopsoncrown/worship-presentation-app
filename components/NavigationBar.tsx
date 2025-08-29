// components/NavigationBar.tsx
'use client';
import Link from 'next/link';

export default function NavigationBar() {
  return (
    <nav className="flex items-center gap-3 text-sm">
      <Link href="/" className="px-3 py-1.5 rounded bg-white/10 hover:bg-white/20">
        Operator
      </Link>
      <Link href="/live" className="px-3 py-1.5 rounded bg-white/10 hover:bg-white/20">
        Live
      </Link>
    </nav>
  );
}
