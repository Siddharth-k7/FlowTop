'use client';
import { useState, type FormEvent } from 'react';
import { ApiError } from '@/lib/api';
import { confirmMfaSetup, startMfaSetup } from '@/lib/auth';
import { btnPrimary, inputCls } from '@/lib/ui-classes';
import { FormField } from '@/components/FormField';
import { AuthCard } from './AuthCard';

/** Super admins must enrol before the API lets them do anything else. */
export function MfaSetupFlow() {
  const [secret, setSecret] = useState<{ secret: string; otpauthUri: string } | null>(null);
  const [codes, setCodes] = useState<string[] | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [busy, setBusy] = useState(false);

  async function run(e: FormEvent<HTMLFormElement>, name: string, fn: (v: string) => Promise<void>) {
    e.preventDefault();
    const value = String(new FormData(e.currentTarget).get(name) ?? '').trim();
    setBusy(true); setError(null);
    try { await fn(value); } catch (err) { setError(err instanceof ApiError ? err : null); } finally { setBusy(false); }
  }
  const fieldError = (name: string) => (error ? error.fields[name] ?? error.message : undefined);

  if (codes) {
    return (
      <AuthCard title="Save your recovery codes" subtitle="Each code works once if you lose your phone. They will not be shown again.">
        <ul className="grid grid-cols-2 gap-2 rounded bg-purple-pale p-3 font-mono text-sm">
          {codes.map((c) => <li key={c}>{c}</li>)}
        </ul>
        <button className={`${btnPrimary} mt-4 w-full`} onClick={() => window.location.assign('/dashboard')}>I have saved them, continue</button>
      </AuthCard>
    );
  }

  if (secret) {
    return (
      <AuthCard title="Add Flowtop to your authenticator app" subtitle="In the app, choose “enter a setup key” and type this key, then enter the 6-digit code it shows.">
        {/* ponytail: setup key only, no QR image. Add a QR when a dependency is approved. */}
        <p className="break-all rounded bg-purple-pale p-3 text-center font-mono text-lg tracking-wider" aria-label="Setup key">{secret.secret}</p>
        <a href={secret.otpauthUri} className="mt-2 flex min-h-touch items-center justify-center text-sm text-purple-deep underline">Open in authenticator app on this device</a>
        <form onSubmit={(e) => run(e, 'code', async (code) => setCodes((await confirmMfaSetup(code)).recoveryCodes))} className="mt-4 flex flex-col gap-4" noValidate>
          <FormField id="code" label="6-digit code" error={fieldError('code')}>
            {(p) => <input {...p} name="code" className={inputCls} autoComplete="one-time-code" inputMode="numeric" maxLength={6} autoFocus />}
          </FormField>
          <button className={btnPrimary} disabled={busy}>{busy ? 'Checking…' : 'Turn on two-step sign-in'}</button>
        </form>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Set up two-step sign-in" subtitle="Super admin accounts need a code from an authenticator app as well as a password.">
      <form onSubmit={(e) => run(e, 'password', async (pw) => setSecret(await startMfaSetup(pw)))} className="flex flex-col gap-4" noValidate>
        <FormField id="password" label="Confirm your password" error={fieldError('password')}>
          {(p) => <input {...p} name="password" type="password" className={inputCls} autoComplete="current-password" autoFocus />}
        </FormField>
        <button className={btnPrimary} disabled={busy}>{busy ? 'Checking…' : 'Continue'}</button>
      </form>
    </AuthCard>
  );
}
