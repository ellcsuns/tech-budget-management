import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { BudgetLineService } from '../services/BudgetLineService';

export function budgetLineRouter(prisma: PrismaClient) {
  const router = Router();
  const budgetLineService = new BudgetLineService(prisma);

  router.get('/', async (req, res, next) => {
    try {
      const budgetId = req.query.budgetId as string;
      if (!budgetId) return res.status(400).json({ error: 'budgetId es requerido' });
      const lines = await budgetLineService.getBudgetLinesByBudget(budgetId);
      res.json(lines);
    } catch (error) { next(error); }
  });

  router.get('/:id', async (req, res, next) => {
    try {
      const line = await budgetLineService.getBudgetLine(req.params.id);
      if (!line) return res.status(404).json({ error: 'Línea de presupuesto no encontrada' });
      res.json(line);
    } catch (error) { next(error); }
  });

  router.post('/', async (req, res, next) => {
    try {
      const line = await budgetLineService.createBudgetLine(req.body);
      res.status(201).json(line);
    } catch (error: any) {
      if (error.message?.includes('Ya existe')) return res.status(409).json({ error: error.message });
      if (error.message?.includes('no encontrad')) return res.status(404).json({ error: error.message });
      next(error);
    }
  });

  router.put('/:id', async (req, res, next) => {
    try {
      const line = await budgetLineService.updatePlanValues(req.params.id, req.body);
      res.json(line);
    } catch (error: any) {
      if (error.message?.includes('no encontrada')) return res.status(404).json({ error: error.message });
      next(error);
    }
  });

  router.delete('/:id', async (req, res, next) => {
    try {
      await budgetLineService.deleteBudgetLine(req.params.id);
      res.status(204).send();
    } catch (error) { next(error); }
  });

  return router;
}
