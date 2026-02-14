import { Router } from 'express';
import { PrismaClient, PermissionType } from '@prisma/client';
import { RoleService } from '../services/RoleService';
import { PermissionService } from '../services/PermissionService';
import { AuthService } from '../services/AuthService';
import { UserService } from '../services/UserService';
import { PasswordService } from '../services/PasswordService';
import { createAuthenticateJWT } from '../middleware/authenticateJWT';
import { createRequirePermission } from '../middleware/requirePermission';
import { MENU_CODES } from '../constants/menuCodes';

export function roleRouter(prisma: PrismaClient): Router {
  const router = Router();
  
  const passwordService = new PasswordService();
  const userService = new UserService(prisma, passwordService);
  const roleService = new RoleService(prisma);
  const permissionService = new PermissionService(prisma);
  const authService = new AuthService(prisma, passwordService, userService, roleService);
  
  const authenticateJWT = createAuthenticateJWT(authService);
  const requirePermission = createRequirePermission(permissionService);

  /**
   * GET /api/roles
   * List all roles
   */
  router.get(
    '/',
    authenticateJWT,
    requirePermission(MENU_CODES.ROLES, PermissionType.VIEW),
    async (req, res) => {
      try {
        const roles = await roleService.listRoles();
        res.json(roles);
      } catch (error) {
        console.error('List roles error:', error);
        res.status(500).json({
          error: 'Failed to list roles',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  );

  /**
   * GET /api/roles/:id
   * Get role by ID with permissions
   */
  router.get(
    '/:id',
    authenticateJWT,
    requirePermission(MENU_CODES.ROLES, PermissionType.VIEW),
    async (req, res) => {
      try {
        const role = await roleService.getRoleWithPermissions(req.params.id);

        if (!role) {
          return res.status(404).json({ error: 'Role not found' });
        }

        res.json(role);
      } catch (error) {
        console.error('Get role error:', error);
        res.status(500).json({
          error: 'Failed to get role',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  );

  /**
   * POST /api/roles
   * Create a new role
   */
  router.post(
    '/',
    authenticateJWT,
    requirePermission(MENU_CODES.ROLES, PermissionType.MODIFY),
    async (req, res) => {
      try {
        const { name, description, permissions } = req.body;

        if (!name || !description || !permissions || permissions.length === 0) {
          return res.status(400).json({
            error: 'Missing required fields',
            required: ['name', 'description', 'permissions']
          });
        }

        const role = await roleService.createRole({
          name,
          description,
          permissions
        });

        res.status(201).json(role);
      } catch (error) {
        console.error('Create role error:', error);
        res.status(400).json({
          error: 'Failed to create role',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  );

  /**
   * PUT /api/roles/:id
   * Update role information and permissions
   */
  router.put(
    '/:id',
    authenticateJWT,
    requirePermission(MENU_CODES.ROLES, PermissionType.MODIFY),
    async (req, res) => {
      try {
        const { name, description, permissions } = req.body;

        const role = await roleService.updateRole(req.params.id, {
          name,
          description,
          permissions
        });

        res.json(role);
      } catch (error) {
        console.error('Update role error:', error);
        res.status(400).json({
          error: 'Failed to update role',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  );

  /**
   * DELETE /api/roles/:id
   * Delete a role
   */
  router.delete(
    '/:id',
    authenticateJWT,
    requirePermission(MENU_CODES.ROLES, PermissionType.MODIFY),
    async (req, res) => {
      try {
        await roleService.deleteRole(req.params.id);
        res.status(204).send();
      } catch (error) {
        console.error('Delete role error:', error);
        res.status(400).json({
          error: 'Failed to delete role',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  );

  /**
   * GET /api/roles/:id/users
   * Get users with this role
   */
  router.get(
    '/:id/users',
    authenticateJWT,
    requirePermission(MENU_CODES.ROLES, PermissionType.VIEW),
    async (req, res) => {
      try {
        const users = await roleService.getUsersWithRole(req.params.id);

        // Remove password hashes from response
        const usersWithoutPasswords = users.map(user => {
          const { passwordHash, ...userWithoutPassword } = user;
          return userWithoutPassword;
        });

        res.json(usersWithoutPasswords);
      } catch (error) {
        console.error('Get role users error:', error);
        res.status(500).json({
          error: 'Failed to get role users',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  );

  /**
   * GET /api/roles/menu-codes
   * Get available menu codes
   */
  router.get(
    '/menu-codes/list',
    authenticateJWT,
    requirePermission(MENU_CODES.ROLES, PermissionType.VIEW),
    async (req, res) => {
      try {
        const menuCodes = permissionService.getAvailableMenuCodes();
        res.json(menuCodes);
      } catch (error) {
        console.error('Get menu codes error:', error);
        res.status(500).json({
          error: 'Failed to get menu codes',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  );

  return router;
}
