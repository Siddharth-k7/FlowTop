'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import type { Doc } from '@/types/cms';

/**
 * Load / edit / save one document. Rules from admin/AGENTS.md live here so every form gets them:
 * - "Saved" is only shown after the API said so; on failure the user's input stays and the real error shows.
 * - Draft is kept in localStorage every 30s and offered back after a refresh.
 * - Leaving with unsaved changes asks first.
 */
export function useDocument<T extends Doc>(col: string, id: string, blank: () => Omit<T, 'id'>) {
  const router = useRouter();
  const isNew = id === 'new';
  const key = `ft:draft:${col}:${id}`;
  const [value, setValue] = useState<T>();
  const base = useRef('');
  const [loadError, setLoadError] = useState<string>();
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date>();
  const [error, setError] = useState<string>();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [draft, setDraft] = useState<T>();
  const blankRef = useRef(blank); blankRef.current = blank;

  const load = useCallback(() => {
    setLoadError(undefined);
    const done = (d: T) => {
      base.current = JSON.stringify(d); setValue(d);
      try { const s = localStorage.getItem(key); if (s && s !== base.current) setDraft(JSON.parse(s) as T); } catch { /* storage blocked: no draft */ }
    };
    if (isNew) done({ id: 'new', ...blankRef.current() } as T);
    else api<T>(`/admin/${col}/${id}`).then(done).catch((e) => setLoadError(e instanceof ApiError ? e.message : 'Could not load this.'));
  }, [col, id, isNew, key]);
  useEffect(load, [load]);

  const dirty = !!value && JSON.stringify(value) !== base.current;
  const latest = useRef(value); latest.current = value;
  useEffect(() => {
    if (!dirty) return;
    const t = setInterval(() => { try { localStorage.setItem(key, JSON.stringify(latest.current)); } catch { /* ignore */ } }, 30_000);
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    const click = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest('a[href]');
      if (a && !a.getAttribute('href')?.startsWith('#') && !window.confirm('You have unsaved changes. Leave without saving?')) { e.preventDefault(); e.stopPropagation(); }
    };
    window.addEventListener('beforeunload', warn);
    document.addEventListener('click', click, true);
    return () => { clearInterval(t); window.removeEventListener('beforeunload', warn); document.removeEventListener('click', click, true); };
  }, [dirty, key]);

  const set = useCallback((patch: Partial<T>) => { setValue((v) => (v ? { ...v, ...patch } : v)); setSavedAt(undefined); }, []);

  /** Returns the saved doc, or undefined when the save failed (error + field errors are set). */
  const save = useCallback(async (patch?: Partial<T>): Promise<T | undefined> => {
    if (!value) return;
    const next = patch ? { ...value, ...patch } : value;
    setSaving(true); setError(undefined); setErrors({});
    try {
      const { id: _drop, ...body } = next;
      const saved = await api<T>(isNew ? `/admin/${col}` : `/admin/${col}/${id}`, { method: isNew ? 'POST' : 'PATCH', body });
      base.current = JSON.stringify(saved); setValue(saved); setSavedAt(new Date());
      try { localStorage.removeItem(key); } catch { /* ignore */ }
      if (isNew) router.replace(`/${col}/${saved.id}`);
      return saved;
    } catch (e) {
      const err = e instanceof ApiError ? e : undefined;
      setError(err ? err.message : 'Could not save. Your work is still here.');
      setErrors(err?.fields ?? {});
    } finally { setSaving(false); }
  }, [value, isNew, col, id, key, router]);

  const useDraft = () => { if (draft) { setValue(draft); setDraft(undefined); } };
  const dropDraft = () => { try { localStorage.removeItem(key); } catch { /* ignore */ } setDraft(undefined); };
  return { value, set, dirty, saving, savedAt, error, errors, setError, setErrors, save, loadError, reload: load, isNew, draft, useDraft, dropDraft };
}
