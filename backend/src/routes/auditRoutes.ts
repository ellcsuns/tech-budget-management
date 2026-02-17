import { Router } from 'express';
import { PrismaClient, PermissionType } from '@prisma/client';
import { AuditService } from '../services/AuditService';
import { AuthService } from '../services/AuthService';
import { PasswordService } from '../services/PasswordService';
import { UserService } from '../services/UserService';
import { RoleService } from '../services/RoleService';
import { PermissionService } from '../services/PermissionService';
import { createAuthenticateJWT } from '../middleware/authenticateJWT';
import { createRequirePermission } from '../middleware/requirePermission';
import { MENU_CODES } from '../constants/menuCodes';

export function auditRouter(prisma: PrismaClient): Router {
  const router = Router();

  const passwordService = new PasswordService();
  const userService = new UserService(prisma, passwordService);
  const roleService = new RoleService(prisma);
  const authService = new AuthService(prisma, passwordService, userService, roleService);
  const permissionService = new PermissionService(prisma);
  const auditService = new AuditService(prisma);

  const authenticateJWT = createAuthenticateJWT(authService);
  const requirePermission = createRequirePermission(permissionService);

  // GET /api/audit - List audit logs with filters
  router.get(
    '/',
    authenticateJWT,
    requirePermission(MENU_CODES.AUDIT, PermissionType.VIEW),
    async (req, res, next) => {
      try {
        const page = parseInt(req.query.page as string) || 1;
        const pageSize = Math.min(parseInt(req.query.pageSize as string) || 50, 100);
        const result = await auditService.getLogs({
          userId: req.query.userId as string,
          action: req.query.action as string,
          entity: req.query.entity as string,
          dateFrom: req.query.dateFrom as string,
          dateTo: req.query.dateTo as string,
          page,
          pageSize,
        });
        res.json(result);
      } catch (error) { next(error); }
    }
  );

  // GET /api/audit/actions - Distinct action types
  router.get(
    '/actions',
    authenticateJWT,
    requirePermission(MENU_CODES.AUDIT, PermissionType.VIEW),
    async (_req, res, next) => {
      try {
        res.json(await auditService.getDistinctActions());
      } catch (error) { next(error); }
    }
  );

  // GET /api/audit/entities - Distinct entity types
  router.get(
    '/entities',
    authenticateJWT,
    requirePermission(MENU_CODES.AUDIT, PermissionType.VIEW),
    async (_req, res, next) => {
      try {
        res.json(await auditService.getDistinctEntities());
      } catch (error) { next(error); }
    }
  );

  return router;
}
