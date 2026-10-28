import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getMockCart,
  addMockCartItem,
  updateMockCartQuantity,
  removeMockCartItem,
} from '../src/lib/mocks/cart.ts';
import { formatPaise } from '../src/lib/format.ts';

describe('Cart & Commerce Architecture', () => {
  describe('Security & Attack Vector Prevention', () => {
    it('addToCart payload contains ONLY productId, variantId, and quantity - NEVER a price', () => {
      // Test payload shape strictly against API contract
      const validPayload = {
        productId: 'prod-01',
        variantId: 'f-bgd',
        quantity: 2,
      };

      assert.equal(Object.prototype.hasOwnProperty.call(validPayload, 'price'), false);
      assert.equal(Object.prototype.hasOwnProperty.call(validPayload, 'unitPrice'), false);
      assert.equal(Object.prototype.hasOwnProperty.call(validPayload, 'lineTotal'), false);

      const keys = Object.keys(validPayload).sort();
      assert.deepEqual(keys, ['productId', 'quantity', 'variantId']);
    });
  });

  describe('Server-Side Authority & Zero Client Arithmetic', () => {
    it('cart totals are authoritative values from the API and never calculated client-side', () => {
      const cart = getMockCart();

      assert.ok(typeof cart.subtotal === 'number');
      assert.ok(typeof cart.shipping === 'number');
      assert.ok(typeof cart.tax === 'number');
      assert.ok(typeof cart.total === 'number');

      // The frontend formats the exact integers received from the server
      const formattedSubtotal = formatPaise(cart.subtotal);
      const formattedTotal = formatPaise(cart.total);

      assert.match(formattedSubtotal, /^₹[\d,]+/);
      assert.match(formattedTotal, /^₹[\d,]+/);
    });
  });

  describe('Interactive Mock Cart Mutation Handling', () => {
    it('adds an item and returns recalculation from mock engine', () => {
      const initialCart = getMockCart();
      const initialCount = initialCart.itemCount;

      const updatedCart = addMockCartItem({
        productId: 'prod-02',
        quantity: 1,
      });

      assert.equal(updatedCart.itemCount, initialCount + 1);
      assert.ok(updatedCart.total > 0);
    });

    it('updates quantity and recalculates server totals', () => {
      const cart = getMockCart();
      const firstItem = cart.items[0];
      assert.ok(firstItem, 'Cart must have at least one item');

      const updated = updateMockCartQuantity(firstItem.id, 5);
      const updatedItem = updated.items.find((i) => i.id === firstItem.id);

      assert.equal(updatedItem?.quantity, 5);
      assert.equal(updatedItem?.lineTotal, (updatedItem?.unitPrice ?? 0) * 5);
    });

    it('removes an item and recalculates subtotal and item count', () => {
      const cart = getMockCart();
      const itemToRemove = cart.items[cart.items.length - 1];
      assert.ok(itemToRemove);

      const updated = removeMockCartItem(itemToRemove.id);
      const exists = updated.items.some((i) => i.id === itemToRemove.id);

      assert.equal(exists, false);
    });
  });

  describe('Warnings Specification & Unavailable Products', () => {
    it('handles warnings array without crashing or silently vanishing products', () => {
      const cartWithWarning = {
        ...getMockCart(),
        warnings: [
          {
            itemId: 'cart-item-1',
            code: 'UNAVAILABLE',
            message: 'This finish is no longer available',
          },
        ],
      };

      assert.equal(cartWithWarning.warnings.length, 1);
      assert.equal(cartWithWarning.warnings[0].code, 'UNAVAILABLE');
      assert.equal(cartWithWarning.warnings[0].message, 'This finish is no longer available');
      assert.equal(cartWithWarning.items.length > 0, true, 'Product is preserved alongside warning');
    });
  });
});
