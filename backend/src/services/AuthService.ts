import { PrismaClient, User, PermissionType } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { PasswordService } from './PasswordService';
import { UserService } from './UserService';
import { RoleService } from './RoleService';
import { MENU_CODE_LIST } from '../constants/menuCodes';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '24h';

export interface LoginResult {
  token: string;
  user: {
    id: string;
    username: string;
    email: string;
    fullName: string;
  };
  permissions: Array<{ menuCode: string; permissionType: PermissionType }>;
  expiresAt: Date;
}

export interface UserSession {
  userId: string;
  username: string;
  roles: string[];
  permissions: Map<string, PermissionType[]>;
}

export interface JWTPayload {
  userId: string;
  username: string;
  iat: number;
  exp: number;
}

export class AuthService {
  constructor(
    private prisma: PrismaClient,
    private passwordService: PasswordService,
    private userService: UserService,
    private roleService: RoleService
  ) {}

  /**
   * Authenticate user and generate JWT token
   */
  async login(username: string, password: string): Promise<LoginResult> {
    // Find user by username
    const user = await this.prisma.user.findUnique({
      where: { username },
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
      throw new Error('Invalid credentials');
    }

    // Check if user is active
    if (!user.active) {
      throw new Error('User account is inactive');
    }

    // Verify password
    const isValidPassword = await this.passwordService.verifyPassword(
      password,
      user.passwordHash
    );

    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

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

    // Generate JWT token
    // @ts-ignore - JWT_SECRET and JWT_EXPIRATION are guaranteed to be strings
    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRATION }
    );

    // Calculate expiration date
    const decoded = jwt.decode(token) as JWTPayload;
    const expiresAt = new Date(decoded.exp * 1000);

    // Store session
    await this.prisma.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt
      }
    });

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName
      },
      permissions,
      expiresAt
    };
  }

  /**
   * Validate JWT token and return user session
   */
  async validateToken(token: string): Promise<UserSession> {
    try {
      // Verify JWT signature and expiration
      const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;

      // Check if session exists and is not expired
      const session = await this.prisma.session.findUnique({
        where: { token },
        include: {
          user: {
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
          }
        }
      });

      if (!session) {
        throw new Error('Session not found');
      }

      if (session.expiresAt < new Date()) {
        throw new Error('Session expired');
      }

      if (!session.user.active) {
        throw new Error('User account is inactive');
      }

      // Aggregate permissions
      const permissionsMap = new Map<string, PermissionType[]>();
      const permissionSet = new Map<string, Set<PermissionType>>();

      for (const userRole of session.user.userRoles) {
        for (const permission of userRole.role.permissions) {
          if (!permissionSet.has(permission.menuCode)) {
            permissionSet.set(permission.menuCode, new Set());
          }
          permissionSet.get(permission.menuCode)!.add(permission.permissionType);
        }
      }

      for (const [menuCode, types] of permissionSet.entries()) {
        permissionsMap.set(menuCode, Array.from(types));
      }

      const roles = session.user.userRoles.map(ur => ur.role.name);

      return {
        userId: session.user.id,
        username: session.user.username,
        roles,
        permissions: permissionsMap
      };
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  /**
   * Invalidate session (logout)
   */
  async logout(token: string): Promise<void> {
    await this.prisma.session.delete({
      where: { token }
    }).catch(() => {
      // Ignore if session doesn't exist
    });
  }

  /**
   * Refresh token before expiration
   */
  async refreshToken(token: string): Promise<string> {
    const session = await this.validateToken(token);

    // Generate new token
    // @ts-ignore - JWT_SECRET and JWT_EXPIRATION are guaranteed to be strings
    const newToken = jwt.sign(
      {
        userId: session.userId,
        username: session.username
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRATION }
    );

    // Calculate expiration date
    const decoded = jwt.decode(newToken) as JWTPayload;
    const expiresAt = new Date(decoded.exp * 1000);

    // Delete old session
    await this.prisma.session.delete({
      where: { token }
    }).catch(() => {});

    // Create new session
    await this.prisma.session.create({
      data: {
        userId: session.userId,
        token: newToken,
        expiresAt
      }
    });

    return newToken;
  }

  /**
   * Ensure default admin user exists
   */
  async ensureDefaultAdmin(): Promise<void> {
    // Check if admin user exists
    const adminUser = await this.prisma.user.findUnique({
      where: { username: 'admin' }
    });

    if (adminUser) {
      return;
    }

    console.log('Creating default admin user...');

    // Create or get Administrador role
    let adminRole = await this.prisma.role.findUnique({
      where: { name: 'Administrador' }
    });

    if (!adminRole) {
      // Create admin role with all permissions
      const allPermissions = MENU_CODE_LIST.flatMap(menuCode => [
        { menuCode, permissionType: PermissionType.VIEW },
        { menuCode, permissionType: PermissionType.MODIFY }
      ]);

      adminRole = await this.prisma.role.create({
        data: {
          name: 'Administrador',
          description: 'Rol de administrador con acceso completo al sistema',
          isSystem: true,
          permissions: {
            create: allPermissions
          }
        }
      });
    }

    // Create admin user
    const passwordHash = await this.passwordService.hashPassword('admin');

    await this.prisma.user.create({
      data: {
        username: 'admin',
        passwordHash,
        email: 'admin@example.com',
        fullName: 'Administrator',
        userRoles: {
          create: {
            roleId: adminRole.id
          }
        }
      }
    });

    console.log('✅ Default admin user created (username: admin, password: admin)');
    console.log('⚠️  Please change the default password after first login');
  }
}
