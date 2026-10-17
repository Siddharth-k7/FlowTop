/**
 * Navigation and Public Settings Mapping Layer
 *
 * Maps the API shape (or fallback mock) into clean UI view models for Header and Footer.
 * Only this file will need to be updated when connecting to the real NestJS API.
 */

import { api } from './api';
import { mockNavigationData } from './mocks/navigation';
import { mockSettingsData } from './mocks/settings';
import type {
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
 * Retrieves navigation and public settings for server and client components.
 */
export async function getNavigation(): Promise<SiteNavigationData> {
  let navItems = mockNavigationData.header;
  let footerData = mockNavigationData.footer;
  let settingsData = mockSettingsData;

  try {
    const [navRes, settingsRes] = await Promise.all([
      api.getNavigation(),
      api.getPublicSettings(),
    ]);

    if (navRes.data) {
      navItems = navRes.data.header;
      footerData = navRes.data.footer;
    }

    if (settingsRes.data) {
      settingsData = settingsRes.data;
    }
  } catch {
    // If navigation call fails, fallback gracefully to seed fixtures so the shell remains functional
    navItems = mockNavigationData.header;
    footerData = mockNavigationData.footer;
    settingsData = mockSettingsData;
  }

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
