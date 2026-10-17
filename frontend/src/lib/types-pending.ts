/**
 * Pending shared types for Flowtop.
 *
 * TODO(types): Move to shared/types once the shared API contract types are finalized.
 * Owned by Dev C locally in frontend.
 */

export interface NavigationSubItem {
  id: string;
  label: string;
  href: string;
  description?: string;
  badge?: string;
}

export interface NavigationItem {
  id: string;
  label: string;
  href?: string;
  items?: NavigationSubItem[];
}

export interface FooterColumn {
  id: string;
  title: string;
  links: {
    id: string;
    label: string;
    href: string;
  }[];
}

export interface SocialLink {
  id: string;
  platform: 'instagram' | 'linkedin' | 'pinterest' | 'youtube';
  url: string;
  label: string;
}

export interface NavigationResponse {
  header: NavigationItem[];
  footer: {
    columns: FooterColumn[];
    socialLinks: SocialLink[];
    legalNotice: string;
  };
}

export interface PublicSettingsResponse {
  whatsapp: {
    number: string;
    generalTemplate: string;
    productTemplate: string;
  };
}

export interface CartSummary {
  itemCount: number;
}
