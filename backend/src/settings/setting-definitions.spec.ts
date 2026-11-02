import { isSettingKey, SETTING_DEFINITIONS, SETTING_KEYS } from './setting-definitions';

const parse = (key: keyof typeof SETTING_DEFINITIONS, input: unknown) => SETTING_DEFINITIONS[key].parse(input);

describe('setting definitions', () => {
  it('defines exactly the eight agreed keys, and only the WhatsApp ones are public', () => {
    expect(SETTING_KEYS).toEqual([
      'email.senderName',
      'email.senderAddress',
      'email.recipients.orders',
      'email.recipients.contact',
      'email.recipients.dealer',
      'whatsapp.number',
      'whatsapp.generalTemplate',
      'whatsapp.productTemplate',
    ]);
    expect(SETTING_KEYS.filter((key) => SETTING_DEFINITIONS[key].public)).toEqual([
      'whatsapp.number',
      'whatsapp.generalTemplate',
      'whatsapp.productTemplate',
    ]);
  });

  it('has no key that could hold a secret, and rejects any unknown key', () => {
    for (const key of SETTING_KEYS) {
      expect(key).not.toMatch(/password|secret|token|api.?key|credential/i);
    }
    expect(isSettingKey('smtp.password')).toBe(false);
    expect(isSettingKey('__proto__')).toBe(false);
  });

  it('lowercases, trims and de-duplicates recipient lists, and refuses an empty one', () => {
    expect(parse('email.recipients.orders', [' Orders@Flowtop.in ', 'orders@flowtop.in', 'ops@flowtop.in'])).toEqual({
      ok: true,
      value: ['orders@flowtop.in', 'ops@flowtop.in'],
    });
    expect(parse('email.recipients.orders', [])).toMatchObject({ ok: false });
    expect(parse('email.recipients.orders', ['not-an-email'])).toMatchObject({ ok: false, message: '"not-an-email" is not a valid email address.' });
    expect(parse('email.recipients.orders', 'orders@flowtop.in')).toMatchObject({ ok: false });
  });

  it('stores the WhatsApp number as + and digits, accepts null to hide it, and refuses a local number', () => {
    expect(parse('whatsapp.number', '+91 98765-43210')).toEqual({ ok: true, value: '+919876543210' });
    expect(parse('whatsapp.number', null)).toEqual({ ok: true, value: null });
    expect(parse('whatsapp.number', '09876543210')).toMatchObject({ ok: false });
  });

  it('allows only the placeholders the website fills', () => {
    expect(parse('whatsapp.productTemplate', 'About {productName} in {finish}: {url}')).toMatchObject({ ok: true });
    expect(parse('whatsapp.productTemplate', 'Price is {price}')).toEqual({
      ok: false,
      message: 'Unknown placeholder {price}. Allowed: {productName}, {sku}, {finish}, {url}.',
    });
    expect(parse('whatsapp.generalTemplate', 'Hi {productName}')).toMatchObject({ ok: false });
  });

  it('refuses empty or overlong text', () => {
    expect(parse('email.senderName', '   ')).toMatchObject({ ok: false });
    expect(parse('email.senderName', 'x'.repeat(101))).toMatchObject({ ok: false });
    expect(parse('email.senderName', ' Flowtop ')).toEqual({ ok: true, value: 'Flowtop' });
  });

  it('seeds values that are themselves acceptable or deliberately unset', () => {
    expect(parse('whatsapp.generalTemplate', SETTING_DEFINITIONS['whatsapp.generalTemplate'].seed)).toMatchObject({ ok: true });
    expect(parse('whatsapp.productTemplate', SETTING_DEFINITIONS['whatsapp.productTemplate'].seed)).toMatchObject({ ok: true });
    expect(SETTING_DEFINITIONS['whatsapp.number'].seed).toBeNull();
    expect(SETTING_DEFINITIONS['email.recipients.orders'].seed).toEqual([]);
  });
});
