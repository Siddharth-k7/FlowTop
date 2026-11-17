import { describe, expect, it } from 'vitest';
import { saveTarget } from '@/lib/save-target';

describe('first save reuse', () => {
  it('posts the first time and patches the created id after that, so a retry does not create a second page', () => {
    expect(saveTarget(true, undefined, 'new')).toEqual({ method: 'POST', pathId: undefined });
    expect(saveTarget(true, 'page-1', 'new')).toEqual({ method: 'PATCH', pathId: 'page-1' });
    expect(saveTarget(false, undefined, 'page-9')).toEqual({ method: 'PATCH', pathId: 'page-9' });
  });
});
