import type { MediaAsset } from '@flowtop/types';

// Mock mode only.
const svg = (c: string, t: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="400" height="400" fill="${c}"/><text x="200" y="210" font-size="26" text-anchor="middle" fill="white">${t}</text></svg>`)}`;
const asset = (id: string, filename: string, c: string, kb: number, day: number): MediaAsset => ({
  id, filename, alt: '', width: 2000, height: 2000, sizeBytes: kb * 1024, mimeType: 'image/jpeg',
  createdAt: `2026-10-${String(day).padStart(2, '0')}T04:30:00Z`, url: svg(c, filename),
  variants: { thumb: svg(c, filename), medium: svg(c, filename), large: svg(c, filename) },
});
export const mockMedia: MediaAsset[] = [
  { ...asset('m1', 'opel-basin-mixer.jpg', '#5b2a86', 482, 12), alt: 'Opel Basin Mixer in chrome' },
  { ...asset('m2', 'opel-matte-black.jpg', '#16121c', 455, 11), alt: 'Opel Basin Mixer in matte black' },
  asset('m3', 'rain-shower-head.jpg', '#9b6fc4', 610, 10),
  asset('m4', 'bathroom-lifestyle.jpg', '#3d3745', 920, 9),
  asset('m5', 'wall-mixer-chrome.jpg', '#6b6573', 380, 8),
  { ...asset('m6', 'installation-manual.pdf', '#b3261e', 1480, 7), mimeType: 'application/pdf' },
];

/** What uses each mock file, so a mock delete can 409 like the API does. Not part of MediaAsset. */
export const mockUsage: Record<string, string[]> = {
  m1: ['product "Opel Basin Mixer" (main image)', 'page "Home" (SEO image)'],
  m2: ['product "Opel Basin Mixer" (gallery image)'],
};
