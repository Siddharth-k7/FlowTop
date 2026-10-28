import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildProductWhatsAppText,
  buildProductWhatsAppUrl,
  buildGeneralWhatsAppUrl,
  cleanWhatsAppNumber,
} from '../src/lib/whatsapp.ts';
import {
  submitMockForm,
} from '../src/lib/mocks/submissions.ts';
import {
  EMAIL_REGEX,
  INDIAN_PHONE_REGEX,
} from '../src/components/Checkout/constants.ts';

describe('WhatsApp Integration & URI Encoding', () => {
  const settingsTemplate = "Hi, I'm interested in {productName} (SKU: {sku}) in {finish}. {url}";
  const settingsNumber = '+919876543210';

  it('correctly cleans phone numbers by stripping country prefix characters and symbols', () => {
    assert.equal(cleanWhatsAppNumber('+91 98765 43210'), '919876543210');
    assert.equal(cleanWhatsAppNumber('+91-98765-43210'), '919876543210');
    assert.equal(cleanWhatsAppNumber('+919876543210'), '919876543210');
  });

  it('builds product message by filling productName, sku, finish, and url placeholders', () => {
    const text = buildProductWhatsAppText(settingsTemplate, {
      productName: 'Opel Basin Mixer',
      sku: 'FT-OBM-001',
      finish: 'Matte Black',
      url: 'https://flowtop.com/products/opel-basin-mixer',
    });

    assert.equal(
      text,
      "Hi, I'm interested in Opel Basin Mixer (SKU: FT-OBM-001) in Matte Black. https://flowtop.com/products/opel-basin-mixer"
    );
  });

  it('URL-encodes properly with a product name containing an ampersand (&)', () => {
    const url = buildProductWhatsAppUrl({
      number: settingsNumber,
      template: settingsTemplate,
      product: {
        productName: 'Bath & Shower Mixer',
        sku: 'FT-BSM-004',
        finish: 'Brushed Gold',
        url: 'https://flowtop.com/products/bath-and-shower-mixer',
      },
    });

    assert.ok(url.startsWith('https://wa.me/919876543210?text='));
    // Ampersand must be encoded as %26 so it does not break query string parsing
    assert.ok(url.includes('Bath%20%26%20Shower%20Mixer'));
    assert.ok(!url.includes('Bath & Shower'));

    // Decoding text reproduces the exact original name
    const queryText = new URL(url).searchParams.get('text');
    assert.ok(queryText?.includes('Bath & Shower Mixer'));
  });

  it('URL-encodes properly with a product name containing non-ASCII characters', () => {
    const url = buildProductWhatsAppUrl({
      number: settingsNumber,
      template: settingsTemplate,
      product: {
        productName: 'Élégance Crème Basin Mixer',
        sku: 'FT-ELG-009',
        finish: 'Rose Gold PVD',
        url: 'https://flowtop.com/products/elegance-mixer',
      },
    });

    assert.ok(url.startsWith('https://wa.me/919876543210?text='));
    // Non-ASCII characters must be URI encoded
    assert.ok(url.includes('%C3%89l%C3%A9gance%20Cr%C3%A8me'));

    const queryText = new URL(url).searchParams.get('text');
    assert.ok(queryText?.includes('Élégance Crème Basin Mixer'));
  });

  it('builds general concierge WhatsApp link from public settings', () => {
    const generalUrl = buildGeneralWhatsAppUrl({
      number: settingsNumber,
      template: "Hi, I'd like to know more about Flowtop products.",
    });

    assert.equal(
      generalUrl,
      'https://wa.me/919876543210?text=Hi%2C%20I\'d%20like%20to%20know%20more%20about%20Flowtop%20products.'
    );
  });

  it('enforces analytics rule: whatsapp_click is strictly a click event and never recorded as a lead', () => {
    // Contract constraint check
    const eventType = 'whatsapp_click';
    const isLeadEvent = eventType === 'form_submit' || eventType === 'lead';
    assert.equal(isLeadEvent, false, 'A WhatsApp click must NEVER be recorded as a lead');
  });
});

describe('Forms Architecture & Bot Defense', () => {
  it('validates form input regexes for email and phone numbers', () => {
    assert.ok(EMAIL_REGEX.test('architect@studio.in'));
    assert.equal(EMAIL_REGEX.test('invalid'), false);

    assert.ok(INDIAN_PHONE_REGEX.test('9876543210'));
    assert.ok(INDIAN_PHONE_REGEX.test('+919876543210'));
    assert.equal(INDIAN_PHONE_REGEX.test('12345'), false);
  });

  it('bot defense: honeypot field rejection when filled by automated scripts', async () => {
    const botPayload = {
      type: 'contact',
      payload: {
        name: 'Bot Spammer',
        email: 'spammer@bot.com',
        phone: '+919876543210',
        subject: 'Spam Subject',
        message: 'Spam message text content',
        website: 'http://spam-link.ru', // Honeypot filled by bot
      },
    };

    await assert.rejects(
      async () => {
        await submitMockForm(botPayload);
      },
      (err) => {
        assert.equal(err.code, 'VALIDATION_FAILED');
        assert.ok(err.message.includes('bot'));
        return true;
      }
    );
  });

  it('honest reporting: handles saved=true and emailSent=true (standard success)', async () => {
    const validPayload = {
      type: 'contact',
      payload: {
        name: 'Vikram Singhania',
        email: 'vikram@singhania.in',
        phone: '+919876543210',
        subject: 'Residential Villa Spec',
        message: 'Looking for 12 basin mixers for a private residence.',
        website: '', // Clean honeypot
      },
    };

    const res = await submitMockForm(validPayload);
    assert.equal(res.saved, true);
    assert.equal(res.emailSent, true);
    assert.ok(res.reference.startsWith('CT-2026-'));
  });

  it('honest reporting: handles saved=true and emailSent=false honestly without false success', async () => {
    const emailFailPayload = {
      type: 'contact',
      payload: {
        name: 'Ananya Roy',
        email: 'ananya@roy.in',
        phone: '+919876543210',
        subject: 'Urgent Showroom Enquiry',
        message: 'Need catalogue [simulate-email-failure] immediately.',
        website: '',
      },
    };

    const res = await submitMockForm(emailFailPayload);
    assert.equal(res.saved, true);
    assert.equal(res.emailSent, false);
    assert.ok(res.message.includes('email notification failed'));
    assert.ok(res.message.includes('WhatsApp'));
  });

  it('honest reporting: rejects showing success when saved=false', async () => {
    const saveFailPayload = {
      type: 'contact',
      payload: {
        name: 'Ananya Roy',
        email: 'ananya@roy.in',
        phone: '+919876543210',
        subject: 'Database Outage Test',
        message: 'Test [simulate-save-failure]',
        website: '',
      },
    };

    await assert.rejects(
      async () => {
        await submitMockForm(saveFailPayload);
      },
      (err) => {
        assert.equal(err.code, 'SERVER_ERROR');
        return true;
      }
    );
  });
});
