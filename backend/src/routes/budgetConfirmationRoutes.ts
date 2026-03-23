import { Router } from 'express';
import { PrismaClient, PermissionType } from '@prisma/client';
import { BudgetConfirmationService } from '../services/BudgetConfirmationService';
import { AuthService } from '../services/AuthService';
import { PasswordService } from '../services/PasswordService';
import { UserService } from '../services/UserService';
import { RoleService } from '../services/RoleService';
import { PermissionService } from '../services/PermissionService';
import { createAuthenticateJWT } from '../middleware/authenticateJWT';
import { createRequirePermission } from '../middleware/requirePermission';
import { MENU_CODES } from '../constants/menuCodes';

export function budgetConfirmationRouter(prisma: PrismaClient) {
  const router = Router();
  const service = new BudgetConfirmationService(prisma);

  const passwordService = new PasswordService();
  const userService = new UserService(prisma, passwordService);
  const roleService = new RoleService(prisma);
  const authService = new AuthService(prisma, passwordService, userService, roleService);
  const permissionService = new PermissionService(prisma);

  const authenticateJWT = createAuthenticateJWT(authService);
  const requirePermission = createRequirePermission(permissionService);

  // GET /my-pending - Get my pending confirmations (no special permission)
  router.get('/my-pending', authenticateJWT, async (req, res, next) => {
    try {
      const userId = req.user!.userId;
      res.json(await service.getMyPending(userId));
    } catch (error) { next(error); }
  });

  // GET /pending-count - Get count of pending confirmations (no special permission)
  router.get('/pending-count', authenticateJWT, async (req, res, next) => {
    try {
      const userId = req.user!.userId;
      const count = await service.getPendingCount(userId);
      res.json({ count });
    } catch (error) { res.json({ count: 0 }); }
  });

  // GET /users - Get users with budget lines (admin only)
  router.get('/users', authenticateJWT, requirePermission(MENU_CODES.BUDGET_CONFIRMATION, PermissionType.VIEW), async (req, res, next) => {
    try {
      const budgetId = req.query.budgetId as string;
      if (!budgetId) return res.status(400).json({ error: 'budgetId es requerido' });
      res.json(await service.getUsersWithBudgetLines(budgetId));
    } catch (error) { next(error); }
  });

  // POST / - Create confirmation request (admin only)
  router.post('/', authenticateJWT, requirePermission(MENU_CODES.BUDGET_CONFIRMATION, PermissionType.MODIFY), async (req, res, next) => {
    try {
      const userId = req.user!.userId;
      const { budgetId, type, targetUserId } = req.body;

      if (!budgetId) return res.status(400).json({ error: 'budgetId es requerido' });

      let result;
      if (type === 'INDIVIDUAL') {
        if (!targetUserId) return res.status(400).json({ error: 'targetUserId es requerido para solicitudes individuales' });
        result = await service.createIndividualRequest(budgetId, targetUserId, userId);
      } else {
        result = await service.createMassiveRequest(budgetId, userId);
      }
      res.status(201).json(result);
    } catch (error: any) {
      if (error.message?.includes('Ya existe')) return res.status(409).json({ error: error.message });
      if (error.message?.includes('No hay')) return res.status(400).json({ error: error.message });
      next(error);
    }
  });

  // GET / - List all confirmation requests (admin only)
  router.get('/', authenticateJWT, requirePermission(MENU_CODES.BUDGET_CONFIRMATION, PermissionType.VIEW), async (req, res, next) => {
    try {
      const budgetId = req.query.budgetId as string | undefined;
      res.json(await service.getAllRequests(budgetId));
    } catch (error) { next(error); }
  });

  // GET /:id - Get request detail (admin only)
  router.get('/:id', authenticateJWT, requirePermission(MENU_CODES.BUDGET_CONFIRMATION, PermissionType.VIEW), async (req, res, next) => {
    try {
      res.json(await service.getRequestDetail(req.params.id));
    } catch (error: any) {
      if (error.message?.includes('no encontrad')) return res.status(404).json({ error: error.message });
      next(error);
    }
  });

  // POST /:id/confirm - Confirm response (any authenticated user)
  router.post('/:id/confirm', authenticateJWT, async (req, res, next) => {
    try {
      const userId = req.user!.userId;
      res.json(await service.confirmResponse(req.params.id, userId));
    } catch (error: any) {
      if (error.message?.includes('Ya confirmaste') || error.message?.includes('No se encontró')) {
        return res.status(400).json({ error: error.message });
      }
      next(error);
    }
  });

  return router;
}
