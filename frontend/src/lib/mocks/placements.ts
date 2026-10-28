// TODO(mock): replace on swap day
import { mockProducts } from './products';
import type { PlacementResponse, SingleResponse, ProductCard } from '../types-pending';

export const mockPlacements: Record<string, ProductCard[]> = {
  'homepage_section:featured': mockProducts.slice(0, 8).map((p, idx) => ({
    ...p,
    badge: idx === 0 ? 'Bestseller' : idx === 1 ? 'New' : idx === 2 ? 'Iconic' : undefined,
  })),
};

export function getMockPlacement(
  locationType: string,
  locationId: string
): SingleResponse<PlacementResponse> {
  const key = `${locationType}:${locationId}`;
  const products = mockPlacements[key] || mockProducts.slice(0, 6);

  return {
    data: {
      locationType,
      locationId,
      products,
    },
  };
}
