/**
 * Navigation and Public Settings Mapping Layer
 *
 * Requirements:
 * - Replace the mock in lib/navigation.ts with the real API.
 * - The mapper stays the one file that changes.
 * - If navigation fails, render the header with the wordmark only and the footer without columns, and log it.
 * - In production never fall back to the mock.
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

const DEFAULT_SETTINGS: PublicSettingsResponse = {
  whatsapp: {
    number: '+919876543210',
    generalTemplate: 'Hello Flowtop, I would like to enquire about your architectural bathfittings.',
    productTemplate: 'Hello Flowtop, I am interested in {{productName}} (SKU: {{sku}}).',
  },
};

const DEFAULT_LEGAL = '© 2026 Flowtop Bathfittings Pvt. Ltd. All rights reserved.';

/**
 * Retrieves navigation and public settings for server and client components.
 */
export async function getNavigation(): Promise<SiteNavigationData> {
  let navItems: NavigationItem[] = [];
  let footerColumns: FooterColumn[] = [];
  let socialLinks: SocialLink[] = [];
  let legalNotice = DEFAULT_LEGAL;
  let settingsData: PublicSettingsResponse = DEFAULT_SETTINGS;

  try {
    const [navRes, settingsRes] = await Promise.all([
      api.getNavigation(),
      api.getPublicSettings(),
    ]);

    if (navRes?.data) {
      navItems = navRes.data.header || [];
      footerColumns = navRes.data.footer?.columns || [];
      socialLinks = navRes.data.footer?.socialLinks || [];
      legalNotice = navRes.data.footer?.legalNotice || DEFAULT_LEGAL;
    }

    if (settingsRes?.data) {
      settingsData = settingsRes.data;
    }
  } catch (err) {
    console.error('[getNavigation] Navigation API call failed:', err);

    if (process.env.NODE_ENV !== 'production' && process.env.NEXT_PUBLIC_USE_MOCKS === 'true') {
      // In local mock mode, use fixture data
      navItems = mockNavigationData.header;
      footerColumns = mockNavigationData.footer.columns;
      socialLinks = mockNavigationData.footer.socialLinks;
      legalNotice = mockNavigationData.footer.legalNotice;
      settingsData = mockSettingsData;
    } else {
      // In production (or real backend outage): NEVER fall back to mock.
      // Header renders wordmark only (items: []), footer without columns (columns: []).
      navItems = [];
      footerColumns = [];
      socialLinks = [];
    }
  }

  return {
    header: {
      items: navItems,
      cartCount: 0,
    },
    footer: {
      columns: footerColumns,
      socialLinks,
      legalNotice,
    },
    settings: settingsData,
  };
}
