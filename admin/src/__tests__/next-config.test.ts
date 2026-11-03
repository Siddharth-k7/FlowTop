import { afterEach, describe, expect, it } from 'vitest';
import { PHASE_DEVELOPMENT_SERVER, PHASE_PRODUCTION_BUILD } from 'next/constants.js';
import config from '../../next.config.mjs';

afterEach(() => { delete process.env.NEXT_PUBLIC_USE_MOCKS; });

describe('next.config mock guard', () => {
  it('refuses a production build with mocks on', () => {
    process.env.NEXT_PUBLIC_USE_MOCKS = 'true';
    expect(() => config(PHASE_PRODUCTION_BUILD)).toThrow(/not allowed in a production build/);
  });
  it('allows mocks in dev and a build with mocks off', () => {
    process.env.NEXT_PUBLIC_USE_MOCKS = 'true';
    expect(config(PHASE_DEVELOPMENT_SERVER)).toMatchObject({ reactStrictMode: true });
    process.env.NEXT_PUBLIC_USE_MOCKS = 'false';
    expect(config(PHASE_PRODUCTION_BUILD)).toMatchObject({ reactStrictMode: true });
  });
});
