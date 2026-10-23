import { PHASE_PRODUCTION_BUILD } from 'next/constants.js';

/** @type {(phase: string) => import('next').NextConfig} */
export default function config(phase) {
  // Mock mode ships fake users and fake data. It must never reach a production build.
  if (phase === PHASE_PRODUCTION_BUILD && process.env.NEXT_PUBLIC_USE_MOCKS === 'true') {
    throw new Error('NEXT_PUBLIC_USE_MOCKS=true is not allowed in a production build. Unset it, or use `npm run dev`.');
  }
  return { reactStrictMode: true };
}
