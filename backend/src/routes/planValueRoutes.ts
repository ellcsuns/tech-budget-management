import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { PlanValueService } from '../services/PlanValueService';

export function planValueRouter(prisma: PrismaClient) {
  const router = Router();
  const planValueService = new PlanValueService(prisma);

  router.post('/', async (req, res, next) => {
    try {
      const planValue = await planValueService.createPlanValue(req.body);
      res.status(201).json(planValue);
    } catch (error) {
      next(error);
    }
  });

  router.get('/', async (req, res, next) => {
    try {
      const expenseId = req.query.expenseId as string;
      if (!expenseId) {
        return res.status(400).json({ error: 'expenseId es requerido' });
      }
      const planValues = await planValueService.getPlanValuesByExpense(expenseId);
      res.json(planValues);
    } catch (error) {
      next(error);
    }
  });

  router.get('/:expenseId/monthly/:month', async (req, res, next) => {
    try {
      const { expenseId, month } = req.params;
      const planValue = await planValueService.getMonthlyPlan(expenseId, parseInt(month));
      res.json(planValue);
    } catch (error) {
      next(error);
    }
  });

  router.get('/:expenseId/total', async (req, res, next) => {
    try {
      const total = await planValueService.getTotalPlan(req.params.expenseId);
      res.json(total);
    } catch (error) {
      next(error);
    }
  });

  router.get('/:id', async (req, res, next) => {
    try {
      const planValue = await planValueService.getPlanValue(req.params.id);
      if (!planValue) {
        return res.status(404).json({ error: 'Valor plan no encontrado' });
      }
      res.json(planValue);
    } catch (error) {
      next(error);
    }
  });

  router.put('/:id', async (req, res, next) => {
    try {
      const planValue = await planValueService.updatePlanValue(req.params.id, req.body);
      res.json(planValue);
    } catch (error) {
      next(error);
    }
  });

  router.delete('/:id', async (req, res, next) => {
    try {
      await planValueService.deletePlanValue(req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  return router;
}
