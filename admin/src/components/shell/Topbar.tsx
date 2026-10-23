'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Input } from '@flowtop/ui';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { logout } from '@/lib/auth';
import { crumbs } from '@/lib/breadcrumbs';
import { nextMenuIndex } from '@/lib/menu-keys';

function Breadcrumbs() {
  const list = crumbs(usePathname());
  return (
    <ol className="flex min-w-0 items-center gap-1 text-sm text-grey-700">
      {list.map((c, i) => (
        <li key={c.href} className="flex min-w-0 items-center gap-1 truncate">
          {i > 0 && <span aria-hidden>/</span>}
          <Link href={c.href} aria-current={i === list.length - 1 ? 'page' : undefined}
            className={i === 0 ? 'underline' : 'truncate capitalize'}>{c.label}</Link>
        </li>
      ))}
    </ol>
  );
}

function UserMenu() {
  const user = useCurrentUser();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const items = () => Array.from(root.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);

  useEffect(() => {
    if (!open) return;
    items()[0]?.focus();
    // Close on a click or tap anywhere outside the menu and its button.
    const onDown = (e: PointerEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [open]);

  function onMenuKey(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Escape' || e.key === 'Tab') {
      if (e.key === 'Escape') { e.preventDefault(); button.current?.focus(); }
      setOpen(false);
      return;
    }
    const list = items();
    const next = nextMenuIndex(list.indexOf(document.activeElement as HTMLElement), e.key, list.length);
    if (next !== null) { e.preventDefault(); list[next]?.focus(); }
  }

  async function onLogout() {
    await logout().catch(() => undefined);
    window.location.assign('/login');
  }
  return (
    <div className="relative" ref={root}>
      <button ref={button} aria-haspopup="menu" aria-expanded={open} aria-controls="user-menu" onClick={() => setOpen(!open)}
        onKeyDown={(e) => { if (e.key === 'ArrowDown' && !open) { e.preventDefault(); setOpen(true); } }}
        className="flex min-h-touch items-center gap-2 rounded px-2 text-sm hover:bg-purple-pale">
        <span aria-hidden className="flex h-8 w-8 items-center justify-center rounded bg-purple-deep text-white">{user.name[0]}</span>
        <span className="hidden md:inline">{user.name}</span>
      </button>
      {open && (
        <div id="user-menu" role="menu" aria-label="Account" onKeyDown={onMenuKey} className="absolute right-0 z-20 mt-1 w-56 rounded-card bg-white p-2 shadow-card">
          <p className="px-2 py-1 text-xs text-grey-500">{user.email}</p>
          <button role="menuitem" tabIndex={-1} onClick={onLogout} className="min-h-touch w-full rounded px-2 text-left text-sm hover:bg-purple-pale focus:bg-purple-pale">Log out</button>
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
      <div className="hidden w-64 xs:block">
        {/* TODO: global search wired in Phase 4 */}
        <Input type="search" disabled aria-label="Search (coming soon)" placeholder="Search…" />
      </div>
      <UserMenu />
    </header>
  );
}
