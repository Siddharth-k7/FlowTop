'use client';
import { useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { PageWrapper } from '@/components/shell/PageWrapper';
import { EditorBar, LoadError, Skeleton } from '@/components/ui/EditorBar';
import { SchemaForm, type Field } from '@/components/ui/SchemaForm';
import { btnSecondary, cardCls } from '@/lib/ui-classes';

const EMAIL: Field[] = [
  { key: 'emailFrom', label: 'Sender address', type: 'text', required: true, hint: 'Customers see emails coming from this address.' },
  { key: 'orderRecipients', label: 'Who gets order emails', type: 'text', hint: 'Separate several addresses with commas.' },
  { key: 'contactRecipients', label: 'Who gets contact messages', type: 'text' },
  { key: 'purchaseAssistanceRecipients', label: 'Who gets “where to buy” requests', type: 'text', hint: 'Kept internal. Customers never see who receives these.' },
  { key: 'dealerRecipients', label: 'Who gets dealer applications', type: 'text' },
];
const WA: Field[] = [
  { key: 'whatsappNumber', label: 'WhatsApp number', type: 'text', required: true, hint: 'With country code, e.g. +919876543210' },
  { key: 'whatsappGeneral', label: 'General message', type: 'textarea' },
  { key: 'whatsappProduct', label: 'Product message', type: 'textarea', hint: 'You can use {productName}, {sku}, {finish} and {url}.' },
];
const SAMPLE = { productName: 'Opel Basin Mixer', sku: 'FT-OBM-001', finish: 'Matte Black', url: 'https://flowtop.in/products/opel-basin-mixer' };
const fill = (t: string) => t.replace(/\{(\w+)\}/g, (m, k: string) => SAMPLE[k as keyof typeof SAMPLE] ?? m);

export function SettingsScreen() {
  const [vals, setVals] = useState<Record<string, string>>();
  const [base, setBase] = useState('');
  const [tab, setTab] = useState<'email' | 'whatsapp'>('email');
  const [error, setError] = useState<string>();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadErr, setLoadErr] = useState<string>();
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date>();
  const [test, setTest] = useState<string>();
  const load = () => api<Record<string, string>>('/admin/settings').then((s) => { setVals(s); setBase(JSON.stringify(s)); }).catch((e) => setLoadErr(e instanceof ApiError ? e.message : 'Could not load settings.'));
  useEffect(() => { load(); }, []);
  if (loadErr) return <PageWrapper title="Settings"><LoadError message={loadErr} onRetry={() => { setLoadErr(undefined); load(); }} /></PageWrapper>;
  if (!vals) return <PageWrapper title="Settings"><Skeleton /></PageWrapper>;

  const save = async () => {
    setSaving(true); setError(undefined); setErrors({});
    const was = JSON.parse(base) as Record<string, string>;
    try {
      for (const [key, value] of Object.entries(vals)) if (was[key] !== value) await api('/admin/settings', { method: 'PUT', body: { key, value } });
      setBase(JSON.stringify(vals)); setSavedAt(new Date());
    } catch (e) { setError(e instanceof ApiError ? e.message : 'Could not save. Your changes are still here.'); if (e instanceof ApiError) setErrors(e.fields); }
    finally { setSaving(false); }
  };
  const sendTest = async () => {
    setTest(undefined);
    try { const r = await api<{ to: string }>('/admin/settings/test-email', { method: 'POST' }); setTest(`Test email sent to ${r.to}. Check that inbox, then you know it works.`); }
    catch (e) { setTest(e instanceof ApiError ? `Test email failed: ${e.message}` : 'Test email failed. Nothing was sent.'); }
  };
  const link = `https://wa.me/${vals.whatsappNumber?.replace(/\D/g, '')}?text=${encodeURIComponent(fill(vals.whatsappProduct ?? ''))}`;
  return (
    <PageWrapper title="Settings">
      <div role="tablist" aria-label="Settings" className="mb-4 flex gap-1 border-b border-grey-200">
        {(['email', 'whatsapp'] as const).map((t) => <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`min-h-touch px-4 text-sm capitalize ${tab === t ? 'border-b-2 border-purple-deep font-semibold text-purple-deep' : 'text-grey-700'}`}>{t}</button>)}
      </div>
      <div className={cardCls}>
        <SchemaForm fields={tab === 'email' ? EMAIL : WA} value={vals} errors={errors} idPrefix="set" onChange={(k, v) => { setVals({ ...vals, [k]: String(v) }); setSavedAt(undefined); }} />
        {tab === 'email' && (
          <div className="mt-4"><button className={btnSecondary} onClick={sendTest} disabled={JSON.stringify(vals) !== base}>Send a test email</button>
            {JSON.stringify(vals) !== base && <p className="mt-1 text-xs text-grey-500">Save your changes first so the test uses them.</p>}
            {test && <p role="status" className="mt-2 text-sm">{test}</p>}</div>)}
        {tab === 'whatsapp' && (
          <div className="mt-4 rounded bg-grey-100 p-3 text-sm" aria-label="Message preview"><p className="mb-1 text-xs text-grey-500">What a customer’s WhatsApp will start with (sample product):</p>
            <p className="whitespace-pre-wrap rounded bg-white p-3">{fill(vals.whatsappProduct ?? '')}</p>
            <a className="mt-2 inline-block underline" href={link} target="_blank" rel="noreferrer">Open this link in WhatsApp</a></div>)}
      </div>
      <EditorBar dirty={JSON.stringify(vals) !== base} saving={saving} savedAt={savedAt} error={error} onSave={save} onPublish={save} publishLabel="Save settings" />
    </PageWrapper>
  );
}
