import { Injectable } from '@nestjs/common';
import { AuditService } from '../audit';
import { ApiException } from '../common/errors/api.exception';
import { PrismaService } from '../common/prisma/prisma.service';
import { Prisma } from '../generated/prisma/client';
import { PublicSettings, SettingItem } from './dto/settings.dto';
import { isSettingKey, SETTING_DEFINITIONS, SETTING_KEYS, SettingKey, SettingValue } from './setting-definitions';
import { SettingRow, SettingsRepository } from './settings.repository';

const PUBLIC_KEYS = ['whatsapp.number', 'whatsapp.generalTemplate', 'whatsapp.productTemplate'] as const;

@Injectable()
export class SettingsService {
  constructor(
    private readonly repository: SettingsRepository,
    private readonly audit: AuditService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * The current value, read from the database every time, so a change from
   * the admin applies on the next call with no deploy. For other modules,
   * such as email routing.
   */
  async get<K extends SettingKey>(key: K): Promise<SettingValue<K>> {
    const [row] = await this.repository.findByKeys([key]);
    return (row ? row.value : SETTING_DEFINITIONS[key].seed) as SettingValue<K>;
  }

  /** Built field by field from the WhatsApp keys only: nothing else can reach the public site. */
  async getPublic(): Promise<PublicSettings> {
    const values = await this.valuesOf(PUBLIC_KEYS);
    return {
      whatsapp: {
        number: values['whatsapp.number'] as string | null,
        generalTemplate: values['whatsapp.generalTemplate'] as string,
        productTemplate: values['whatsapp.productTemplate'] as string,
      },
    };
  }

  async list(): Promise<SettingItem[]> {
    const rows = new Map((await this.repository.findByKeys(SETTING_KEYS)).map((row) => [row.key, row]));
    return SETTING_KEYS.map((key) => toItem(key, rows.get(key)));
  }

  /** Validates against the key's own rules, saves, and audits the change with its before and after. */
  async update(key: string, input: unknown, actorId: string): Promise<SettingItem> {
    if (!isSettingKey(key)) {
      throw new ApiException('VALIDATION_FAILED', 'There is no setting with that key.', { key: 'There is no setting with that key.' });
    }
    const parsed = SETTING_DEFINITIONS[key].parse(input) as { ok: true; value: unknown } | { ok: false; message: string };
    if (!parsed.ok) {
      throw new ApiException('VALIDATION_FAILED', parsed.message, { value: parsed.message });
    }
    const before = await this.get(key);

    const row = await this.prisma.$transaction(async (tx) => {
      const saved = await this.repository.save(key, parsed.value, actorId, tx);
      await this.audit.record(
        {
          actorId,
          action: 'settings_change',
          entityType: 'setting',
          entityId: key,
          // Settings hold no secrets (see setting-definitions.ts), so before and after are safe to log.
          metadata: { from: before as Prisma.InputJsonValue | null, to: parsed.value as Prisma.InputJsonValue | null },
        },
        tx,
      );
      return saved;
    });
    return toItem(key, row);
  }

  private async valuesOf(keys: readonly SettingKey[]): Promise<Record<string, unknown>> {
    const rows = new Map((await this.repository.findByKeys(keys)).map((row) => [row.key, row.value]));
    return Object.fromEntries(keys.map((key) => [key, rows.has(key) ? rows.get(key) : SETTING_DEFINITIONS[key].seed]));
  }
}

function toItem(key: SettingKey, row: SettingRow | undefined): SettingItem {
  const definition = SETTING_DEFINITIONS[key];
  return {
    key,
    value: row ? row.value : definition.seed,
    description: definition.description,
    public: definition.public,
    updatedBy: row?.updater ?? null,
    updatedAt: row?.updater ? row.updatedAt.toISOString() : null,
  };
}
