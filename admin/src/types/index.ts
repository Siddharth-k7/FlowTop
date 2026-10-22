// TODO: swap for @flowtop/types when shared/types is populated. Mirrors docs/03-api-contract.md.
export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions: string[];
  mfaEnabled: boolean;
}
export type LoginResult =
  | { requiresMfa: false; user: User }
  | { requiresMfa: true; mfaToken: string };

export interface MediaAsset {
  id: string;
  url: string;
  alt: string;
  width: number | null;
  height: number | null;
  sizeBytes: number;
  mimeType: string;
  variants: { thumb?: string; medium?: string; large?: string };
  // Not in the contract yet (asked Dev A). The grid shows them when present.
  filename?: string;
  createdAt?: string;
  /** Mock only: the real API names what uses the asset in the 409 message. */
  usedBy?: string[];
}
export interface ListMeta { page: number; perPage: number; total: number; totalPages: number }
export interface ApiErrorBody { code: string; message: string; fields?: Record<string, string> }

export interface DashboardSummary {
  draftPages: number;
  productsMissingImages: number;
  productsMissingSpecs: number;
  recentOrders: { id: string; reference: string; total: number; status: string }[];
  recentSubmissions: { id: string; name: string; type: string; read: boolean }[];
}
