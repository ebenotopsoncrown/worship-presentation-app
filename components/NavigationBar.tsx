'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

type NavLink = { href: string; label: string };

const LINKS: NavLink[] = [
  { href: '/', label: 'Home' },
  { href: '/live', label: 'Live' },
  { href: '/tools/hymn-text-import', label: 'Hymn Import' },
  { href: '/tools/slide-import', label: 'Slides' },
];

export default function NavigationBar() {
  const { asPath } = useRouter(); // pages/ router-safe
  return (
    <nav className="flex flex-wrap items-center gap-2">
      {LINKS.map(({ href, label }) => {
        const active =
          asPath === href || (href !== '/' && asPath.startsWith(href));
        const cls = [
          'px-3 py-1.5 rounded-md text-sm transition-colors',
          active ? 'bg-white/15 text-white' : 'text-zinc-200 hover:bg-white/10 hover:text-white',
        ].join(' ');
        return (
          <Link href={href} className={cls} key={href}>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
