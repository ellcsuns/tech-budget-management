import { Router } from 'express';
import { PrismaClient, PermissionType } from '@prisma/client';
import { ExpenseService } from '../services/ExpenseService';
import { PermissionService } from '../services/PermissionService';
import { AuthService } from '../services/AuthService';
import { PasswordService } from '../services/PasswordService';
import { UserService } from '../services/UserService';
import { RoleService } from '../services/RoleService';
import { createAuthenticateJWT } from '../middleware/authenticateJWT';
import { createRequirePermission } from '../middleware/requirePermission';
import { MENU_CODES } from '../constants/menuCodes';

export function expenseRouter(prisma: PrismaClient) {
  const router = Router();
  const expenseService = new ExpenseService(prisma);
  const permissionService = new PermissionService(prisma);
  const passwordService = new PasswordService();
  const userService = new UserService(prisma, passwordService);
  const roleService = new RoleService(prisma);
  const authService = new AuthService(prisma, passwordService, userService, roleService);
  
  const authenticateJWT = createAuthenticateJWT(authService);
  const requirePermission = createRequirePermission(permissionService);

  // GET /api/expenses - List all expenses with filters (requires VIEW permission)
  router.get('/', authenticateJWT, requirePermission(MENU_CODES.EXPENSES, PermissionType.VIEW), async (req, res, next) => {
    try {
      // If budgetId is provided, use getExpensesByBudget which includes planValues and transactions
      if (req.query.budgetId) {
        const expenses = await expenseService.getExpensesByBudget(req.query.budgetId as string);
        return res.json(expenses);
      }

      const filters: any = {};
      
      if (req.query.searchText) {
        filters.searchText = req.query.searchText as string;
      }
      if (req.query.technologyDirectionIds) {
        filters.technologyDirectionIds = (req.query.technologyDirectionIds as string).split(',');
      }
      if (req.query.userAreaIds) {
        filters.userAreaIds = (req.query.userAreaIds as string).split(',');
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
    } catch (error) {
      next(error);
    }
  });

  // GET /api/expenses/:id - Get expense details with tags (requires VIEW permission)
  router.get('/:id', authenticateJWT, requirePermission(MENU_CODES.EXPENSES, PermissionType.VIEW), async (req, res, next) => {
    try {
      const expense = await expenseService.getExpenseWithTags(req.params.id);
      res.json(expense);
    } catch (error) {
      if (error instanceof Error && error.message === 'Gasto no encontrado') {
        return res.status(404).json({ error: 'Expense not found' });
      }
      next(error);
    }
  });

  // POST /api/expenses - Create new expense (requires MODIFY permission)
  router.post('/', authenticateJWT, requirePermission(MENU_CODES.EXPENSES, PermissionType.MODIFY), async (req, res, next) => {
    try {
      const { budgetId, ...data } = req.body;
      const expense = await expenseService.createExpense(budgetId, data);
      res.status(201).json(expense);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Field') && error.message.includes('is required')) {
          return res.status(400).json({ error: error.message });
        }
        if (error.message.includes('Ya existe un gasto con el código')) {
          return res.status(409).json({ error: 'Expense code already exists' });
        }
      }
      next(error);
    }
  });

  // PUT /api/expenses/:id - Update expense (requires MODIFY permission)
  router.put('/:id', authenticateJWT, requirePermission(MENU_CODES.EXPENSES, PermissionType.MODIFY), async (req, res, next) => {
    try {
      const expense = await expenseService.updateExpense(req.params.id, req.body);
      res.json(expense);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Gasto no encontrado') {
          return res.status(404).json({ error: 'Expense not found' });
        }
        if (error.message.includes('Ya existe un gasto con el código')) {
          return res.status(409).json({ error: 'Expense code already exists' });
        }
      }
      next(error);
    }
  });

  // DELETE /api/expenses/:id - Delete expense (requires MODIFY permission)
  router.delete('/:id', authenticateJWT, requirePermission(MENU_CODES.EXPENSES, PermissionType.MODIFY), async (req, res, next) => {
    try {
      await expenseService.deleteExpense(req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  // POST /api/expenses/:id/tags - Add custom tag (requires MODIFY permission)
  router.post('/:id/tags', authenticateJWT, requirePermission(MENU_CODES.EXPENSES, PermissionType.MODIFY), async (req, res, next) => {
    try {
      await expenseService.addCustomTag(req.params.id, req.body);
      res.status(201).json({ message: 'Tag added successfully' });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Gasto no encontrado') {
          return res.status(404).json({ error: 'Expense not found' });
        }
        if (error.message === 'Tag key cannot be empty') {
          return res.status(400).json({ error: error.message });
        }
        if (error.message === 'Tag key already exists on this expense') {
          return res.status(409).json({ error: error.message });
        }
        if (error.message === 'Tag value does not match specified type') {
          return res.status(400).json({ error: error.message });
        }
      }
      next(error);
    }
  });

  // PUT /api/expenses/:id/tags/:key - Update custom tag (requires MODIFY permission)
  router.put('/:id/tags/:key', authenticateJWT, requirePermission(MENU_CODES.EXPENSES, PermissionType.MODIFY), async (req, res, next) => {
    try {
      await expenseService.updateCustomTag(req.params.id, req.params.key, req.body);
      res.json({ message: 'Tag updated successfully' });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Gasto no encontrado') {
          return res.status(404).json({ error: 'Expense not found' });
        }
        if (error.message === 'Tag not found on expense') {
          return res.status(404).json({ error: error.message });
        }
        if (error.message === 'Tag key cannot be empty') {
          return res.status(400).json({ error: error.message });
        }
        if (error.message === 'Tag key already exists on this expense') {
          return res.status(409).json({ error: error.message });
        }
        if (error.message === 'Tag value does not match specified type') {
          return res.status(400).json({ error: error.message });
        }
      }
      next(error);
    }
  });

  // DELETE /api/expenses/:id/tags/:key - Remove custom tag (requires MODIFY permission)
  router.delete('/:id/tags/:key', authenticateJWT, requirePermission(MENU_CODES.EXPENSES, PermissionType.MODIFY), async (req, res, next) => {
    try {
      await expenseService.removeCustomTag(req.params.id, req.params.key);
      res.status(204).send();
    } catch (error) {
      if (error instanceof Error && error.message === 'Tag not found on expense') {
        return res.status(404).json({ error: error.message });
      }
      next(error);
    }
  });

  // Legacy endpoints for backward compatibility
  router.get('/budget/:budgetId', async (req, res, next) => {
    try {
      const expenses = await expenseService.getExpensesByBudget(req.params.budgetId);
      res.json(expenses);
    } catch (error) {
      next(error);
    }
  });

  router.get('/:id/metadata', async (req, res, next) => {
    try {
      const metadata = await expenseService.getExpenseMetadata(req.params.id);
      res.json(metadata);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
