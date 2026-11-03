'use client';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Button } from '@flowtop/ui';
import type { User } from '@flowtop/types';
import { currentUser } from '@/lib/auth';
import { ApiError, FORBIDDEN_EVENT } from '@/lib/api';
import { createDismissTimer } from '@/lib/dismiss-timer';
import { UserContext } from '@/hooks/useCurrentUser';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

const TOAST_MS = 6000;

export function Shell({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [failed, setFailed] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [toast, setToast] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeDrawer = useCallback(() => setDrawer(false), []);
  const toastTimer = useMemo(() => createDismissTimer(setToast, TOAST_MS), []);

  useEffect(() => {
    currentUser().then(setUser).catch((e) => { // 401 and MFA_SETUP_REQUIRED already redirect from lib/api.ts.
      if (!(e instanceof ApiError && (e.status === 401 || e.code === 'MFA_SETUP_REQUIRED'))) setFailed(true); });
  }, []);
  useEffect(() => {
    const on = () => toastTimer.show();
    window.addEventListener(FORBIDDEN_EVENT, on);
    return () => { window.removeEventListener(FORBIDDEN_EVENT, on); toastTimer.dispose(); };
  }, [toastTimer]);
  // The drawer is aria-modal: keep Tab inside it, close on Escape, give focus back to the menu button.
  useFocusTrap(drawerRef, drawer, closeDrawer);

  if (failed) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-4 text-center">
        <p>We could not load your session. Check your connection and try again.</p>
        <Button variant="secondary" onClick={() => window.location.reload()}>Retry</Button>
      </main>
    );
  }
  if (!user) return <div className="min-h-screen p-4" aria-busy="true"><div className="h-12 w-full animate-pulse rounded bg-grey-200" /></div>;

  return (
    <UserContext.Provider value={user}>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-white focus:p-3">Skip to content</a>
      <div className="flex min-h-screen">
        <aside className="hidden shrink-0 border-r border-grey-200 bg-white md:block md:w-rail lg:w-sidebar">
          {/* Padding sits on the wrapper: lg:not-sr-only resets padding on the element itself. */}
          <div className="p-4 md:p-0 lg:p-4"><p className="text-sm font-semibold uppercase tracking-widest text-purple-deep md:sr-only lg:not-sr-only">Flowtop</p></div>
          <Sidebar />
        </aside>
        {drawer && (
          <div className="fixed inset-0 z-40 md:hidden" role="dialog" aria-modal="true" aria-label="Menu">
            <div className="absolute inset-0 bg-ink/50" onClick={closeDrawer} />
            <div ref={drawerRef} className="relative h-full w-sidebar max-w-full overflow-y-auto bg-white">
              <button className="m-2 min-h-touch min-w-touch rounded text-xl" aria-label="Close menu" onClick={closeDrawer}>✕</button>
              <Sidebar onNavigate={closeDrawer} />
            </div>
          </div>
        )}
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar onMenu={() => setDrawer(true)} />
          <main id="main" className="flex-1 p-4 md:p-6">{children}</main>
        </div>
      </div>
      {/* Mounted up front, so screen readers already watch it when the first 403 arrives. */}
      <div role="status" aria-live="polite" className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:w-96">
        {toast && <p className="rounded-card bg-ink p-4 text-sm text-white">You do not have permission to do that. Ask a Super Admin if you think you should.</p>}
      </div>
    </UserContext.Provider>
  );
}
