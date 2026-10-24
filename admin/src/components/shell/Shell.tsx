'use client';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { currentUser } from '@/lib/auth';
import { ApiError, FORBIDDEN_EVENT } from '@/lib/api';
import { UserContext } from '@/hooks/useCurrentUser';
import { btnSecondary } from '@/lib/ui-classes';
import type { User } from '@/types';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export function Shell({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [failed, setFailed] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [toast, setToast] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    currentUser().then(setUser).catch((e) => { // 401 and MFA_SETUP_REQUIRED already redirect from lib/api.ts.
      if (!(e instanceof ApiError && (e.status === 401 || e.code === 'MFA_SETUP_REQUIRED'))) setFailed(true); });
  }, []);
  useEffect(() => {
    const on = () => { setToast(true); setTimeout(() => setToast(false), 6000); };
    window.addEventListener(FORBIDDEN_EVENT, on);
    return () => window.removeEventListener(FORBIDDEN_EVENT, on);
  }, []);
  useEffect(() => {
    if (!drawer) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setDrawer(false);
    document.addEventListener('keydown', onKey);
    drawerRef.current?.querySelector('a')?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [drawer]);

  if (failed) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-4 text-center">
        <p>We could not load your session. Check your connection and try again.</p>
        <button className={btnSecondary} onClick={() => window.location.reload()}>Retry</button>
      </main>
    );
  }
  if (!user) return <div className="min-h-screen p-4" aria-busy="true"><div className="h-12 w-full animate-pulse rounded bg-grey-200" /></div>;

  return (
    <UserContext.Provider value={user}>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-white focus:p-3">Skip to content</a>
      <div className="flex min-h-screen">
        <aside className="hidden shrink-0 border-r border-grey-200 bg-white md:block md:w-rail lg:w-sidebar">
          <p className="p-4 text-sm font-semibold uppercase tracking-widest text-purple-deep md:sr-only lg:not-sr-only">Flowtop</p>
          <Sidebar />
        </aside>
        {drawer && (
          <div className="fixed inset-0 z-40 md:hidden" role="dialog" aria-modal="true" aria-label="Menu">
            <div className="absolute inset-0 bg-ink/50" onClick={() => setDrawer(false)} />
            <div ref={drawerRef} className="relative h-full w-sidebar max-w-full overflow-y-auto bg-white">
              <button className="m-2 min-h-touch min-w-touch rounded text-xl" aria-label="Close menu" onClick={() => setDrawer(false)}>✕</button>
              <Sidebar onNavigate={() => setDrawer(false)} />
            </div>
          </div>
        )}
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar onMenu={() => setDrawer(true)} />
          <main id="main" className="flex-1 p-4 md:p-6">{children}</main>
        </div>
      </div>
      {toast && <div role="alert" className="fixed bottom-4 left-4 right-4 z-50 rounded-lg bg-ink p-4 text-sm text-white md:left-auto md:w-96">You do not have permission to do that. Ask a Super Admin if you think you should.</div>}
    </UserContext.Provider>
  );
}
