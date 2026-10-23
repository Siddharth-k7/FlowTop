// TODO(mock): replace on swap day
import type { Cart } from '../types-pending';

export const mockCart = {
  id: 'cart-session-01',
  items: [
    {
      id: 'cart-item-1',
      productId: 'prod-01',
      productName: 'Aura Tall Basin Mixer',
      sku: 'FT-AUR-BM-01',
      slug: 'aura-tall-basin-mixer',
      finishName: 'Brushed Architectural Gold',
      unitPrice: 1450000, // ₹14,500
      quantity: 2,
      lineTotal: 2900000, // ₹29,000
      imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=400&q=80',
    },
    {
      id: 'cart-item-2',
      productId: 'prod-36',
      productName: 'Aura Single Towel Rail 600mm',
      sku: 'FT-AUR-TR-01',
      slug: 'aura-single-towel-rail-600mm',
      finishName: 'Brushed Architectural Gold',
      unitPrice: 520000, // ₹5,200
      quantity: 1,
      lineTotal: 520000, // ₹5,200
      imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=400&q=80',
    },
  ],
  subtotal: 3420000, // ₹34,200 (paise)
  tax: 615600, // 18% GST = ₹6,156 (paise)
  shipping: 0, // Complimentary white-glove shipping
  total: 4035600, // ₹40,356 (paise)
  itemCount: 3,
} satisfies Cart;
