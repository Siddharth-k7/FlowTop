/**
 * Mock public settings fixture for Flowtop.
 *
 * TODO(mock): Swap for real API call (GET /api/v1/settings/public) when backend is deployed.
 */

import type { PublicSettingsResponse } from '../types-pending';

export const mockSettingsData: PublicSettingsResponse = {
  whatsapp: {
    number: '+919876543210',
    generalTemplate: "Hi, I'd like to know more about Flowtop products.",
    productTemplate: "Hi, I'm interested in {productName} (SKU: {sku}) in {finish}. {url}",
  },
};
