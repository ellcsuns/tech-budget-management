import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { SavingService } from '../services/SavingService';
import { AuthService } from '../services/AuthService';
import { PasswordService } from '../services/PasswordService';
import { UserService } from '../services/UserService';
import { RoleService } from '../services/RoleService';
import { PermissionService } from '../services/PermissionService';
import { createAuthenticateJWT } from '../middleware/authenticateJWT';
import { createRequirePermission } from '../middleware/requirePermission';

export function savingsRouter(prisma: PrismaClient) {
  const router = Router();
  const savingService = new SavingService(prisma);
  
  // Initialize services for middleware
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
   * GET /api/savings
   * List all savings with optional filters
   */
  router.get('/', requirePermission('budgets', 'VIEW'), async (req, res, next) => {
    try {
      const filters: any = {};

      if (req.query.expenseId) {
        filters.expenseId = req.query.expenseId as string;
      }

      if (req.query.budgetId) {
        filters.budgetId = req.query.budgetId as string;
      }

      if (req.query.status) {
        filters.status = req.query.status as string;
      }

      if (req.query.createdBy) {
        filters.createdBy = req.query.createdBy as string;
      }

      if (req.query.dateFrom) {
        filters.dateFrom = new Date(req.query.dateFrom as string);
      }

      if (req.query.dateTo) {
        filters.dateTo = new Date(req.query.dateTo as string);
      }

      const savings = await savingService.getSavings(filters);
      res.json(savings);
    } catch (error: any) {
      next(error);
    }
  });

  /**
   * GET /api/savings/:id
   * Get saving by ID
   */
  router.get('/:id', requirePermission('budgets', 'VIEW'), async (req, res, next) => {
    try {
      const saving = await savingService.getSavingById(req.params.id);
      
      if (!saving) {
        return res.status(404).json({ error: 'Saving not found' });
      }

      res.json(saving);
    } catch (error: any) {
      next(error);
    }
  });

  /**
   * POST /api/savings
   * Create new saving
   */
  router.post('/', requirePermission('budgets', 'MODIFY'), async (req, res, next) => {
    try {
      const userId = (req as any).user.userId;
      const saving = await savingService.createSaving(req.body, userId);
      res.status(201).json(saving);
    } catch (error: any) {
      if (error.message.includes('greater than zero') || 
          error.message.includes('not found') ||
          error.message.includes('must be between')) {
        return res.status(400).json({ error: error.message });
      }
      next(error);
    }
  });

  /**
   * POST /api/savings/approve
   * Approve multiple savings
   */
  router.post('/approve', requirePermission('budgets', 'MODIFY'), async (req, res, next) => {
    try {
      const { savingIds } = req.body;

      if (!savingIds || !Array.isArray(savingIds) || savingIds.length === 0) {
        return res.status(400).json({ error: 'savingIds array is required' });
      }

      const result = await savingService.approveSavings(savingIds);
      res.json(result);
    } catch (error: any) {
      if (error.message.includes('not found')) {
        return res.status(404).json({ error: error.message });
      }
      if (error.message.includes('already been approved')) {
        return res.status(409).json({ error: error.message });
      }
      next(error);
    }
  });

  /**
   * DELETE /api/savings/:id
   * Delete saving
   */
  router.delete('/:id', requirePermission('budgets', 'MODIFY'), async (req, res, next) => {
    try {
      await savingService.deleteSaving(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Saving not found' });
      }
      next(error);
    }
  });

  return router;
}
