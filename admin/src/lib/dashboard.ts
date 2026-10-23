/** The dashboard summary. Mock-only shape until Dev B's aggregate endpoint (Phase 4) lands. */
export interface DashboardSummary {
  draftPages: number;
  productsMissingImages: number;
  productsMissingSpecs: number;
  recentOrders: { id: string; reference: string; total: number; status: string }[];
  recentSubmissions: { id: string; name: string; type: string; read: boolean }[];
}
