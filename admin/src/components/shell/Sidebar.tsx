'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { NAV, canSee } from './nav';

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const user = useCurrentUser();
  // COSMETIC ONLY: hiding menu items is presentation, not security.
  // The server re-checks permissions on every API call; never rely on this filter as a guard.
  const items = NAV.filter((i) => canSee(user.permissions, i.permission));
  return (
    <nav aria-label="Main" className="flex flex-col gap-1 p-2">
      {items.map((i) => {
        const active = pathname.startsWith(i.href);
        return (
          <Link key={i.href} href={i.href} onClick={onNavigate} aria-current={active ? 'page' : undefined} title={i.label}
            className={`flex min-h-touch items-center gap-3 rounded px-3 text-sm md:justify-center lg:justify-start ${active ? 'bg-purple-deep text-white' : 'text-ink hover:bg-purple-pale'}`}>
            <span aria-hidden className="w-6 text-center text-lg">{i.icon}</span>
            <span className="md:sr-only lg:not-sr-only">{i.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
