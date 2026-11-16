import { describe, expect, it } from 'vitest';
import type { Doc } from '@/lib/doc';
import { contentType } from '@/lib/content-types';

describe('collection editor body', () => {
  it('omits status on create and on a story save, even when the document is a draft', () => {
    const collections = contentType('collections');
    if (!collections?.toBody) throw new Error('collections have no toBody');
    const draft: Doc = { id: 'new', name: 'Opel', slug: 'opel', story: '', description: null, heroMediaId: null, status: 'draft' };
    const body = collections.toBody(draft) as Record<string, unknown>;
    expect(body).toMatchObject({ name: 'Opel', slug: 'opel', story: '', description: null, heroMediaId: null });
    expect(body).not.toHaveProperty('status');
  });
});
