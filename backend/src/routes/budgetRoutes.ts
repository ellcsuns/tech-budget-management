import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { BudgetService } from '../services/BudgetService';

export function budgetRouter(prisma: PrismaClient) {
  const router = Router();
  const budgetService = new BudgetService(prisma);

  // POST /api/budgets - Crear presupuesto
  router.post('/', async (req, res, next) => {
    try {
      const budget = await budgetService.createBudget(req.body);
      res.status(201).json(budget);
    } catch (error) {
      next(error);
    }
  });

  // GET /api/budgets/active - Get active budget
  router.get('/active', async (req, res, next) => {
    try {
      const budget = await budgetService.getActiveBudget();
      if (!budget) return res.status(404).json({ error: 'No active budget found' });
      res.json(budget);
    } catch (error) { next(error); }
  });

  // GET /api/budgets/compare - Compare two budgets
  router.get('/compare', async (req, res, next) => {
    try {
      const { budgetA, budgetB } = req.query;
      if (!budgetA || !budgetB) return res.status(400).json({ error: 'budgetA and budgetB are required' });
      const result = await budgetService.compareBudgets(budgetA as string, budgetB as string);
      res.json(result);
    } catch (error: any) {
      if (error.message?.includes('same year')) return res.status(400).json({ error: error.message });
      if (error.message?.includes('not found')) return res.status(404).json({ error: error.message });
      next(error);
    }
  });

  // GET /api/budgets/:id - Obtener presupuesto por ID
  router.get('/:id', async (req, res, next) => {
    try {
      const budget = await budgetService.getBudget(req.params.id);
      if (!budget) {
        return res.status(404).json({ error: 'Presupuesto no encontrado' });
      }
      res.json(budget);
    } catch (error) {
      next(error);
    }
  });

  // GET /api/budgets?year=:year - Listar presupuestos por año o todos
  router.get('/', async (req, res, next) => {
    try {
      const year = req.query.year ? parseInt(req.query.year as string) : null;
      
      if (year) {
        const budgets = await budgetService.getBudgetsByYear(year);
        res.json(budgets);
      } else {
        const budgets = await budgetService.getAllBudgets();
        res.json(budgets);
      }
    } catch (error) {
      next(error);
    }
  });

  // PUT /api/budgets/:id - Actualizar presupuesto
  router.put('/:id', async (req, res, next) => {
    try {
      const budget = await budgetService.updateBudget(req.params.id, req.body);
      res.json(budget);
    } catch (error) {
      next(error);
    }
  });

  // DELETE /api/budgets/:id - Eliminar presupuesto
  router.delete('/:id', async (req, res, next) => {
    try {
      await budgetService.deleteBudget(req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  // POST /api/budgets/:id/versions - Crear nueva versión del presupuesto
  router.post('/:id/versions', async (req, res, next) => {
    try {
      const { planValueChanges } = req.body;
      const newBudget = await budgetService.createNewVersion(req.params.id, planValueChanges || []);
      res.status(201).json(newBudget);
    } catch (error) {
      next(error);
    }
  });

  // POST /api/budgets/:id/expenses - Agregar gasto al presupuesto
  router.post('/:id/expenses', async (req, res, next) => {
    try {
      const { expenseCode } = req.body;
      const expense = await budgetService.addExpenseToBudget(req.params.id, expenseCode);
      res.status(201).json(expense);
    } catch (error) {
      next(error);
    }
  });

  // DELETE /api/budgets/:id/expenses/:expenseId - Eliminar gasto del presupuesto
  router.delete('/:id/expenses/:expenseId', async (req, res, next) => {
    try {
      await budgetService.removeExpenseFromBudget(req.params.id, req.params.expenseId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  return router;
}
