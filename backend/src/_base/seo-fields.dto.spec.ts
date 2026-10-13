import { validate } from 'class-validator';
import { SeoFieldsDto, SeoFieldsMixin } from './seo-fields.dto';

describe('SEO fields', () => {
  it('accepts valid optional fields', async () => {
    const dto = Object.assign(new SeoFieldsDto(), { title: 'Product', shareImageId: '00000000-0000-4000-8000-000000000001' });
    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('rejects an overlong title', async () => {
    const dto = Object.assign(new SeoFieldsDto(), { title: 'x'.repeat(71) });
    await expect(validate(dto)).resolves.toHaveLength(1);
  });

  it('provides reusable SEO properties through the mixin class', () => {
    expect(new SeoFieldsMixin()).toBeInstanceOf(SeoFieldsDto);
  });
});
