'use client';
import { useEffect, useRef } from 'react';
import { SECTIONS } from '@/lib/sections';
import type { Section } from '@/types/cms';

export const DEVICES = { desktop: 1280, tablet: 768, mobile: 360 } as const;
export type Device = keyof typeof DEVICES;
const SITE = process.env.NEXT_PUBLIC_SITE_URL; // Dev C's site; its /preview route renders the posted sections.

const esc = (s: unknown) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] as string);
/** Stand-in used until Dev C's /preview route exists. Content only, so staff can see order and wording. */
function mockHtml(sections: Section[]): string {
  const body = sections.filter((s) => s.visible).map((s) => {
    const c = s.config;
    return `<section><small>${esc(SECTIONS[s.type]?.label ?? s.type)}</small><h2>${esc(c.headline ?? c.heading ?? c.question ?? '')}</h2><p>${esc(c.subheading ?? c.body ?? c.description ?? '')}</p></section>`;
  }).join('') || '<p style="padding:2rem;color:#6b6573">This page has no visible sections yet.</p>';
  return `<!doctype html><meta name="viewport" content="width=device-width"><style>body{font:16px system-ui;margin:0}section{padding:2rem 1.5rem;border-bottom:1px solid #e2dfe6}small{color:#5b2a86;text-transform:uppercase;letter-spacing:.08em}h2{margin:.5rem 0}</style>${body}`;
}

/** A real iframe resized to the device width, not a CSS transform, so media queries inside it respond. */
export function PagePreview({ sections, device }: { sections: Section[]; device: Device }) {
  const frame = useRef<HTMLIFrameElement>(null);
  useEffect(() => { if (SITE) frame.current?.contentWindow?.postMessage({ type: 'flowtop:preview', sections }, SITE); }, [sections]);
  return (
    <div className="overflow-auto rounded bg-grey-200 p-2" style={{ height: '70vh' }}>
      <iframe ref={frame} title={`Page preview, ${device} width`} style={{ width: DEVICES[device], maxWidth: 'none', height: '100%', minHeight: 480 }} className="mx-auto block border-0 bg-white"
        {...(SITE ? { src: `${SITE}/preview` } : { srcDoc: mockHtml(sections), sandbox: '' })} />
    </div>
  );
}
