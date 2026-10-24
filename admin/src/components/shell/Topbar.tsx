'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { logout } from '@/lib/auth';
import { inputCls } from '@/lib/ui-classes';

function Breadcrumbs() {
  const parts = usePathname().split('/').filter(Boolean);
  return (
    <ol className="flex min-w-0 items-center gap-1 text-sm text-grey-700">
      <li><Link href="/dashboard" className="underline">Home</Link></li>
      {parts.map((p, i) => (
        <li key={p} className="flex min-w-0 items-center gap-1 truncate">
          <span aria-hidden>/</span>
          <Link href={`/${parts.slice(0, i + 1).join('/')}`} className="truncate capitalize">{p.replace(/-/g, ' ')}</Link>
        </li>
      ))}
    </ol>
  );
}

function UserMenu() {
  const user = useCurrentUser();
  const [open, setOpen] = useState(false);
  async function onLogout() {
    await logout().catch(() => undefined);
    window.location.assign('/login');
  }
  return (
    <div className="relative">
      <button aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(!open)}
        className="flex min-h-touch items-center gap-2 rounded px-2 text-sm hover:bg-purple-pale">
        <span aria-hidden className="flex h-8 w-8 items-center justify-center rounded bg-purple-deep text-white">{user.name[0]}</span>
        <span className="hidden md:inline">{user.name}</span>
      </button>
      {open && (
        <div role="menu" className="absolute right-0 z-20 mt-1 w-56 rounded-lg bg-white p-2 shadow-card">
          <p className="px-2 py-1 text-xs text-grey-500">{user.email}</p>
          <button role="menuitem" onClick={onLogout} className="min-h-touch w-full rounded px-2 text-left text-sm hover:bg-purple-pale">Log out</button>
        </div>
      )}
    </div>
  );
}

export function Topbar({ onMenu }: { onMenu: () => void }) {
  return (
    <header className="flex items-center gap-3 border-b border-grey-200 bg-white px-4 py-2">
      <button className="min-h-touch min-w-touch rounded text-xl hover:bg-purple-pale md:hidden" aria-label="Open menu" onClick={onMenu}>☰</button>
      <div className="min-w-0 flex-1"><nav aria-label="Breadcrumb"><Breadcrumbs /></nav></div>
      <div className="hidden w-64 sm:block">
        {/* TODO: global search wired in Phase 4 */}
        <input type="search" disabled aria-label="Search (coming soon)" placeholder="Search…" className={inputCls} />
      </div>
      <UserMenu />
    </header>
  );
}
