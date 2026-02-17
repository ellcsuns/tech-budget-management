import { Router } from 'express';
import { PrismaClient, PermissionType } from '@prisma/client';
import { ChangeRequestService } from '../services/ChangeRequestService';
import { AuthService } from '../services/AuthService';
import { PasswordService } from '../services/PasswordService';
import { UserService } from '../services/UserService';
import { RoleService } from '../services/RoleService';
import { PermissionService } from '../services/PermissionService';
import { createAuthenticateJWT } from '../middleware/authenticateJWT';
import { createRequirePermission } from '../middleware/requirePermission';
import { MENU_CODES } from '../constants/menuCodes';

export function changeRequestRouter(prisma: PrismaClient) {
  const router = Router();
  const service = new ChangeRequestService(prisma);

  const passwordService = new PasswordService();
  const userService = new UserService(prisma, passwordService);
  const roleService = new RoleService(prisma);
  const authService = new AuthService(prisma, passwordService, userService, roleService);
  const permissionService = new PermissionService(prisma);

  const authenticateJWT = createAuthenticateJWT(authService);
  const requirePermission = createRequirePermission(permissionService);

  router.post('/', authenticateJWT, requirePermission(MENU_CODES.APPROVALS, PermissionType.MODIFY), async (req, res, next) => {
    try {
      const userId = req.user!.userId;
      const result = await service.createChangeRequest(req.body, userId);
      res.status(201).json(result);
    } catch (error: any) {
      if (error.message?.includes('no encontrad')) return res.status(404).json({ error: error.message });
      next(error);
    }
  });

  router.get('/pending', authenticateJWT, requirePermission(MENU_CODES.APPROVALS, PermissionType.VIEW), async (req, res, next) => {
    try {
      const userId = req.user!.userId;
      res.json(await service.getPendingForApprover(userId));
    } catch (error) { next(error); }
  });

  router.post('/:id/approve', authenticateJWT, requirePermission(MENU_CODES.APPROVALS, PermissionType.APPROVE_BUDGET), async (req, res, next) => {
    try {
      const userId = req.user!.userId;
      res.json(await service.approveRequest(req.params.id, userId));
    } catch (error: any) {
      if (error.message?.includes('no encontrad') || error.message?.includes('ya fue')) return res.status(400).json({ error: error.message });
      next(error);
    }
  });

  router.post('/:id/reject', authenticateJWT, requirePermission(MENU_CODES.APPROVALS, PermissionType.APPROVE_BUDGET), async (req, res, next) => {
    try {
      const userId = req.user!.userId;
      res.json(await service.rejectRequest(req.params.id, userId));
    } catch (error: any) {
      if (error.message?.includes('no encontrad') || error.message?.includes('ya fue')) return res.status(400).json({ error: error.message });
      next(error);
    }
  });

  return router;
}
