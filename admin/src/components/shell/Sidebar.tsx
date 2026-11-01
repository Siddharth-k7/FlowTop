'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { NAV } from './nav';

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const user = useCurrentUser();
  // COSMETIC ONLY: hiding menu items is presentation, not security.
  // The server re-checks permissions on every API call; never rely on this filter as a guard.
  const items = NAV.filter((i) => !i.permission || user.permissions.includes(i.permission));
  return (
    <nav aria-label="Main" className="flex flex-col gap-1 p-2">
      {items.map((i, n) => {
        const active = pathname.startsWith(i.href);
        return (
          <div key={i.href} className="contents">
            {i.group && i.group !== items[n - 1]?.group && <p className="mt-3 px-3 text-xs font-semibold uppercase tracking-wide text-grey-500 md:sr-only lg:not-sr-only">{i.group}</p>}
          <Link href={i.href} onClick={onNavigate} aria-current={active ? 'page' : undefined} title={i.label}
            className={`flex min-h-touch items-center gap-3 rounded px-3 text-sm md:justify-center lg:justify-start ${active ? 'bg-purple-deep text-white' : 'text-ink hover:bg-purple-pale'}`}>
            <span aria-hidden className="w-6 text-center text-lg">{i.icon}</span>
            <span className="md:sr-only lg:not-sr-only">{i.label}</span>
          </Link>
          </div>
        );
      })}
    </nav>
  );
}
