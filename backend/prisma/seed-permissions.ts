import { ALL_PERMISSIONS, PERMISSION_DEFINITIONS, ROLE_PERMISSIONS, ROLES } from '../src/auth/permissions';
import { PrismaClient } from '../src/generated/prisma/client';

/**
 * Makes the permission and role tables match src/auth/permissions.ts: adds,
 * updates and removes. Used by prisma/seed.ts and by the e2e tests.
 */
export async function syncPermissionsAndRoles(prisma: PrismaClient, log: (line: string) => void = () => {}): Promise<void> {
  await prisma.$transaction(async (tx) => {
    for (const { key, description } of PERMISSION_DEFINITIONS) {
      await tx.permission.upsert({ where: { key }, create: { key, description }, update: { description } });
    }
    const removed = await tx.permission.deleteMany({ where: { key: { notIn: [...ALL_PERMISSIONS] } } });

    for (const name of ROLES) {
      const role = await tx.role.upsert({ where: { name }, create: { name }, update: {} });
      const keys = [...ROLE_PERMISSIONS[name]];
      const permissions = await tx.permission.findMany({ where: { key: { in: keys } }, select: { id: true } });

      await tx.rolePermission.deleteMany({ where: { roleId: role.id, permission: { key: { notIn: keys } } } });
      await tx.rolePermission.createMany({
        data: permissions.map(({ id }) => ({ roleId: role.id, permissionId: id })),
        skipDuplicates: true,
      });
      log(`  role ${name}: ${keys.length} permissions`);
    }

    log(`  ${PERMISSION_DEFINITIONS.length} permissions in sync, ${removed.count} obsolete removed`);
  });
}
