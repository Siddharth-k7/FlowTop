import type {
  CollectionShowcaseSectionConfig,
  CtaSectionConfig,
  GallerySectionConfig,
  HeroSectionConfig,
  ImageTextSectionConfig,
  ProductCarouselSectionConfig,
  SectionButtonConfig,
  SectionLayoutConfig,
  SectionUrlField,
} from '../../../shared/types/src/index';
import { SECTION_FIELDS } from './section-schema';

type Expect<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

type _hero = Expect<Equal<keyof HeroSectionConfig, (typeof SECTION_FIELDS.hero)[number]>>;
type _carousel = Expect<Equal<keyof ProductCarouselSectionConfig, (typeof SECTION_FIELDS.product_carousel)[number]>>;
type _showcase = Expect<Equal<keyof CollectionShowcaseSectionConfig, (typeof SECTION_FIELDS.collection_showcase)[number]>>;
type _imageText = Expect<Equal<keyof ImageTextSectionConfig, (typeof SECTION_FIELDS.image_text)[number]>>;
type _gallery = Expect<Equal<keyof GallerySectionConfig, (typeof SECTION_FIELDS.gallery)[number]>>;
type _cta = Expect<Equal<keyof CtaSectionConfig, (typeof SECTION_FIELDS.cta)[number]>>;
type _button = Expect<Equal<keyof SectionButtonConfig, 'label' | 'href' | 'style'>>;
type _layout = Expect<Equal<keyof SectionLayoutConfig, 'background' | 'spacingTop' | 'spacingBottom' | 'width' | 'align'>>;
type _url = Expect<Equal<SectionUrlField, 'href' | 'videoUrl' | 'viewAllHref'>>;

const checks: [_hero, _carousel, _showcase, _imageText, _gallery, _cta, _button, _layout, _url] = [true, true, true, true, true, true, true, true, true];

describe('section schema matches @flowtop/types', () => {
  it('uses the shared section field names', () => {
    expect(checks.every(Boolean)).toBe(true);
    expect(SECTION_FIELDS.hero).toContain('videoUrl');
    expect(SECTION_FIELDS.product_carousel).toContain('viewAllHref');
    expect(SECTION_FIELDS.cta).not.toContain('link');
  });
});
