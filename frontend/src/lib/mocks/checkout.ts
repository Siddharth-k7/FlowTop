import type {
  CheckoutRequest,
  CheckoutResponse,
  OrderStatusResponse,
  OrderDetailResponse,
  Cart,
} from '../types-pending';

interface StoredMockOrder {
  order: OrderDetailResponse;
  createdAtMs: number;
}

const mockOrdersMap = new Map<string, StoredMockOrder>();

const DEFAULT_MOCK_CHECKOUT_CART: Cart = {
  id: 'cart-session-01',
  items: [
    {
      id: 'cart-item-1',
      productId: 'prod-01',
      productName: 'Aura Tall Basin Mixer',
      sku: 'FT-AUR-BM-01',
      slug: 'aura-tall-basin-mixer',
      finishName: 'Brushed Architectural Gold',
      unitPrice: 1450000,
      quantity: 2,
      lineTotal: 2900000,
      imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=400&q=80',
    },
    {
      id: 'cart-item-2',
      productId: 'prod-36',
      productName: 'Aura Single Towel Rail 600mm',
      sku: 'FT-AUR-TR-01',
      slug: 'aura-single-towel-rail-600mm',
      finishName: 'Brushed Architectural Gold',
      unitPrice: 520000,
      quantity: 1,
      lineTotal: 520000,
      imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=400&q=80',
    },
  ],
  subtotal: 3420000,
  tax: 615600,
  shipping: 0,
  total: 4035600,
  itemCount: 3,
  warnings: [],
};

export function createMockCheckout(
  body: CheckoutRequest,
  cartInput?: Cart
): CheckoutResponse {
  const cart = cartInput || DEFAULT_MOCK_CHECKOUT_CART;
  const orderId = `ord-${Date.now()}`;
  const reference = `FT-2026-${String(Math.floor(Math.random() * 90000) + 10000)}`;

  const orderDetail: OrderDetailResponse = {
    id: orderId,
    reference,
    customerName: body.contact.name,
    customerEmail: body.contact.email,
    customerPhone: body.contact.phone,
    deliveryAddressLine1: body.delivery.addressLine1,
    deliveryAddressLine2: body.delivery.addressLine2 || null,
    deliveryCity: body.delivery.city,
    deliveryState: body.delivery.state,
    deliveryPin: body.delivery.pin,
    deliveryLandmark: body.delivery.landmark || null,
    deliveryNotes: body.delivery.notes || null,
    subtotal: cart.subtotal,
    shipping: cart.shipping,
    tax: cart.tax,
    total: cart.total,
    paymentStatus: 'pending',
    orderStatus: 'received',
    createdAt: new Date().toISOString(),
    items: cart.items.map((i) => ({
      id: i.id,
      productId: i.productId,
      variantId: null,
      productName: i.productName,
      sku: i.sku,
      finishName: i.finishName || null,
      unitPrice: i.unitPrice,
      quantity: i.quantity,
      lineTotal: i.lineTotal,
      imageUrl: i.imageUrl || null,
    })),
  };

  mockOrdersMap.set(reference, {
    order: orderDetail,
    createdAtMs: Date.now(),
  });

  return {
    orderId,
    reference,
    gateway: {
      provider: 'razorpay_mock',
      orderId: `rzp_order_${Date.now()}`,
      amount: cart.total,
      key: 'rzp_test_mock_key',
      redirectUrl: `/checkout?reference=${reference}&flow=confirm`,
    },
  };
}

export function getMockOrderStatus(reference: string): OrderStatusResponse {
  const stored = mockOrdersMap.get(reference);
  if (!stored) {
    // Unrecognized or forged reference: server reports failed
    return { paymentStatus: 'failed' };
  }

  // Simulate payment gateway webhook processing:
  // First 2 seconds -> 'pending', after 2 seconds -> 'paid'
  const elapsedSeconds = (Date.now() - stored.createdAtMs) / 1000;
  if (elapsedSeconds < 2) {
    return { paymentStatus: 'pending' };
  }

  stored.order.paymentStatus = 'paid';
  stored.order.orderStatus = 'confirmed';
  return { paymentStatus: 'paid' };
}

export function getMockOrderDetail(reference: string): OrderDetailResponse {
  const stored = mockOrdersMap.get(reference);
  if (stored) {
    return stored.order;
  }

  // Return realistic fallback order detail
  return {
    id: `ord-${reference}`,
    reference,
    customerName: 'Arjun Sharma',
    customerEmail: 'arjun.sharma@example.com',
    customerPhone: '+919876543210',
    deliveryAddressLine1: 'Flat 402, Signature Towers',
    deliveryAddressLine2: 'Off Golf Course Road',
    deliveryCity: 'Gurugram',
    deliveryState: 'Haryana',
    deliveryPin: '122002',
    deliveryLandmark: 'Near DLF Phase 5',
    deliveryNotes: 'Call before delivery',
    subtotal: 1970000,
    shipping: 0,
    tax: 354600,
    total: 2324600,
    paymentStatus: 'paid',
    orderStatus: 'confirmed',
    createdAt: new Date().toISOString(),
    items: [
      {
        id: 'ord-item-1',
        productId: 'prod-01',
        variantId: null,
        productName: 'Aura Tall Basin Mixer',
        sku: 'FT-AUR-BM-01',
        finishName: 'Brushed Architectural Gold',
        unitPrice: 1450000,
        quantity: 1,
        lineTotal: 1450000,
        imageUrl:
          'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=400&q=80',
      },
      {
        id: 'ord-item-2',
        productId: 'prod-36',
        variantId: null,
        productName: 'Aura Single Towel Rail 600mm',
        sku: 'FT-AUR-TR-01',
        finishName: 'Brushed Architectural Gold',
        unitPrice: 520000,
        quantity: 1,
        lineTotal: 520000,
        imageUrl:
          'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=400&q=80',
      },
    ],
  };
}
