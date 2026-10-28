// TODO(mock): replace on swap day
import type { Cart, CartItem } from '../types-pending';

let currentMockCart: Cart = {
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
  warnings: [],
};

function recalculateMockCart(cart: Cart): Cart {
  let subtotal = 0;
  let itemCount = 0;
  for (const item of cart.items) {
    item.lineTotal = item.unitPrice * item.quantity;
    subtotal += item.lineTotal;
    itemCount += item.quantity;
  }
  const tax = Math.round(subtotal * 0.18);
  const shipping = subtotal > 500000 || subtotal === 0 ? 0 : 15000;
  const total = subtotal + tax + shipping;

  return {
    ...cart,
    subtotal,
    tax,
    shipping,
    total,
    itemCount,
  };
}

export function getMockCart(): Cart {
  return JSON.parse(JSON.stringify(currentMockCart));
}

export function addMockCartItem(body: { productId: string; variantId?: string; quantity: number }): Cart {
  if (body.productId.includes('archived')) {
    const error = new Error('This architectural fitting has been archived and is no longer available.') as Error & { status: number; code: string };
    error.status = 400;
    error.code = 'BAD_REQUEST';
    throw error;
  }

  const existing = currentMockCart.items.find(
    (item) => item.productId === body.productId && (!body.variantId || item.id.includes(body.variantId))
  );

  if (existing) {
    existing.quantity += body.quantity;
  } else {
    const unitPrice = 1450000;
    const newItem: CartItem = {
      id: `cart-item-${Date.now()}`,
      productId: body.productId,
      productName: 'Aura Architectural Fitting',
      sku: 'FT-AUR-SPEC',
      slug: 'aura-tall-basin-mixer',
      finishName: 'Polished Mirror Chrome',
      unitPrice,
      quantity: body.quantity,
      lineTotal: unitPrice * body.quantity,
      imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=400&q=80',
    };
    currentMockCart.items.push(newItem);
  }

  currentMockCart = recalculateMockCart(currentMockCart);
  return getMockCart();
}

export function updateMockCartQuantity(itemId: string, quantity: number): Cart {
  const item = currentMockCart.items.find((i) => i.id === itemId);
  if (item) {
    if (quantity <= 0) {
      currentMockCart.items = currentMockCart.items.filter((i) => i.id !== itemId);
    } else {
      item.quantity = quantity;
    }
  }
  currentMockCart = recalculateMockCart(currentMockCart);
  return getMockCart();
}

export function removeMockCartItem(itemId: string): Cart {
  currentMockCart.items = currentMockCart.items.filter((i) => i.id !== itemId);
  currentMockCart = recalculateMockCart(currentMockCart);
  return getMockCart();
}

export const mockCart = currentMockCart;
