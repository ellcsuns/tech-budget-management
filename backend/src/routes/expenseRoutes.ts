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

  // GET /api/expenses - List all expenses (master data only)
  router.get('/', authenticateJWT, requirePermission(MENU_CODES.EXPENSES, PermissionType.VIEW), async (req, res, next) => {
    try {
      const filters: any = {};
      if (req.query.searchText) filters.searchText = req.query.searchText as string;
      if (req.query.technologyDirectionIds) filters.technologyDirectionIds = (req.query.technologyDirectionIds as string).split(',');
      if (req.query.userAreaIds) filters.userAreaIds = (req.query.userAreaIds as string).split(',');
      if (req.query.parentExpenseId) filters.parentExpenseId = req.query.parentExpenseId as string;
      if (req.query.includeInactive === 'true') filters.includeInactive = true;
      if (req.query.tagKey) filters.hasTag = { key: req.query.tagKey as string, value: req.query.tagValue as string | undefined };

      const expenses = await expenseService.getAllExpenses(filters);
      res.json(expenses);
    } catch (error) { next(error); }
  });

  // GET /api/expenses/:id
  router.get('/:id', authenticateJWT, requirePermission(MENU_CODES.EXPENSES, PermissionType.VIEW), async (req, res, next) => {
    try {
      const expense = await expenseService.getExpenseWithTags(req.params.id);
      res.json(expense);
    } catch (error) {
      if (error instanceof Error && error.message === 'Gasto no encontrado') return res.status(404).json({ error: 'Expense not found' });
      next(error);
    }
  });

  // POST /api/expenses - Create (no budgetId needed)
  router.post('/', authenticateJWT, requirePermission(MENU_CODES.EXPENSES, PermissionType.MODIFY), async (req, res, next) => {
    try {
      const expense = await expenseService.createExpense(req.body);
      res.status(201).json(expense);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Field') && error.message.includes('is required')) return res.status(400).json({ error: error.message });
        if (error.message.includes('Ya existe un gasto con el código')) return res.status(409).json({ error: error.message });
      }
      next(error);
    }
  });

  // PUT /api/expenses/:id
  router.put('/:id', authenticateJWT, requirePermission(MENU_CODES.EXPENSES, PermissionType.MODIFY), async (req, res, next) => {
    try {
      const expense = await expenseService.updateExpense(req.params.id, req.body);
      res.json(expense);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Gasto no encontrado') return res.status(404).json({ error: 'Expense not found' });
        if (error.message.includes('Ya existe')) return res.status(409).json({ error: error.message });
      }
      next(error);
    }
  });

  // DELETE /api/expenses/:id
  router.delete('/:id', authenticateJWT, requirePermission(MENU_CODES.EXPENSES, PermissionType.MODIFY), async (req, res, next) => {
    try {
      // Soft delete
      await prisma.expense.update({ where: { id: req.params.id }, data: { active: false } });
      res.status(204).send();
    } catch (error) { next(error); }
  });

  // PUT /api/expenses/:id/reactivate
  router.put('/:id/reactivate', authenticateJWT, requirePermission(MENU_CODES.EXPENSES, PermissionType.MODIFY), async (req, res, next) => {
    try {
      const expense = await prisma.expense.update({ where: { id: req.params.id }, data: { active: true } });
      res.json(expense);
    } catch (error) { next(error); }
  });

  // Tag endpoints
  router.post('/:id/tags', authenticateJWT, requirePermission(MENU_CODES.EXPENSES, PermissionType.MODIFY), async (req, res, next) => {
    try {
      await expenseService.addCustomTag(req.params.id, req.body);
      res.status(201).json({ message: 'Tag added successfully' });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Gasto no encontrado') return res.status(404).json({ error: error.message });
        if (error.message === 'Tag key cannot be empty') return res.status(400).json({ error: error.message });
        if (error.message === 'Tag key already exists on this expense') return res.status(409).json({ error: error.message });
        if (error.message === 'Tag value does not match specified type') return res.status(400).json({ error: error.message });
      }
      next(error);
    }
  });

  router.put('/:id/tags/:key', authenticateJWT, requirePermission(MENU_CODES.EXPENSES, PermissionType.MODIFY), async (req, res, next) => {
    try {
      await expenseService.updateCustomTag(req.params.id, req.params.key, req.body);
      res.json({ message: 'Tag updated successfully' });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('not found') || error.message.includes('no encontrado')) return res.status(404).json({ error: error.message });
        if (error.message.includes('already exists')) return res.status(409).json({ error: error.message });
      }
      next(error);
    }
  });

  router.delete('/:id/tags/:key', authenticateJWT, requirePermission(MENU_CODES.EXPENSES, PermissionType.MODIFY), async (req, res, next) => {
    try {
      await expenseService.removeCustomTag(req.params.id, req.params.key);
      res.status(204).send();
    } catch (error) {
      if (error instanceof Error && error.message === 'Tag not found on expense') return res.status(404).json({ error: error.message });
      next(error);
    }
  });

  return router;
}
