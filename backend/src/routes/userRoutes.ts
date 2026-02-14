import { Router } from 'express';
import { PrismaClient, PermissionType } from '@prisma/client';
import { UserService } from '../services/UserService';
import { PasswordService } from '../services/PasswordService';
import { PermissionService } from '../services/PermissionService';
import { AuthService } from '../services/AuthService';
import { RoleService } from '../services/RoleService';
import { createAuthenticateJWT } from '../middleware/authenticateJWT';
import { createRequirePermission } from '../middleware/requirePermission';
import { MENU_CODES } from '../constants/menuCodes';

export function userRouter(prisma: PrismaClient): Router {
  const router = Router();
  
  const passwordService = new PasswordService();
  const userService = new UserService(prisma, passwordService);
  const roleService = new RoleService(prisma);
  const permissionService = new PermissionService(prisma);
  const authService = new AuthService(prisma, passwordService, userService, roleService);
  
  const authenticateJWT = createAuthenticateJWT(authService);
  const requirePermission = createRequirePermission(permissionService);

  /**
   * GET /api/users
   * List all users with pagination and filters
   */
  router.get(
    '/',
    authenticateJWT,
    requirePermission(MENU_CODES.USERS, PermissionType.VIEW),
    async (req, res) => {
      try {
        const page = parseInt(req.query.page as string) || 1;
        const pageSize = parseInt(req.query.pageSize as string) || 20;
        const search = req.query.search as string;
        const status = req.query.status as 'active' | 'inactive' | undefined;
        const roleId = req.query.roleId as string;

        const result = await userService.listUsers({
          search,
          status,
          roleId,
          page,
          pageSize
        });

        // Remove password hashes from response
        const usersWithoutPasswords = result.users.map(user => {
          const { passwordHash, ...userWithoutPassword } = user;
          return userWithoutPassword;
        });

        res.json({
          ...result,
          users: usersWithoutPasswords
        });
      } catch (error) {
        console.error('List users error:', error);
        res.status(500).json({
          error: 'Failed to list users',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  );

  /**
   * GET /api/users/:id
   * Get user by ID
   */
  router.get(
    '/:id',
    authenticateJWT,
    requirePermission(MENU_CODES.USERS, PermissionType.VIEW),
    async (req, res) => {
      try {
        const user = await userService.getUserWithPermissions(req.params.id);

        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }

        // Remove password hash from response
        const { passwordHash, ...userWithoutPassword } = user;

        res.json(userWithoutPassword);
      } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
          error: 'Failed to get user',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  );

  /**
   * POST /api/users
   * Create a new user
   */
  router.post(
    '/',
    authenticateJWT,
    requirePermission(MENU_CODES.USERS, PermissionType.MODIFY),
    async (req, res) => {
      try {
        const { username, password, email, fullName, roleIds } = req.body;

        if (!username || !password || !email || !fullName || !roleIds || roleIds.length === 0) {
          return res.status(400).json({
            error: 'Missing required fields',
            required: ['username', 'password', 'email', 'fullName', 'roleIds']
          });
        }

        const user = await userService.createUser({
          username,
          password,
          email,
          fullName,
          roleIds
        });

        // Remove password hash from response
        const { passwordHash, ...userWithoutPassword } = user;

        res.status(201).json(userWithoutPassword);
      } catch (error) {
        console.error('Create user error:', error);
        res.status(400).json({
          error: 'Failed to create user',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  );

  /**
   * PUT /api/users/:id
   * Update user information
   */
  router.put(
    '/:id',
    authenticateJWT,
    requirePermission(MENU_CODES.USERS, PermissionType.MODIFY),
    async (req, res) => {
      try {
        const { email, fullName, roleIds } = req.body;

        const user = await userService.updateUser(req.params.id, {
          email,
          fullName,
          roleIds
        });

        // Remove password hash from response
        const { passwordHash, ...userWithoutPassword } = user;

        res.json(userWithoutPassword);
      } catch (error) {
        console.error('Update user error:', error);
        res.status(400).json({
          error: 'Failed to update user',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  );

  /**
   * PUT /api/users/:id/status
   * Activate or deactivate user
   */
  router.put(
    '/:id/status',
    authenticateJWT,
    requirePermission(MENU_CODES.USERS, PermissionType.MODIFY),
    async (req, res) => {
      try {
        const { active } = req.body;

        if (typeof active !== 'boolean') {
          return res.status(400).json({ error: 'Active field must be a boolean' });
        }

        const user = await userService.setUserStatus(req.params.id, active);

        // Remove password hash from response
        const { passwordHash, ...userWithoutPassword } = user;

        res.json(userWithoutPassword);
      } catch (error) {
        console.error('Update user status error:', error);
        res.status(400).json({
          error: 'Failed to update user status',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  );

  /**
   * PUT /api/users/:id/password
   * Change user password
   */
  router.put(
    '/:id/password',
    authenticateJWT,
    async (req, res) => {
      try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
          return res.status(400).json({
            error: 'Current password and new password are required'
          });
        }

        // Users can only change their own password unless they have MODIFY permission
        if (req.user?.userId !== req.params.id) {
          const hasPermission = await permissionService.hasPermission(
            req.user!.userId,
            MENU_CODES.USERS,
            PermissionType.MODIFY
          );

          if (!hasPermission) {
            return res.status(403).json({ error: 'Cannot change another user\'s password' });
          }
        }

        await userService.changePassword(req.params.id, currentPassword, newPassword);

        res.json({ message: 'Password changed successfully' });
      } catch (error) {
        console.error('Change password error:', error);
        res.status(400).json({
          error: 'Failed to change password',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  );

  return router;
}
