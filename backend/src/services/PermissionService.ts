import { PrismaClient, PermissionType } from '@prisma/client';
import { MENU_CODE_LIST, isValidMenuCode, MenuCode } from '../constants/menuCodes';

export class PermissionService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Check if user has permission for a menu code
   */
  async hasPermission(
    userId: string,
    menuCode: string,
    permissionType: PermissionType
  ): Promise<boolean> {
    if (!isValidMenuCode(menuCode)) {
      return false;
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                permissions: {
                  where: {
                    menuCode,
                    permissionType
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!user || !user.active) {
      return false;
    }

    // Check if any role has the required permission
    for (const userRole of user.userRoles) {
      if (userRole.role.permissions.length > 0) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get all permissions for a user (aggregated from all roles)
   */
  async getUserPermissions(
    userId: string
  ): Promise<Map<string, PermissionType[]>> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                permissions: true
              }
            }
          }
        }
      }
    });

    const permissionsMap = new Map<string, PermissionType[]>();

    if (!user) {
      return permissionsMap;
    }

    // Aggregate permissions from all roles
    const permissionSet = new Map<string, Set<PermissionType>>();

    for (const userRole of user.userRoles) {
      for (const permission of userRole.role.permissions) {
        if (!permissionSet.has(permission.menuCode)) {
          permissionSet.set(permission.menuCode, new Set());
        }
        permissionSet.get(permission.menuCode)!.add(permission.permissionType);
      }
    }

    // Convert sets to arrays
    for (const [menuCode, types] of permissionSet.entries()) {
      permissionsMap.set(menuCode, Array.from(types));
    }

    return permissionsMap;
  }

  /**
   * Validate menu code exists
   */
  validateMenuCode(menuCode: string): boolean {
    return isValidMenuCode(menuCode);
  }

  /**
   * Get available menu codes
   */
  getAvailableMenuCodes(): MenuCode[] {
    return MENU_CODE_LIST;
  }
}
