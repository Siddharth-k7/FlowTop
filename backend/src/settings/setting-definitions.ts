/**
 * Every setting that exists, with how to validate it. A key that is not here
 * cannot be stored or read through the API, which is what keeps secrets out
 * of this table: API keys and passwords live in environment config, never in
 * settings an admin can see.
 *
 * Values are read from the database on every use, so changing one never needs
 * a deploy. That is the point of this module.
 */

type Parsed<T> = { ok: true; value: T } | { ok: false; message: string };

interface SettingDefinition<T> {
  description: string;
  /** True only for keys the public website may read through GET /settings/public. */
  public: boolean;
  /** Seeded when the key is missing. Never overwrites a value an admin has set. */
  seed: T;
  parse(input: unknown): Parsed<T>;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_RECIPIENTS = 10;

const text = (max: number) => (input: unknown): Parsed<string> => {
  if (typeof input !== 'string' || input.trim().length === 0) {
    return { ok: false, message: 'Enter some text.' };
  }
  return input.trim().length > max ? { ok: false, message: `Use at most ${max} characters.` } : { ok: true, value: input.trim() };
};

const email = (input: unknown): Parsed<string> => {
  const value = typeof input === 'string' ? input.trim().toLowerCase() : '';
  return EMAIL.test(value) && value.length <= 254 ? { ok: true, value } : { ok: false, message: 'Enter a valid email address.' };
};

/** One or more addresses, lowercased and de-duplicated. Never empty: an empty list means emails go nowhere. */
const emailList = (input: unknown): Parsed<string[]> => {
  if (!Array.isArray(input) || input.length === 0) {
    return { ok: false, message: 'Add at least one email address.' };
  }
  const addresses: string[] = [];
  for (const item of input) {
    const parsed = email(item);
    if (!parsed.ok) {
      return { ok: false, message: `"${String(item)}" is not a valid email address.` };
    }
    addresses.push(parsed.value);
  }
  const unique = [...new Set(addresses)];
  return unique.length > MAX_RECIPIENTS
    ? { ok: false, message: `Use at most ${MAX_RECIPIENTS} addresses.` }
    : { ok: true, value: unique };
};

/**
 * International format, stored as + and digits only, which is what WhatsApp
 * links need. Spaces and dashes are accepted on input. Null hides WhatsApp.
 */
const whatsappNumber = (input: unknown): Parsed<string | null> => {
  if (input === null) {
    return { ok: true, value: null };
  }
  const value = typeof input === 'string' ? input.replace(/[\s()-]/g, '') : '';
  return /^\+[1-9]\d{7,14}$/.test(value)
    ? { ok: true, value }
    : { ok: false, message: 'Enter the number in international format, for example +91 98765 43210.' };
};

/** Free text whose only {placeholders} are the ones the website knows how to fill. */
const template = (max: number, placeholders: readonly string[]) => (input: unknown): Parsed<string> => {
  const parsed = text(max)(input);
  if (!parsed.ok) {
    return parsed;
  }
  const unknown = [...parsed.value.matchAll(/\{([^{}]*)\}/g)].map((match) => match[1]).filter((name) => !placeholders.includes(name));
  if (unknown.length > 0) {
    const allowed = placeholders.length ? placeholders.map((name) => `{${name}}`).join(', ') : 'none';
    return { ok: false, message: `Unknown placeholder {${unknown[0]}}. Allowed: ${allowed}.` };
  }
  return parsed;
};

const define = <T>(definition: SettingDefinition<T>) => definition;

export const SETTING_DEFINITIONS = {
  'email.senderName': define({
    description: 'The name customers see as the sender of every email',
    public: false,
    seed: 'Flowtop',
    parse: text(100),
  }),
  'email.senderAddress': define<string | null>({
    description: 'The address every email is sent from. Must be on the verified sending domain.',
    public: false,
    seed: null,
    parse: email,
  }),
  'email.recipients.orders': define<string[]>({
    description: 'Who is notified of every new online order',
    public: false,
    seed: [],
    parse: emailList,
  }),
  'email.recipients.contact': define<string[]>({
    description: 'Who receives contact form enquiries',
    public: false,
    seed: [],
    parse: emailList,
  }),
  'email.recipients.dealer': define<string[]>({
    description: 'Who receives dealer enquiries',
    public: false,
    seed: [],
    parse: emailList,
  }),
  'whatsapp.number': define<string | null>({
    description: 'The WhatsApp number every button on the website opens. Empty hides WhatsApp.',
    public: true,
    seed: null,
    parse: whatsappNumber,
  }),
  'whatsapp.generalTemplate': define({
    description: 'The message pre-filled by the site-wide WhatsApp button',
    public: true,
    seed: "Hi, I'd like to know more about Flowtop products.",
    parse: template(500, []),
  }),
  'whatsapp.productTemplate': define({
    description: 'The message pre-filled on a product page',
    public: true,
    seed: "Hi, I'm interested in {productName} (SKU: {sku}) in {finish}. {url}",
    parse: template(500, ['productName', 'sku', 'finish', 'url']),
  }),
};

export type SettingKey = keyof typeof SETTING_DEFINITIONS;

export type SettingValue<K extends SettingKey> = (typeof SETTING_DEFINITIONS)[K]['seed'];

export const SETTING_KEYS = Object.keys(SETTING_DEFINITIONS) as SettingKey[];

/** Every key with its seed value, for prisma/seed.ts. */
export const SETTING_SEEDS: Record<SettingKey, unknown> = Object.fromEntries(
  SETTING_KEYS.map((key) => [key, SETTING_DEFINITIONS[key].seed]),
) as Record<SettingKey, unknown>;

export function isSettingKey(key: string): key is SettingKey {
  return Object.prototype.hasOwnProperty.call(SETTING_DEFINITIONS, key);
}
