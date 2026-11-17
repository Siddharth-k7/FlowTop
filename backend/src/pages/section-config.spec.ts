import { ApiException } from '../common/errors/api.exception';
import { assertCanAttachSections, assertPageSections, assertSectionConfig } from './section-config';

function reject(type: string, config: unknown): ApiException {
  try {
    assertSectionConfig(type, config);
  } catch (error) {
    if (error instanceof ApiException) return error;
    throw error;
  }
  throw new Error('expected the config to be rejected');
}

describe('section config error summary', () => {
  it('names videoUrl when a video link is rejected', () => {
    const error = reject('hero', { headline: 'Hi', videoUrl: 'javascript:alert(1)' });
    expect(error.code).toBe('VALIDATION_FAILED');
    expect(error.message).not.toBe('That layout is not one of the approved presets.');
    expect(error.message).toMatch(/videoUrl/);
    expect(error.fields?.videoUrl).toMatch(/https/);
  });

  it('names layout.background when the preset is not approved', () => {
    const error = reject('hero', { layout: { background: 'rainbow' } });
    expect(error.message).toMatch(/layout\.background/);
    expect(error.message).not.toMatch(/approved presets/);
    expect(error.fields?.['layout.background']).toMatch(/white/);
  });

  it('names count when How many is cleared to null', () => {
    const error = reject('product_carousel', { heading: 'Featured', count: null });
    expect(error.message).toMatch(/count/);
    expect(error.message).not.toMatch(/approved presets/);
    expect(error.fields?.count).toMatch(/whole number/);
  });

  it('names mediaType when Choose is sent as an empty string', () => {
    const error = reject('hero', { headline: 'Hi', mediaType: '' });
    expect(error.message).toMatch(/mediaType/);
    expect(error.message).not.toMatch(/approved presets/);
    expect(error.fields?.mediaType).toMatch(/image, video/);
  });

  it('names every failing field when more than one is wrong', () => {
    const error = reject('hero', { videoUrl: 'javascript:alert(1)', mediaType: '' });
    expect(error.message).toMatch(/videoUrl/);
    expect(error.message).toMatch(/mediaType/);
  });

  it('prefixes page-create errors with the section index and refuses the write', () => {
    try {
      assertPageSections([
        { type: 'hero', config: { headline: 'Keep' } },
        { type: 'hero', config: { videoUrl: 'javascript:alert(1)' } },
      ]);
      throw new Error('expected the sections to be rejected');
    } catch (error) {
      if (!(error instanceof ApiException)) throw error;
      expect(error.fields?.['sections[1].videoUrl']).toMatch(/https/);
      expect(error.fields?.['sections[0].headline']).toBeUndefined();
    }
  });

  it('refuses to attach sections without section:write', () => {
    expect(() => assertCanAttachSections(['page:write'], 1)).toThrow(ApiException);
    expect(() => assertCanAttachSections(['page:write', 'section:write'], 1)).not.toThrow();
    expect(() => assertCanAttachSections(['page:write'], 0)).not.toThrow();
  });
});
