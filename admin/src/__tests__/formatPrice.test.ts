import { describe, expect, it } from 'vitest';
import { formatPrice } from '@/lib/utils/formatPrice';

describe('formatPrice (integer paise in)', () => {
  it('divides by 100 and formats as INR with Indian grouping', () => {
    expect(formatPrice(129900)).toBe('₹1,299.00');
    expect(formatPrice(12345678900)).toBe('₹12,34,56,789.00');
  });
  it('keeps paise and handles zero', () => {
    expect(formatPrice(5)).toBe('₹0.05');
    expect(formatPrice(0)).toBe('₹0.00');
  });
});
