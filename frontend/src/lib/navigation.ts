/**
 * Navigation and Public Settings Mapping Layer
 *
 * Maps the API shape (or, during `next build` only, the seed fixtures) into clean UI view models for Header and Footer.
 * Only this file will need to be updated when connecting to the real NestJS API.
 */

import { api } from './api';
import { mockNavigationData } from './mocks/navigation';
import { mockSettingsData } from './mocks/settings';
import type {
  NavigationResponse,
  NavigationItem,
  FooterColumn,
  SocialLink,
  PublicSettingsResponse,
} from './types-pending';

export interface HeaderProps {
  items: NavigationItem[];
  cartCount?: number;
}

export interface FooterProps {
  columns: FooterColumn[];
  socialLinks: SocialLink[];
  legalNotice: string;
}

export interface SiteNavigationData {
  header: HeaderProps;
  footer: FooterProps;
  settings: PublicSettingsResponse;
}

/**
 * True only while `next build` prerenders pages. Next sets NEXT_PHASE in the
 * build workers; at runtime (`next start`, ISR regeneration) and in `next dev`
 * it is something else.
 */
export function isBuildPhase(): boolean {
  return process.env.NEXT_PHASE === 'phase-production-build';
}

/**
 * Retrieves navigation and public settings for the root layout.
 *
 * Failure policy (docs/reviews/dev-a-fix-nav-runtime-throw-2026-10-24.md):
 * - At runtime this THROWS when the API fails or returns no data. Every public
 *   page is ISR, so a failed regeneration leaves the last good page in the
 *   cache and Next keeps serving it. Falling back here instead would cache the
 *   seed navigation on every regeneration for as long as the API stays down.
 * - During `next build` there is no previous page to keep, so it falls back to
 *   the seed fixtures and the page heals at the first successful regeneration.
 */
export async function getNavigation(): Promise<SiteNavigationData> {
  let navData: NavigationResponse;
  let settingsData: PublicSettingsResponse;

  try {
    const [navRes, settingsRes] = await Promise.all([
      api.getNavigation(),
      api.getPublicSettings(),
    ]);
    if (!navRes?.data || !settingsRes?.data) {
      throw new Error('Navigation or public settings API returned no data');
    }
    navData = navRes.data;
    settingsData = settingsRes.data;
  } catch (err) {
    if (!isBuildPhase()) {
      throw err;
    }
    console.warn(
      `[navigation] API unavailable during build, prerendering with seed fixtures: ${
        err instanceof Error ? err.message : String(err)
      }`
    );
    navData = mockNavigationData;
    settingsData = mockSettingsData;
  }

  const navItems = navData.header;
  const footerData = navData.footer;

  return {
    header: {
      items: navItems,
      cartCount: 0,
    },
    footer: {
      columns: footerData.columns,
      socialLinks: footerData.socialLinks,
      legalNotice: footerData.legalNotice,
    },
    settings: settingsData,
  };
}
