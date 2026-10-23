'use client';
import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button, Input } from '@flowtop/ui';
import { ApiError } from '@/lib/api';
import { confirmPasswordReset } from '@/lib/auth';
import { AuthCard } from './AuthCard';

export function ResetPasswordForm() {
  const token = useSearchParams().get('token') ?? '';
  const [done, setDone] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const password = String(new FormData(e.currentTarget).get('password') ?? '');
    setBusy(true); setError(null);
    try { await confirmPasswordReset(token, password); setDone(true); }
    catch (err) { setError(err instanceof ApiError ? err : null); }
    finally { setBusy(false); }
  }

  return (
    <AuthCard title="Choose a new password">
      {done ? (
        <p role="status" className="text-sm">Your password has been changed. <Link href="/login" className="text-purple-deep underline">Log in</Link></p>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          <Input id="password" label="New password" hint="At least 12 characters" name="password" type="password" autoComplete="new-password" required
            error={error ? error.fields.password ?? error.message : undefined} />
          <Button type="submit" loading={busy}>Change password</Button>
        </form>
      )}
    </AuthCard>
  );
}
