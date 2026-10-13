import { SlugService, type SlugRepository } from './slug.service';

describe('SlugService', () => {
  it('normalizes names and appends a collision suffix', async () => {
    const used = new Set(['opel-basin-mixer', 'opel-basin-mixer-2']);
    const repository: SlugRepository = { exists: (slug) => Promise.resolve(used.has(slug)) };
    await expect(new SlugService().unique('Opél Basin Mixer', repository)).resolves.toBe('opel-basin-mixer-3');
  });

  it('allows a manual slug override', async () => {
    await expect(new SlugService().unique('Ignored Name', { exists: () => Promise.resolve(false) }, 'custom-slug')).resolves.toBe('custom-slug');
  });
});
