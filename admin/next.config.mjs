import { PHASE_PRODUCTION_BUILD } from 'next/constants.js';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));

/** @type {(phase: string) => import('next').NextConfig} */
export default function config(phase) {
  // Mock mode ships fake users and fake data. It must never reach a production build.
  if (phase === PHASE_PRODUCTION_BUILD && process.env.NEXT_PUBLIC_USE_MOCKS === 'true') {
    throw new Error('NEXT_PUBLIC_USE_MOCKS=true is not allowed in a production build. Unset it, or use `npm run dev`.');
  }
  return {
    reactStrictMode: true,
    webpack: (webpackConfig, { webpack }) => {
      // A dynamic import() is still emitted when the flag is only read at runtime. Replace the
      // mock router so the mock password and seed data are not in the production bundle.
      if (process.env.NEXT_PUBLIC_USE_MOCKS !== 'true') {
        webpackConfig.plugins.push(new webpack.NormalModuleReplacementPlugin(
          /[\\/]mocks[\\/]router(\.ts)?$/,
          resolve(root, 'src/lib/mocks-off.ts'),
        ));
      }
      return webpackConfig;
    },
  };
}
