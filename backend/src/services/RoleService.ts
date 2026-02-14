import { PrismaClient, Role, Permission, PermissionType, User } from '@prisma/client';
import { isValidMenuCode } from '../constants/menuCodes';

export interface CreateRoleDTO {
  name: string;
  description: string;
  permissions: PermissionConfigDTO[];
}

export interface UpdateRoleDTO {
  name?: string;
  description?: string;
  permissions?: PermissionConfigDTO[];
}

export interface PermissionConfigDTO {
  menuCode: string;
  permissionType: PermissionType;
}

export interface RoleWithPermissions extends Role {
  permissions: Permission[];
  userCount: number;
}

export class RoleService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Create a new role with permissions
   */
  async createRole(data: CreateRoleDTO): Promise<Role> {
    // Check if role name already exists
    const existingRole = await this.prisma.role.findUnique({
      where: { name: data.name }
    });
    if (existingRole) {
      throw new Error('Role name already exists');
    }

    // Validate permissions
    if (data.permissions.length === 0) {
      throw new Error('Role must have at least one permission');
    }

    this.validatePermissions(data.permissions);

    // Ensure modify permission includes view permission
    const normalizedPermissions = this.normalizePermissions(data.permissions);

    // Create role with permissions
    return await this.prisma.role.create({
      data: {
        name: data.name,
        description: data.description,
        permissions: {
          create: normalizedPermissions.map(p => ({
            menuCode: p.menuCode,
            permissionType: p.permissionType
          }))
        }
      },
      include: {
        permissions: true
      }
    });
  }

  /**
   * Update role information and permissions
   */
  async updateRole(roleId: string, data: UpdateRoleDTO): Promise<Role> {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId }
    });

    if (!role) {
      throw new Error('Role not found');
    }

    // Check if role is system role
    if (role.isSystem && data.name && data.name !== role.name) {
      throw new Error('Cannot rename system role');
    }

    // Check name uniqueness if changing
    if (data.name && data.name !== role.name) {
      const existingRole = await this.prisma.role.findUnique({
        where: { name: data.name }
      });
      if (existingRole) {
        throw new Error('Role name already exists');
      }
    }

    // Update permissions if provided
    if (data.permissions) {
      if (data.permissions.length === 0) {
        throw new Error('Role must have at least one permission');
      }

      this.validatePermissions(data.permissions);
      const normalizedPermissions = this.normalizePermissions(data.permissions);

      // Delete existing permissions
      await this.prisma.permission.deleteMany({
        where: { roleId }
      });

      // Create new permissions
      await this.prisma.permission.createMany({
        data: normalizedPermissions.map(p => ({
          roleId,
          menuCode: p.menuCode,
          permissionType: p.permissionType
        }))
      });
    }

    // Update role fields
    return await this.prisma.role.update({
      where: { id: roleId },
      data: {
        name: data.name,
        description: data.description
      },
      include: {
        permissions: true
      }
    });
  }

  /**
   * Delete a role (only if no users assigned)
   */
  async deleteRole(roleId: string): Promise<void> {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
      include: {
        userRoles: true
      }
    });

    if (!role) {
      throw new Error('Role not found');
    }

    if (role.isSystem) {
      throw new Error('Cannot delete system role');
    }

    if (role.userRoles.length > 0) {
      throw new Error(`Cannot delete role with ${role.userRoles.length} assigned users`);
    }

    await this.prisma.role.delete({
      where: { id: roleId }
    });
  }

  /**
   * Get role with all permissions
   */
  async getRoleWithPermissions(roleId: string): Promise<RoleWithPermissions | null> {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
      include: {
        permissions: true,
        userRoles: true
      }
    });

    if (!role) {
      return null;
    }

    return {
      ...role,
      userCount: role.userRoles.length
    };
  }

  /**
   * List all roles with permission counts
   */
  async listRoles(): Promise<RoleWithPermissions[]> {
    const roles = await this.prisma.role.findMany({
      include: {
        permissions: true,
        userRoles: true
      },
      orderBy: { name: 'asc' }
    });

    return roles.map(role => ({
      ...role,
      userCount: role.userRoles.length
    }));
  }

  /**
   * Configure permissions for a role
   */
  async setPermissions(roleId: string, permissions: PermissionConfigDTO[]): Promise<void> {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId }
    });

    if (!role) {
      throw new Error('Role not found');
    }

    if (permissions.length === 0) {
      throw new Error('Role must have at least one permission');
    }

    this.validatePermissions(permissions);
    const normalizedPermissions = this.normalizePermissions(permissions);

    // Delete existing permissions
    await this.prisma.permission.deleteMany({
      where: { roleId }
    });

    // Create new permissions
    await this.prisma.permission.createMany({
      data: normalizedPermissions.map(p => ({
        roleId,
        menuCode: p.menuCode,
        permissionType: p.permissionType
      }))
    });
  }

  /**
   * Get users with this role
   */
  async getUsersWithRole(roleId: string): Promise<User[]> {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
      include: {
        userRoles: {
          include: {
            user: true
          }
        }
      }
    });

    if (!role) {
      throw new Error('Role not found');
    }

    return role.userRoles.map(ur => ur.user);
  }

  /**
   * Validate permissions
   */
  private validatePermissions(permissions: PermissionConfigDTO[]): void {
    for (const permission of permissions) {
      if (!isValidMenuCode(permission.menuCode)) {
        throw new Error(`Invalid menu code: ${permission.menuCode}`);
      }

      if (
        permission.permissionType !== PermissionType.VIEW &&
        permission.permissionType !== PermissionType.MODIFY
      ) {
        throw new Error(`Invalid permission type: ${permission.permissionType}`);
      }
    }
  }

  /**
   * Normalize permissions to ensure modify implies view
   */
  private normalizePermissions(permissions: PermissionConfigDTO[]): PermissionConfigDTO[] {
    const permissionMap = new Map<string, Set<PermissionType>>();

    for (const permission of permissions) {
      if (!permissionMap.has(permission.menuCode)) {
        permissionMap.set(permission.menuCode, new Set());
      }
      permissionMap.get(permission.menuCode)!.add(permission.permissionType);

      // If MODIFY permission, also add VIEW
      if (permission.permissionType === PermissionType.MODIFY) {
        permissionMap.get(permission.menuCode)!.add(PermissionType.VIEW);
      }
    }

    const normalized: PermissionConfigDTO[] = [];
    for (const [menuCode, types] of permissionMap.entries()) {
      for (const permissionType of types) {
        normalized.push({ menuCode, permissionType });
      }
    }

    return normalized;
  }
}
