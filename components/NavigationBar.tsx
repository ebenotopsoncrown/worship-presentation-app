 'use client';

type NavLink = { href: string; label: string };

const LINKS: NavLink[] = [
  { href: '/', label: 'Home' },
  { href: '/live', label: 'Live' },
  { href: '/tools/hymn-text-import', label: 'Hymn Import' },
  { href: '/tools/slide-import', label: 'Slides' },
];

export default function NavigationBar() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap items-center gap-2">
      {LINKS.map(({ href, label }) => {
        const active = pathname === href || (href !== '/' && pathname?.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            className={[
              'px-3 py-1.5 rounded-md text-sm transition-colors',
              active
                ? 'bg-white/15 text-white'
                : 'text-zinc-200 hover:bg-white/10 hover:text-white',
            ].join(' ')}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

