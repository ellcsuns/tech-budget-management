import { PrismaClient, PermissionType } from '@prisma/client';
import { MENU_CODE_LIST } from './constants/menuCodes';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Actualizando permisos del rol Administrador...');

  // Find admin role
  const adminRole = await prisma.role.findUnique({
    where: { name: 'Administrador' },
    include: { permissions: true }
  });

  if (!adminRole) {
    console.log('❌ Rol Administrador no encontrado');
    return;
  }

  console.log(`📋 Rol encontrado: ${adminRole.name}`);
  console.log(`   Permisos actuales: ${adminRole.permissions.length}`);

  // Delete all existing permissions
  await prisma.permission.deleteMany({
    where: { roleId: adminRole.id }
  });

  console.log('🗑️  Permisos antiguos eliminados');

  // Create all permissions for all menu codes
  const allPermissions: { roleId: string; menuCode: string; permissionType: PermissionType }[] = MENU_CODE_LIST.flatMap(menuCode => [
    { roleId: adminRole.id, menuCode, permissionType: PermissionType.VIEW },
    { roleId: adminRole.id, menuCode, permissionType: PermissionType.MODIFY }
  ]);

  // Admin also gets APPROVE_BUDGET on approvals
  allPermissions.push({ roleId: adminRole.id, menuCode: 'approvals', permissionType: PermissionType.APPROVE_BUDGET });

  await prisma.permission.createMany({
    data: allPermissions
  });

  console.log(`✅ ${allPermissions.length} permisos creados`);
  console.log('   Códigos de menú incluidos:');
  MENU_CODE_LIST.forEach(code => console.log(`   - ${code}`));
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
