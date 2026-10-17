/**
 * Navigation and Public Settings Mapping Layer
 *
 * Maps the API shape (or fallback mock) into clean UI view models for Header and Footer.
 * Only this file will need to be updated when connecting to the real NestJS API.
 */

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
 * Retrieves navigation and public settings for server and client components.
 */
export async function getNavigation(): Promise<SiteNavigationData> {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const useMocks = process.env.NEXT_PUBLIC_USE_MOCKS === 'true' || !apiBaseUrl;

  let navData: NavigationResponse = mockNavigationData;
  let settingsData: PublicSettingsResponse = mockSettingsData;

  if (!useMocks && apiBaseUrl) {
    try {
      const [navRes, settingsRes] = await Promise.all([
        fetch(`${apiBaseUrl}/api/v1/navigation`, { next: { revalidate: 300 } }),
        fetch(`${apiBaseUrl}/api/v1/settings/public`, { next: { revalidate: 300 } }),
      ]);

      if (navRes.ok) {
        const json = (await navRes.json()) as { data?: NavigationResponse };
        if (json?.data) {
          navData = json.data;
        }
      }

      if (settingsRes.ok) {
        const json = (await settingsRes.json()) as { data?: PublicSettingsResponse };
        if (json?.data) {
          settingsData = json.data;
        }
      }
    } catch {
      // Fallback to fixture if API is temporarily unreachable.
      navData = mockNavigationData;
      settingsData = mockSettingsData;
    }
  }

  // Cart count starts at 0 for initial server render (client will hydrate real API cart count).
  const initialCartCount = 0;

  return {
    header: {
      items: navData.header,
      cartCount: initialCartCount,
    },
    footer: {
      columns: navData.footer.columns,
      socialLinks: navData.footer.socialLinks,
      legalNotice: navData.footer.legalNotice,
    },
    settings: settingsData,
  };
}
