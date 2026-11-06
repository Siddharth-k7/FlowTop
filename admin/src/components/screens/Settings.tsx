'use client';
import { useEffect, useState } from 'react';
import type { SettingItem } from '@flowtop/types';
import { api, ApiError } from '@/lib/api';
import { useCan } from '@/hooks/useCurrentUser';
import { PageWrapper } from '@/components/shell/PageWrapper';
import { EditorBar, LoadError, Skeleton } from '@/components/ui/EditorBar';
import { SchemaForm, type Field } from '@/components/ui/SchemaForm';
import { cardCls } from '@/lib/ui-classes';

/**
 * The screen is built from what GET /admin/settings returns, so the keys, their descriptions and the
 * order are the backend's (backend/src/settings/setting-definitions.ts). Nothing is listed here by hand.
 * Validation is the backend's too: a value it refuses comes back as 422 with `fields.value`.
 */
const SAMPLE: Record<string, string> = { productName: 'Opel Basin Mixer', sku: 'FT-OBM-001', finish: 'Matte Black', url: 'https://flowtop.in/products/opel-basin-mixer' };
const fill = (t: string) => t.replace(/\{(\w+)\}/g, (m, k: string) => SAMPLE[k] ?? m);
const group = (key: string) => key.split('.')[0] ?? key;
const label = (key: string) => {
  const text = key.split('.').slice(1).join(' ').replace(/([A-Z])/g, ' $1').toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
};
/** What the form shows: a list of addresses as comma-separated text, null as empty. */
const show = (v: unknown) => (Array.isArray(v) ? v.join(', ') : v === null || v === undefined ? '' : String(v));
/** What the API gets: a list stays a list, empty text becomes null (the API says if null is allowed), anything else is text. */
const send = (was: unknown, text: string): unknown => (Array.isArray(was) ? text.split(',').map((s) => s.trim()).filter(Boolean) : text.trim() === '' ? null : text);

export function SettingsScreen() {
  const canWrite = useCan()('settings:write'); // COSMETIC ONLY: the server enforces settings:write.
  const [items, setItems] = useState<SettingItem[]>();
  const [vals, setVals] = useState<Record<string, string>>({});
  const [base, setBase] = useState<Record<string, string>>({});
  const [tab, setTab] = useState<string>();
  const [error, setError] = useState<string>();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadErr, setLoadErr] = useState<string>();
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date>();
  const load = () => api<SettingItem[]>('/admin/settings').then((list) => {
    const text = Object.fromEntries(list.map((s) => [s.key, show(s.value)]));
    setItems(list); setVals(text); setBase(text); setTab((t) => t ?? (list[0] ? group(list[0].key) : undefined));
  }).catch((e) => setLoadErr(e instanceof ApiError ? e.message : 'Could not load settings.'));
  useEffect(() => { load(); }, []);
  if (loadErr) return <PageWrapper title="Settings"><LoadError message={loadErr} onRetry={() => { setLoadErr(undefined); load(); }} /></PageWrapper>;
  if (!items) return <PageWrapper title="Settings"><Skeleton /></PageWrapper>;

  const groups = [...new Set(items.map((s) => group(s.key)))];
  const dirty = items.some((s) => vals[s.key] !== base[s.key]);
  const fields: Field[] = items.filter((s) => group(s.key) === tab).map((s) => ({
    key: s.key, label: label(s.key), hint: s.description, type: /template$/i.test(s.key) ? 'textarea' : 'text',
  }));

  const save = async () => {
    setSaving(true); setError(undefined); setErrors({});
    const saved = { ...base };
    try {
      for (const s of items) {
        if (vals[s.key] === base[s.key]) continue;
        const item = await api<SettingItem>('/admin/settings', { method: 'PUT', body: { key: s.key, value: send(s.value, vals[s.key] ?? '') } });
        saved[s.key] = show(item.value);
      }
      setSavedAt(new Date());
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not save. Your changes are still here.');
      if (e instanceof ApiError) {
        const key = items.find((s) => vals[s.key] !== saved[s.key])?.key; // the first one that did not save
        if (key) setErrors({ [key]: e.fields.value ?? e.message });
      }
    } finally {
      setBase(saved); setVals((v) => ({ ...v, ...Object.fromEntries(Object.keys(saved).filter((k) => saved[k] !== base[k]).map((k) => [k, saved[k] ?? ''])) })); setSaving(false);
    }
  };
  const number = vals['whatsapp.number'] ?? '';
  const productTemplate = vals['whatsapp.productTemplate'];
  return (
    <PageWrapper title="Settings">
      <div role="tablist" aria-label="Settings" className="mb-4 flex gap-1 border-b border-grey-200">
        {groups.map((g) => <button key={g} role="tab" aria-selected={tab === g} onClick={() => setTab(g)} className={`min-h-touch px-4 text-sm capitalize ${tab === g ? 'border-b-2 border-purple-deep font-semibold text-purple-deep' : 'text-grey-700'}`}>{g}</button>)}
      </div>
      <div className={cardCls}>
        <fieldset disabled={!canWrite} className="contents">
          <SchemaForm fields={fields} value={vals} errors={errors} idPrefix="set" onChange={(k, v) => { setVals({ ...vals, [k]: String(v) }); setSavedAt(undefined); }} />
        </fieldset>
        {tab === 'whatsapp' && productTemplate !== undefined && (
          <div className="mt-4 rounded bg-grey-100 p-3 text-sm" aria-label="Message preview"><p className="mb-1 text-xs text-grey-500">What a customer’s WhatsApp will start with (sample product):</p>
            <p className="whitespace-pre-wrap rounded bg-white p-3">{fill(productTemplate)}</p>
            {number.trim() !== '' && <a className="mt-2 inline-block underline" href={`https://wa.me/${number.replace(/\D/g, '')}?text=${encodeURIComponent(fill(productTemplate))}`} target="_blank" rel="noreferrer">Open this link in WhatsApp</a>}</div>)}
      </div>
      <EditorBar dirty={dirty} saving={saving} savedAt={savedAt} error={error} onSave={save} canSave={canWrite} onPublish={canWrite ? save : undefined} publishLabel="Save settings" />
    </PageWrapper>
  );
}
