import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { Prisma } from '../generated/prisma/client';

const SETTING_SELECT = {
  key: true,
  value: true,
  updatedAt: true,
  updater: { select: { id: true, name: true } },
} satisfies Prisma.SettingSelect;

export type SettingRow = Prisma.SettingGetPayload<{ select: typeof SETTING_SELECT }>;

/** JSON null has to be written as Prisma.JsonNull: a plain null means "no value" to Prisma. */
function toJson(value: unknown): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  return value === null ? Prisma.JsonNull : (value as Prisma.InputJsonValue);
}

@Injectable()
export class SettingsRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Only the requested keys, so a stray row in the table is never read out. */
  findByKeys(keys: readonly string[]): Promise<SettingRow[]> {
    return this.prisma.setting.findMany({ where: { key: { in: [...keys] } }, select: SETTING_SELECT });
  }

  async save(key: string, value: unknown, updatedBy: string, tx: Prisma.TransactionClient): Promise<SettingRow> {
    return tx.setting.upsert({
      where: { key },
      create: { key, value: toJson(value), updatedBy },
      update: { value: toJson(value), updatedBy },
      select: SETTING_SELECT,
    });
  }
}

/**
 * Inserts any setting that is missing, with its seed value. Never touches an
 * existing row, so re-seeding cannot undo a change an admin made.
 * Used by prisma/seed.ts and by the e2e tests.
 */
export async function seedMissingSettings(
  prisma: Pick<Prisma.TransactionClient, 'setting'>,
  defaults: Record<string, unknown>,
): Promise<number> {
  const { count } = await prisma.setting.createMany({
    data: Object.entries(defaults).map(([key, value]) => ({ key, value: toJson(value) })),
    skipDuplicates: true,
  });
  return count;
}
