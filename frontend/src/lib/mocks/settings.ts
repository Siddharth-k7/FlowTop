// TODO(mock): replace on swap day
/**
 * Mock public settings fixture for Flowtop.
 */

import type { PublicSettingsResponse } from '../types-pending';

export const mockSettingsData: PublicSettingsResponse = {
  whatsapp: {
    number: '+919876543210',
    generalTemplate: "Hi, I'd like to know more about Flowtop products.",
    productTemplate: "Hi, I'm interested in {productName} (SKU: {sku}) in {finish}. {url}",
  },
};
