'use client';
import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ApiError } from '@/lib/api';
import { login, verifyMfa } from '@/lib/auth';
import { btnPrimary, inputCls } from '@/lib/ui-classes';
import { FormField } from '@/components/FormField';
import { AuthCard } from './AuthCard';

export function LoginFlow() {
  const next = useSearchParams().get('next') ?? '/dashboard';
  const [email, setEmail] = useState('');
  const [mfaToken, setMfaToken] = useState<string | null>(null);
  const [useRecovery, setUseRecovery] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [busy, setBusy] = useState(false);

  // Full navigation so the shell reloads the new session.
  const done = () => window.location.assign(next.startsWith('/') ? next : '/dashboard');

  async function onLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const password = String(new FormData(e.currentTarget).get('password') ?? '');
    setBusy(true); setError(null);
    try {
      const r = await login(email, password);
      if (r.requiresMfa) setMfaToken(r.mfaToken); else done();
    } catch (err) {
      setError(err instanceof ApiError ? err : null);
    } finally { setBusy(false); }
  }

  async function onMfa(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!mfaToken) return;
    const code = String(new FormData(e.currentTarget).get('code') ?? '').trim();
    setBusy(true); setError(null);
    try { await verifyMfa(mfaToken, useRecovery ? { recoveryCode: code } : { code }); done(); }
    catch (err) { setError(err instanceof ApiError ? err : null); }
    finally { setBusy(false); }
  }

  if (mfaToken) {
    return (
      <AuthCard title="Two-step check" subtitle={useRecovery ? 'Enter one of your recovery codes.' : 'Enter the 6-digit code from your authenticator app.'}>
        <form onSubmit={onMfa} className="flex flex-col gap-4" noValidate>
          <FormField id="code" label={useRecovery ? 'Recovery code' : '6-digit code'} error={error ? error.fields.code ?? error.fields.recoveryCode ?? error.message : undefined}>
            {(p) => <input {...p} name="code" className={inputCls} autoComplete="one-time-code" inputMode={useRecovery ? 'text' : 'numeric'} maxLength={useRecovery ? 40 : 6} autoFocus />}
          </FormField>
          <button className={btnPrimary} disabled={busy}>{busy ? 'Checking…' : 'Verify'}</button>
          <button type="button" className="min-h-touch text-sm text-purple-deep underline" onClick={() => { setUseRecovery(!useRecovery); setError(null); }}>
            {useRecovery ? 'Use my authenticator app' : 'Use a recovery code instead'}
          </button>
        </form>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Log in" subtitle="Flowtop admin">
      <form onSubmit={onLogin} className="flex flex-col gap-4" noValidate>
        {error && <p role="alert" className="rounded bg-purple-pale p-3 text-sm text-error">{error.message}</p>}
        <FormField id="email" label="Email" error={error?.fields.email}>
          {(p) => <input {...p} name="email" type="email" className={inputCls} autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />}
        </FormField>
        <FormField id="password" label="Password" error={error?.fields.password}>
          {(p) => <input {...p} name="password" type="password" className={inputCls} autoComplete="current-password" required />}
        </FormField>
        <button className={btnPrimary} disabled={busy}>{busy ? 'Logging in…' : 'Log in'}</button>
        <Link href="/forgot-password" className="flex min-h-touch items-center justify-center text-sm text-purple-deep underline">Forgot your password?</Link>
      </form>
    </AuthCard>
  );
}
