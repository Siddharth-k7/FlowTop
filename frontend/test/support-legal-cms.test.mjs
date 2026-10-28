import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import { mockSupportData } from '../src/lib/mocks/support.ts';
import { mockPages } from '../src/lib/mocks/pages.ts';
import { isReservedSlug } from '../src/lib/reserved-slugs.ts';
import { isConsentDeclined, trackEvent, setAnalyticsTransport } from '../src/lib/analytics.ts';

describe('Support Page Architecture & CMS FAQ Contract', () => {
  test('support mock provides categorised FAQs', () => {
    assert.ok(mockSupportData.categories.length >= 4, 'Expect at least 4 FAQ categories');
    assert.ok(mockSupportData.faqs.length >= 8, 'Expect at least 8 FAQs');

    for (const faq of mockSupportData.faqs) {
      assert.ok(faq.id, 'FAQ must have id');
      assert.ok(faq.question, 'FAQ must have question');
      assert.ok(faq.answer, 'FAQ must have answer');
      assert.ok(mockSupportData.categories.includes(faq.category) || faq.category, 'FAQ category must be declared');
    }
  });

  test('downloadable care manuals are grouped by product type', () => {
    assert.ok(mockSupportData.manualProductTypes.length >= 3, 'Expect at least 3 product types');
    assert.ok(mockSupportData.manuals.length >= 6, 'Expect at least 6 manuals');

    for (const manual of mockSupportData.manuals) {
      assert.ok(manual.title, 'Manual must have title');
      assert.equal(manual.fileType, 'PDF', 'Manuals should be PDF');
      assert.ok(manual.fileSize, 'Manual must state fileSize');
      assert.ok(manual.downloadUrl.endsWith('.pdf'), 'downloadUrl must point to a PDF');
      assert.ok(mockSupportData.manualProductTypes.includes(manual.productType), 'manual productType must match grouped category');
    }
  });

  test('warranty notice explicitly declares coming soon registration and active coverage', () => {
    const notice = mockSupportData.warrantyNotice;
    assert.equal(notice.standardDurationYears, 10, 'Standard duration must be 10 years');
    assert.ok(notice.comingSoonMessage.toLowerCase().includes('coming soon'), 'Must mention registration portal is coming soon');
    assert.ok(notice.description.toLowerCase().includes('10-year'), 'Must describe active warranty coverage');
  });
});

describe('CMS Page Builder: About, Manufacturing & Quality', () => {
  test('About, Manufacturing and Quality are CMS pages using section builder', () => {
    const requiredCmsPages = ['about', 'manufacturing', 'quality'];

    for (const slug of requiredCmsPages) {
      const page = mockPages[slug];
      assert.ok(page, `CMS page for ${slug} must exist`);
      assert.equal(page.status, 'published', `${slug} must be published`);
      assert.ok(page.sections && page.sections.length >= 3, `${slug} must contain at least 3 sections`);

      // Verify sections conform to supported CMS section types
      const types = page.sections.map((s) => s.type);
      assert.ok(types.includes('hero'), `${slug} must have a hero section`);
      assert.ok(types.includes('image_text'), `${slug} must have an image_text section`);
      assert.ok(types.includes('cta'), `${slug} must have a cta section`);
    }
  });

  test('reserved slug routing invariants', () => {
    assert.equal(isReservedSlug('about'), false, '/about must NOT be reserved so CMS [slug] can serve it');
    assert.equal(isReservedSlug('manufacturing'), false, '/manufacturing must NOT be reserved');
    assert.equal(isReservedSlug('quality'), false, '/quality must NOT be reserved');
    assert.equal(isReservedSlug('support'), true, '/support must be reserved for the dedicated Next.js support route');
  });
});

describe('CMS Legal Pages: Privacy, Terms, Shipping & Refunds', () => {
  const legalSlugs = ['privacy', 'terms', 'shipping', 'refunds'];

  test('legal pages are CMS-editable with template: legal', () => {
    for (const slug of legalSlugs) {
      const page = mockPages[slug];
      assert.ok(page, `Legal page for ${slug} must exist`);
      assert.equal(page.template, 'legal', `${slug} must declare template: legal`);
      assert.equal(page.status, 'published', `${slug} must be published`);
      assert.ok(page.content && page.content.length > 200, `${slug} must have rich policy content`);
      assert.ok(page.seo?.canonical?.includes(slug), `${slug} must declare canonical`);
    }
  });

  test('privacy policy addresses India DPDP Act 2023 and Data Principal rights', () => {
    const privacy = mockPages.privacy;
    assert.ok(privacy.content?.includes('Digital Personal Data Protection Act, 2023'), 'Must reference DPDP Act 2023');
    assert.ok(privacy.content?.includes('Data Principal'), 'Must describe Data Principal rights');
    assert.ok(privacy.content?.includes('Grievance Officer') || privacy.content?.includes('Data Protection Officer'), 'Must designate Grievance / DPO');
  });
});

describe('Cookie Consent Banner & DPDP Act Analytics Integration', () => {
  test('analytics suppresses event dispatch when cookie consent is declined', () => {
    let dispatched = false;
    setAnalyticsTransport(() => {
      dispatched = true;
    });

    // Mock global window and localStorage
    const originalWindow = global.window;
    global.window = {
      localStorage: {
        getItem: (key) => (key === 'flowtop_cookie_consent' ? 'declined' : null),
        setItem: () => {},
        removeItem: () => {},
      },
    };

    assert.equal(isConsentDeclined(), true, 'isConsentDeclined must return true when localStorage is declined');

    trackEvent('page_view', { path: '/collections' });
    assert.equal(dispatched, false, 'trackEvent must NOT dispatch network event when consent is declined');

    // Restore window
    global.window = originalWindow;
    setAnalyticsTransport(null);
  });
});
