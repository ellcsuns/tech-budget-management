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

  return router;
}
