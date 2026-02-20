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

  // Create change request - anyone with MODIFY on budgets can request
  router.post('/', authenticateJWT, requirePermission(MENU_CODES.BUDGETS, PermissionType.MODIFY), async (req, res, next) => {
    try {
      const userId = req.user!.userId;
      const result = await service.createChangeRequest(req.body, userId);
      res.status(201).json(result);
    } catch (error: any) {
      if (error.message?.includes('no encontrad')) return res.status(404).json({ error: error.message });
      next(error);
    }
  });

  // Get my own requests
  router.get('/my', authenticateJWT, async (req, res, next) => {
    try {
      const userId = req.user!.userId;
      res.json(await service.getMyRequests(userId));
    } catch (error) { next(error); }
  });

  // Get pending requests for approver
  router.get('/pending', authenticateJWT, requirePermission(MENU_CODES.APPROVALS, PermissionType.VIEW), async (req, res, next) => {
    try {
      const userId = req.user!.userId;
      res.json(await service.getPendingForApprover(userId));
    } catch (error) { next(error); }
  });

  // Get pending count for badge
  router.get('/pending-count', authenticateJWT, async (req, res, next) => {
    try {
      const userId = req.user!.userId;
      const pending = await service.getPendingForApprover(userId);
      res.json({ count: pending.length });
    } catch (error) { res.json({ count: 0 }); }
  });

  // Approve single request
  router.post('/:id/approve', authenticateJWT, requirePermission(MENU_CODES.APPROVALS, PermissionType.APPROVE_BUDGET), async (req, res, next) => {
    try {
      const userId = req.user!.userId;
      res.json(await service.approveRequest(req.params.id, userId));
    } catch (error: any) {
      if (error.message?.includes('no encontrad') || error.message?.includes('ya fue')) return res.status(400).json({ error: error.message });
      next(error);
    }
  });

  // Approve multiple requests at once
  router.post('/approve-multiple', authenticateJWT, requirePermission(MENU_CODES.APPROVALS, PermissionType.APPROVE_BUDGET), async (req, res, next) => {
    try {
      const userId = req.user!.userId;
      const { requestIds } = req.body;
      if (!requestIds || !Array.isArray(requestIds) || requestIds.length === 0) {
        return res.status(400).json({ error: 'Se requiere un array de requestIds' });
      }
      res.json(await service.approveMultiple(requestIds, userId));
    } catch (error: any) {
      if (error.message?.includes('no encontrad') || error.message?.includes('ya fue')) return res.status(400).json({ error: error.message });
      next(error);
    }
  });

  // Reject single request
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
