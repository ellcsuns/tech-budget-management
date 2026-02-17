import { PrismaClient, User, Role, PermissionType } from '@prisma/client';
import { PasswordService } from './PasswordService';

export interface CreateUserDTO {
  username: string;
  password: string;
  email: string;
  fullName: string;
  roleIds: string[];
  technologyDirectionId?: string;
}

export interface UpdateUserDTO {
  email?: string;
  fullName?: string;
  roleIds?: string[];
  technologyDirectionId?: string | null;
}

export interface UserFilters {
  search?: string;
  status?: 'active' | 'inactive';
  roleId?: string;
  page: number;
  pageSize: number;
}

export interface UserWithPermissions extends User {
  roles: Role[];
  permissions: Array<{ menuCode: string; permissionType: PermissionType }>;
}

export interface PaginatedUsers {
  users: Array<User & { roles: Role[] }>;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export class UserService {
  constructor(
    private prisma: PrismaClient,
    private passwordService: PasswordService
  ) {}

  /**
   * Create a new user with roles
   */
  async createUser(data: CreateUserDTO): Promise<User> {
    // Validate password strength
    const validation = this.passwordService.validatePasswordStrength(data.password);
    if (!validation.valid) {
      throw new Error(validation.errors.join(', '));
    }

    // Check if username already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { username: data.username }
    });
    if (existingUser) {
      throw new Error('Username already exists');
    }

    // Check if email already exists
    const existingEmail = await this.prisma.user.findUnique({
      where: { email: data.email }
    });
    if (existingEmail) {
      throw new Error('Email already exists');
    }

    // Validate roles exist
    if (data.roleIds.length === 0) {
      throw new Error('At least one role must be assigned');
    }

    const roles = await this.prisma.role.findMany({
      where: { id: { in: data.roleIds } }
    });
    if (roles.length !== data.roleIds.length) {
      throw new Error('One or more roles not found');
    }

    // Hash password
    const passwordHash = await this.passwordService.hashPassword(data.password);

    // Create user with roles
    const user = await this.prisma.user.create({
      data: {
        username: data.username,
        passwordHash,
        email: data.email,
        fullName: data.fullName,
        technologyDirectionId: data.technologyDirectionId,
        userRoles: {
          create: data.roleIds.map(roleId => ({ roleId }))
        }
      },
      include: {
        userRoles: {
          include: {
            role: true
          }
        }
      }
    });

    return user;
  }

  /**
   * Update user information (except username)
   */
  async updateUser(userId: string, data: UpdateUserDTO): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Check email uniqueness if changing
    if (data.email && data.email !== user.email) {
      const existingEmail = await this.prisma.user.findUnique({
        where: { email: data.email }
      });
      if (existingEmail) {
        throw new Error('Email already exists');
      }
    }

    // Update roles if provided
    if (data.roleIds) {
      if (data.roleIds.length === 0) {
        throw new Error('At least one role must be assigned');
      }

      const roles = await this.prisma.role.findMany({
        where: { id: { in: data.roleIds } }
      });
      if (roles.length !== data.roleIds.length) {
        throw new Error('One or more roles not found');
      }

      // Delete existing role assignments
      await this.prisma.userRole.deleteMany({
        where: { userId }
      });

      // Create new role assignments
      await this.prisma.userRole.createMany({
        data: data.roleIds.map(roleId => ({ userId, roleId }))
      });
    }

    // Update user fields
    return await this.prisma.user.update({
      where: { id: userId },
      data: {
        email: data.email,
        fullName: data.fullName,
        technologyDirectionId: data.technologyDirectionId,
      },
      include: {
        userRoles: {
          include: {
            role: true
          }
        }
      }
    });
  }

  /**
   * Activate or deactivate a user
   */
  async setUserStatus(userId: string, active: boolean): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    return await this.prisma.user.update({
      where: { id: userId },
      data: { active }
    });
  }

  /**
   * Assign roles to a user
   */
  async assignRoles(userId: string, roleIds: string[]): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (roleIds.length === 0) {
      throw new Error('At least one role must be assigned');
    }

    const roles = await this.prisma.role.findMany({
      where: { id: { in: roleIds } }
    });
    if (roles.length !== roleIds.length) {
      throw new Error('One or more roles not found');
    }

    // Delete existing role assignments
    await this.prisma.userRole.deleteMany({
      where: { userId }
    });

    // Create new role assignments
    await this.prisma.userRole.createMany({
      data: roleIds.map(roleId => ({ userId, roleId }))
    });
  }

  /**
   * Get user with roles and permissions
   */
  async getUserWithPermissions(userId: string): Promise<UserWithPermissions | null> {
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

    if (!user) {
      return null;
    }

    // Aggregate permissions from all roles
    const permissionsMap = new Map<string, Set<PermissionType>>();
    
    for (const userRole of user.userRoles) {
      for (const permission of userRole.role.permissions) {
        if (!permissionsMap.has(permission.menuCode)) {
          permissionsMap.set(permission.menuCode, new Set());
        }
        permissionsMap.get(permission.menuCode)!.add(permission.permissionType);
      }
    }

    const permissions = Array.from(permissionsMap.entries()).flatMap(([menuCode, types]) =>
      Array.from(types).map(permissionType => ({ menuCode, permissionType }))
    );

    const roles = user.userRoles.map(ur => ur.role);

    return {
      ...user,
      roles,
      permissions
    };
  }

  /**
   * List users with pagination and filters
   */
  async listUsers(filters: UserFilters): Promise<PaginatedUsers> {
    const where: any = {};

    if (filters.search) {
      where.OR = [
        { username: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { fullName: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    if (filters.status) {
      where.active = filters.status === 'active';
    }

    if (filters.roleId) {
      where.userRoles = {
        some: {
          roleId: filters.roleId
        }
      };
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: {
          userRoles: {
            include: {
              role: true
            }
          }
        },
        skip: (filters.page - 1) * filters.pageSize,
        take: filters.pageSize,
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.user.count({ where })
    ]);

    const usersWithRoles = users.map(user => ({
      ...user,
      roles: user.userRoles.map(ur => ur.role)
    }));

    return {
      users: usersWithRoles,
      total,
      page: filters.page,
      pageSize: filters.pageSize,
      totalPages: Math.ceil(total / filters.pageSize)
    };
  }

  /**
   * Change user password
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isValid = await this.passwordService.verifyPassword(
      currentPassword,
      user.passwordHash
    );
    if (!isValid) {
      throw new Error('Current password is incorrect');
    }

    // Validate new password strength
    const validation = this.passwordService.validatePasswordStrength(newPassword);
    if (!validation.valid) {
      throw new Error(validation.errors.join(', '));
    }

    // Hash and update password
    const passwordHash = await this.passwordService.hashPassword(newPassword);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash }
    });
  }

  /**
   * Get user by username
   */
  async getUserByUsername(username: string): Promise<User | null> {
    return await this.prisma.user.findUnique({
      where: { username }
    });
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<User | null> {
    return await this.prisma.user.findUnique({
      where: { id: userId }
    });
  }
}
