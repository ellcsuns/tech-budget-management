import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { ReconciliationService } from '../services/ReconciliationService';
import { SavingService } from '../services/SavingService';
import { ChangeRequestService } from '../services/ChangeRequestService';
import { AuthService } from '../services/AuthService';
import { PasswordService } from '../services/PasswordService';
import { UserService } from '../services/UserService';
import { RoleService } from '../services/RoleService';
import { PermissionService } from '../services/PermissionService';
import { createAuthenticateJWT } from '../middleware/authenticateJWT';
import { createRequirePermission } from '../middleware/requirePermission';

export function reconciliationRouter(prisma: PrismaClient) {
  const router = Router();

  // Initialize services
  const savingService = new SavingService(prisma);
  const changeRequestService = new ChangeRequestService(prisma);
  const reconciliationService = new ReconciliationService(prisma, savingService, changeRequestService);

  // Initialize middleware services
  const passwordService = new PasswordService();
  const userService = new UserService(prisma, passwordService);
  const roleService = new RoleService(prisma);
  const authService = new AuthService(prisma, passwordService, userService, roleService);
  const permissionService = new PermissionService(prisma);

  const authenticateJWT = createAuthenticateJWT(authService);
  const requirePermission = createRequirePermission(permissionService);

  // Apply authentication to all routes
  router.use(authenticateJWT);

  /**
   * GET /api/reconciliations/summary
   * Returns the reconciliation summary for the current user's assigned budget lines.
   */
  router.get('/summary', requirePermission('monthly-reconciliation', 'VIEW'), async (req, res, next) => {
    try {
      const userId = (req as any).user.userId;
      const budgetId = req.query.budgetId as string | undefined;
      const summary = await reconciliationService.getReconciliationSummary(userId, budgetId);
      res.json(summary);
    } catch (error: any) {
      if (
        error.message?.includes('no encontrad') ||
        error.message?.includes('not found')
      ) {
        return res.status(400).json({ error: error.message });
      }
      next(error);
    }
  });

  /**
   * POST /api/reconciliations/saving
   * Confirms an under-execution as a saving.
   */
  router.post('/saving', requirePermission('monthly-reconciliation', 'MODIFY'), async (req, res, next) => {
    try {
      const userId = (req as any).user.userId;
      const { budgetLineId, month, amount } = req.body;

      if (!budgetLineId || month === undefined || amount === undefined) {
        return res.status(400).json({ error: 'budgetLineId, month, and amount are required' });
      }

      const result = await reconciliationService.confirmSaving(userId, budgetLineId, month, amount);
      res.status(201).json(result);
    } catch (error: any) {
      if (
        error.message?.includes('no encontrad') ||
        error.message?.includes('ya fue conciliad') ||
        error.message?.includes('Solo se pueden') ||
        error.message?.includes('No hay sub-ejecución') ||
        error.message?.includes('excede la sub-ejecución') ||
        error.message?.includes('excede el presupuesto')
      ) {
        return res.status(400).json({ error: error.message });
      }
      next(error);
    }
  });

  /**
   * POST /api/reconciliations/redistribution
   * Redistributes under-execution across future months.
   */
  router.post('/redistribution', requirePermission('monthly-reconciliation', 'MODIFY'), async (req, res, next) => {
    try {
      const userId = (req as any).user.userId;
      const { budgetLineId, month, distribution } = req.body;

      if (!budgetLineId || month === undefined || !distribution) {
        return res.status(400).json({ error: 'budgetLineId, month, and distribution are required' });
      }

      const result = await reconciliationService.redistributeUnderExecution(userId, budgetLineId, month, distribution);
      res.status(201).json(result);
    } catch (error: any) {
      if (
        error.message?.includes('no encontrad') ||
        error.message?.includes('ya fue conciliad') ||
        error.message?.includes('Solo se pueden') ||
        error.message?.includes('No hay sub-ejecución') ||
        error.message?.includes('suma de la distribución') ||
        error.message?.includes('mes destino') ||
        error.message?.includes('Mes inválido') ||
        error.message?.includes('excede la asignación')
      ) {
        return res.status(400).json({ error: error.message });
      }
      next(error);
    }
  });

  /**
   * POST /api/reconciliations/adjustment
   * Adjusts future forecasts to compensate for over-execution.
   */
  router.post('/adjustment', requirePermission('monthly-reconciliation', 'MODIFY'), async (req, res, next) => {
    try {
      const userId = (req as any).user.userId;
      const { budgetLineId, month, reductions } = req.body;

      if (!budgetLineId || month === undefined || !reductions) {
        return res.status(400).json({ error: 'budgetLineId, month, and reductions are required' });
      }

      const result = await reconciliationService.adjustOverExecution(userId, budgetLineId, month, reductions);
      res.status(201).json(result);
    } catch (error: any) {
      if (
        error.message?.includes('no encontrad') ||
        error.message?.includes('ya fue conciliad') ||
        error.message?.includes('Solo se pueden') ||
        error.message?.includes('No hay sobre-ejecución') ||
        error.message?.includes('reducciones totales') ||
        error.message?.includes('valor negativo')
      ) {
        return res.status(400).json({ error: error.message });
      }
      next(error);
    }
  });

  /**
   * GET /api/reconciliations/status
   * Returns the current user's reconciliation completion status per month.
   */
  router.get('/status', requirePermission('monthly-reconciliation', 'VIEW'), async (req, res, next) => {
    try {
      const userId = (req as any).user.userId;
      const budgetId = req.query.budgetId as string | undefined;
      const months = await reconciliationService.getUserStatus(userId, budgetId);
      res.json({ months });
    } catch (error: any) {
      if (
        error.message?.includes('no encontrad') ||
        error.message?.includes('not found')
      ) {
        return res.status(400).json({ error: error.message });
      }
      next(error);
    }
  });

  /**
   * GET /api/reconciliations/history/:budgetLineId
   * Returns reconciliation history for a specific budget line.
   */
  router.get('/history/:budgetLineId', requirePermission('monthly-reconciliation', 'VIEW'), async (req, res, next) => {
    try {
      const history = await reconciliationService.getHistory(req.params.budgetLineId);
      res.json(history);
    } catch (error: any) {
      next(error);
    }
  });

  /**
   * GET /api/reconciliations/tracking
   * Returns the admin tracking matrix (requires MODIFY permission).
   */
  router.get('/tracking', requirePermission('monthly-reconciliation', 'MODIFY'), async (req, res, next) => {
    try {
      const budgetId = req.query.budgetId as string | undefined;
      const users = await reconciliationService.getTrackingMatrix(budgetId);
      res.json({ users });
    } catch (error: any) {
      if (
        error.message?.includes('no encontrad') ||
        error.message?.includes('not found')
      ) {
        return res.status(400).json({ error: error.message });
      }
      next(error);
    }
  });

  /**
   * GET /api/reconciliations/pending-count
   * Returns the count of pending reconciliation months for the current user.
   */
  router.get('/pending-count', requirePermission('monthly-reconciliation', 'VIEW'), async (req, res, next) => {
    try {
      const userId = (req as any).user.userId;
      const count = await reconciliationService.getPendingCount(userId);
      res.json({ count });
    } catch (error: any) {
      next(error);
    }
  });

  return router;
}
