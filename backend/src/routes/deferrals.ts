import { Router } from 'express';
import { PrismaClient, PermissionType } from '@prisma/client';
import { DeferralService } from '../services/DeferralService';
import { PermissionService } from '../services/PermissionService';
import { AuthService } from '../services/AuthService';
import { PasswordService } from '../services/PasswordService';
import { UserService } from '../services/UserService';
import { RoleService } from '../services/RoleService';
import { createAuthenticateJWT } from '../middleware/authenticateJWT';
import { createRequirePermission } from '../middleware/requirePermission';
import { MENU_CODES } from '../constants/menuCodes';

export function deferralsRouter(prisma: PrismaClient) {
  const router = Router();
  const deferralService = new DeferralService(prisma);
  const permissionService = new PermissionService(prisma);
  const passwordService = new PasswordService();
  const userService = new UserService(prisma, passwordService);
  const roleService = new RoleService(prisma);
  const authService = new AuthService(prisma, passwordService, userService, roleService);

  const authenticateJWT = createAuthenticateJWT(authService);
  const requirePermission = createRequirePermission(permissionService);

  // GET /api/deferrals?budgetId=...
  router.get('/', authenticateJWT, requirePermission(MENU_CODES.BUDGETS, PermissionType.VIEW), async (req, res, next) => {
    try {
      const budgetId = req.query.budgetId as string;
      if (!budgetId) return res.status(400).json({ error: 'budgetId is required' });
      const deferrals = await deferralService.getByBudget(budgetId);
      res.json(deferrals);
    } catch (error) {
      next(error);
    }
  });

  // GET /api/deferrals/:id
  router.get('/:id', authenticateJWT, requirePermission(MENU_CODES.BUDGETS, PermissionType.VIEW), async (req, res, next) => {
    try {
      const deferral = await deferralService.getById(req.params.id);
      if (!deferral) return res.status(404).json({ error: 'Diferido no encontrado' });
      res.json(deferral);
    } catch (error) {
      next(error);
    }
  });

  // POST /api/deferrals
  router.post('/', authenticateJWT, requirePermission(MENU_CODES.BUDGETS, PermissionType.MODIFY), async (req, res, next) => {
    try {
      const userId = req.user?.userId;
      if (!userId) return res.status(401).json({ error: 'User not authenticated' });

      const { budgetLineId, description, totalAmount, startMonth, endMonth } = req.body;
      if (!budgetLineId || !description || !totalAmount || !startMonth || !endMonth) {
        return res.status(400).json({ error: 'Todos los campos son requeridos' });
      }

      if (parseInt(startMonth) >= parseInt(endMonth)) {
        return res.status(400).json({ error: 'El mes de inicio debe ser menor al mes de fin' });
      }

      const deferral = await deferralService.create({
        budgetLineId, description, totalAmount, startMonth: parseInt(startMonth), endMonth: parseInt(endMonth), createdBy: userId
      });
      res.status(201).json(deferral);
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      next(error);
    }
  });

  // DELETE /api/deferrals/:id
  router.delete('/:id', authenticateJWT, requirePermission(MENU_CODES.BUDGETS, PermissionType.MODIFY), async (req, res, next) => {
    try {
      await deferralService.delete(req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  return router;
}
