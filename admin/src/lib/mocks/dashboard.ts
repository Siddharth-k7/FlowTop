import type { DashboardSummary } from '@/types';

// TODO: swap for real API (Dev B aggregate endpoint, Phase 4)
export const mockDashboard: DashboardSummary = {
  draftPages: 2,
  productsMissingImages: 4,
  productsMissingSpecs: 7,
  recentOrders: [
    { id: 'o1', reference: 'FT-10042', total: 399000, status: 'Paid' },
    { id: 'o2', reference: 'FT-10041', total: 1250000, status: 'Shipped' },
  ],
  recentSubmissions: [
    { id: 's1', name: 'Rahul Mehta', type: 'Dealer enquiry', read: false },
    { id: 's2', name: 'Sneha Iyer', type: 'Contact', read: true },
  ],
};
