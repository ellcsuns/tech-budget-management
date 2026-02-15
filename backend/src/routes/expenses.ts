import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { ExpenseService } from '../services/ExpenseService';
import { authenticateJWT } from '../middleware/authenticateJWT';
import { requirePermission } from '../middleware/requirePermission';

export function expensesRouter(prisma: PrismaClient) {
  const router = Router();
  const expenseService = new ExpenseService(prisma);

  // Apply authentication to all routes
  router.use(authenticateJWT);

  /**
   * GET /api/expenses
   * List all expenses with optional filters
   */
  router.get('/', requirePermission('expenses', 'VIEW'), async (req, res, next) => {
    try {
      const filters: any = {};

      if (req.query.searchText) {
        filters.searchText = req.query.searchText as string;
      }

      if (req.query.technologyDirectionIds) {
        const ids = req.query.technologyDirectionIds as string;
        filters.technologyDirectionIds = ids.split(',');
      }

      if (req.query.userAreaIds) {
        const ids = req.query.userAreaIds as string;
        filters.userAreaIds = ids.split(',');
      }

      if (req.query.financialCompanyId) {
        filters.financialCompanyId = req.query.financialCompanyId as string;
      }

      if (req.query.parentExpenseId) {
        filters.parentExpenseId = req.query.parentExpenseId as string;
      }

      if (req.query.tagKey) {
        filters.hasTag = {
          key: req.query.tagKey as string,
          value: req.query.tagValue as string | undefined
        };
      }

      const expenses = await expenseService.getAllExpenses(filters);
      res.json(expenses);
    } catch (error: any) {
      next(error);
    }
  });

  /**
   * GET /api/expenses/:id
   * Get expense by ID with tags
   */
  router.get('/:id', requirePermission('expenses', 'VIEW'), async (req, res, next) => {
    try {
      const expense = await expenseService.getExpenseWithTags(req.params.id);
      res.json(expense);
    } catch (error: any) {
      if (error.message === 'Gasto no encontrado') {
        return res.status(404).json({ error: error.message });
      }
      next(error);
    }
  });

  /**
   * POST /api/expenses
   * Create new expense
   */
  router.post('/', requirePermission('expenses', 'MODIFY'), async (req, res, next) => {
    try {
      const { budgetId, ...expenseData } = req.body;

      if (!budgetId) {
        return res.status(400).json({ error: 'budgetId is required' });
      }

      const expense = await expenseService.createExpense(budgetId, expenseData);
      res.status(201).json(expense);
    } catch (error: any) {
      if (error.message.includes('is required') || 
          error.message.includes('Ya existe') ||
          error.message.includes('no encontrad')) {
        return res.status(400).json({ error: error.message });
      }
      next(error);
    }
  });

  /**
   * PUT /api/expenses/:id
   * Update expense
   */
  router.put('/:id', requirePermission('expenses', 'MODIFY'), async (req, res, next) => {
    try {
      const expense = await expenseService.updateExpense(req.params.id, req.body);
      res.json(expense);
    } catch (error: any) {
      if (error.message === 'Gasto no encontrado') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message.includes('Ya existe') || error.message.includes('no encontrad')) {
        return res.status(400).json({ error: error.message });
      }
      next(error);
    }
  });

  /**
   * DELETE /api/expenses/:id
   * Delete expense
   */
  router.delete('/:id', requirePermission('expenses', 'MODIFY'), async (req, res, next) => {
    try {
      await expenseService.deleteExpense(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Gasto no encontrado' });
      }
      next(error);
    }
  });

  /**
   * POST /api/expenses/:id/tags
   * Add custom tag to expense
   */
  router.post('/:id/tags', requirePermission('expenses', 'MODIFY'), async (req, res, next) => {
    try {
      await expenseService.addCustomTag(req.params.id, req.body);
      res.status(201).json({ success: true });
    } catch (error: any) {
      if (error.message.includes('no encontrado') || error.message.includes('cannot be empty')) {
        return res.status(400).json({ error: error.message });
      }
      if (error.message.includes('already exists')) {
        return res.status(409).json({ error: error.message });
      }
      next(error);
    }
  });

  /**
   * PUT /api/expenses/:id/tags/:key
   * Update custom tag
   */
  router.put('/:id/tags/:key', requirePermission('expenses', 'MODIFY'), async (req, res, next) => {
    try {
      await expenseService.updateCustomTag(req.params.id, req.params.key, req.body);
      res.json({ success: true });
    } catch (error: any) {
      if (error.message.includes('not found') || error.message.includes('cannot be empty')) {
        return res.status(400).json({ error: error.message });
      }
      if (error.message.includes('already exists')) {
        return res.status(409).json({ error: error.message });
      }
      next(error);
    }
  });

  /**
   * DELETE /api/expenses/:id/tags/:key
   * Remove custom tag
   */
  router.delete('/:id/tags/:key', requirePermission('expenses', 'MODIFY'), async (req, res, next) => {
    try {
      await expenseService.removeCustomTag(req.params.id, req.params.key);
      res.status(204).send();
    } catch (error: any) {
      if (error.message.includes('not found')) {
        return res.status(404).json({ error: error.message });
      }
      next(error);
    }
  });

  return router;
}
