import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { ExpenseService } from '../services/ExpenseService';
import { AuthService } from '../services/AuthService';
import { PasswordService } from '../services/PasswordService';
import { UserService } from '../services/UserService';
import { RoleService } from '../services/RoleService';
import { PermissionService } from '../services/PermissionService';
import { createAuthenticateJWT } from '../middleware/authenticateJWT';
import { createRequirePermission } from '../middleware/requirePermission';

export function expensesRouter(prisma: PrismaClient) {
  const router = Router();
  const expenseService = new ExpenseService(prisma);
  const passwordService = new PasswordService();
  const userService = new UserService(prisma, passwordService);
  const roleService = new RoleService(prisma);
  const authService = new AuthService(prisma, passwordService, userService, roleService);
  const permissionService = new PermissionService(prisma);
  const authenticateJWT = createAuthenticateJWT(authService);
  const requirePermission = createRequirePermission(permissionService);

  router.use(authenticateJWT);

  router.get('/', requirePermission('expenses', 'VIEW'), async (req, res, next) => {
    try {
      const filters: any = {};
      if (req.query.includeInactive === 'true') filters.includeInactive = true;
      if (req.query.searchText) filters.searchText = req.query.searchText as string;
      if (req.query.technologyDirectionIds) filters.technologyDirectionIds = (req.query.technologyDirectionIds as string).split(',');
      if (req.query.userAreaIds) filters.userAreaIds = (req.query.userAreaIds as string).split(',');
      if (req.query.parentExpenseId) filters.parentExpenseId = req.query.parentExpenseId as string;
      if (req.query.tagKey) filters.hasTag = { key: req.query.tagKey as string, value: req.query.tagValue as string | undefined };

      const expenses = await expenseService.getAllExpenses(filters);
      res.json(expenses);
    } catch (error) { next(error); }
  });

  router.get('/:id', requirePermission('expenses', 'VIEW'), async (req, res, next) => {
    try {
      const expense = await expenseService.getExpenseWithTags(req.params.id);
      res.json(expense);
    } catch (error: any) {
      if (error.message === 'Gasto no encontrado') return res.status(404).json({ error: error.message });
      next(error);
    }
  });

  router.post('/', requirePermission('expenses', 'MODIFY'), async (req, res, next) => {
    try {
      const expense = await expenseService.createExpense(req.body);
      res.status(201).json(expense);
    } catch (error: any) {
      if (error.message.includes('is required') || error.message.includes('Ya existe') || error.message.includes('no encontrad')) {
        return res.status(400).json({ error: error.message });
      }
      next(error);
    }
  });

  router.put('/:id', requirePermission('expenses', 'MODIFY'), async (req, res, next) => {
    try {
      const expense = await expenseService.updateExpense(req.params.id, req.body);
      res.json(expense);
    } catch (error: any) {
      if (error.message === 'Gasto no encontrado') return res.status(404).json({ error: error.message });
      if (error.message.includes('Ya existe') || error.message.includes('no encontrad')) return res.status(400).json({ error: error.message });
      next(error);
    }
  });

  router.delete('/:id', requirePermission('expenses', 'MODIFY'), async (req, res, next) => {
    try {
      await prisma.expense.update({ where: { id: req.params.id }, data: { active: false } });
      res.status(204).send();
    } catch (error: any) {
      if (error.code === 'P2025') return res.status(404).json({ error: 'Gasto no encontrado' });
      next(error);
    }
  });

  router.put('/:id/reactivate', requirePermission('expenses', 'MODIFY'), async (req, res, next) => {
    try {
      const expense = await prisma.expense.update({ where: { id: req.params.id }, data: { active: true } });
      res.json(expense);
    } catch (error: any) {
      if (error.code === 'P2025') return res.status(404).json({ error: 'Gasto no encontrado' });
      next(error);
    }
  });

  router.post('/:id/tags', requirePermission('expenses', 'MODIFY'), async (req, res, next) => {
    try { await expenseService.addCustomTag(req.params.id, req.body); res.status(201).json({ success: true }); }
    catch (error: any) {
      if (error.message.includes('no encontrado') || error.message.includes('cannot be empty')) return res.status(400).json({ error: error.message });
      if (error.message.includes('already exists')) return res.status(409).json({ error: error.message });
      next(error);
    }
  });

  router.put('/:id/tags/:key', requirePermission('expenses', 'MODIFY'), async (req, res, next) => {
    try { await expenseService.updateCustomTag(req.params.id, req.params.key, req.body); res.json({ success: true }); }
    catch (error: any) {
      if (error.message.includes('not found') || error.message.includes('cannot be empty')) return res.status(400).json({ error: error.message });
      if (error.message.includes('already exists')) return res.status(409).json({ error: error.message });
      next(error);
    }
  });

  router.delete('/:id/tags/:key', requirePermission('expenses', 'MODIFY'), async (req, res, next) => {
    try { await expenseService.removeCustomTag(req.params.id, req.params.key); res.status(204).send(); }
    catch (error: any) {
      if (error.message.includes('not found')) return res.status(404).json({ error: error.message });
      next(error);
    }
  });

  return router;
}
