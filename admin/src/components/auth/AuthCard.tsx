import type { ReactNode } from 'react';

export function AuthCard({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-purple-pale p-4">
      <div className="w-full max-w-sm rounded-card bg-white p-6 shadow-card">
        <p className="text-sm font-semibold uppercase tracking-widest text-purple-deep">Flowtop</p>
        <h1 className="mt-2 text-xl font-semibold">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-grey-700">{subtitle}</p>}
        <div className="mt-6">{children}</div>
      </div>
    </main>
  );
}
