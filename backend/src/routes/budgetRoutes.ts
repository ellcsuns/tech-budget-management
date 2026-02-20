import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { BudgetService } from '../services/BudgetService';

export function budgetRouter(prisma: PrismaClient) {
  const router = Router();
  const budgetService = new BudgetService(prisma);

  router.post('/', async (req, res, next) => {
    try { res.status(201).json(await budgetService.createBudget(req.body)); }
    catch (error: any) {
      if (error.message?.includes('Ya existe')) return res.status(409).json({ error: error.message });
      next(error);
    }
  });

  router.get('/active', async (req, res, next) => {
    try {
      const budget = await budgetService.getActiveBudget();
      if (!budget) return res.status(404).json({ error: 'No active budget found' });
      res.json(budget);
    } catch (error) { next(error); }
  });

  router.post('/:id/set-active', async (req, res, next) => {
    try { res.json(await budgetService.setActiveBudget(req.params.id)); }
    catch (error: any) {
      if (error.message?.includes('no encontrado')) return res.status(404).json({ error: error.message });
      next(error);
    }
  });

  router.post('/:id/submit-review', async (req, res, next) => {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) return res.status(401).json({ error: 'No autenticado' });
      res.json(await budgetService.submitForReview(req.params.id, userId));
    } catch (error: any) {
      if (error.message?.includes('no encontrado')) return res.status(404).json({ error: error.message });
      if (error.message?.includes('ya está')) return res.status(409).json({ error: error.message });
      next(error);
    }
  });

  router.get('/compare', async (req, res, next) => {
    try {
      const { budgetA, budgetB } = req.query;
      if (!budgetA || !budgetB) return res.status(400).json({ error: 'budgetA and budgetB are required' });
      res.json(await budgetService.compareBudgets(budgetA as string, budgetB as string));
    } catch (error: any) {
      if (error.message?.includes('same year')) return res.status(400).json({ error: error.message });
      if (error.message?.includes('not found')) return res.status(404).json({ error: error.message });
      next(error);
    }
  });

  router.get('/:id', async (req, res, next) => {
    try {
      const budget = await budgetService.getBudget(req.params.id);
      if (!budget) return res.status(404).json({ error: 'Presupuesto no encontrado' });
      res.json(budget);
    } catch (error) { next(error); }
  });

  router.get('/', async (req, res, next) => {
    try {
      const year = req.query.year ? parseInt(req.query.year as string) : null;
      res.json(year ? await budgetService.getBudgetsByYear(year) : await budgetService.getAllBudgets());
    } catch (error) { next(error); }
  });

  router.put('/:id', async (req, res, next) => {
    try { res.json(await budgetService.updateBudget(req.params.id, req.body)); }
    catch (error) { next(error); }
  });

  router.delete('/:id', async (req, res, next) => {
    try { await budgetService.deleteBudget(req.params.id); res.status(204).send(); }
    catch (error: any) {
      if (error.message?.includes('vigente')) return res.status(400).json({ error: error.message });
      next(error);
    }
  });

  router.post('/:id/versions', async (req, res, next) => {
    try {
      const { planValueChanges } = req.body;
      res.status(201).json(await budgetService.createNewVersion(req.params.id, planValueChanges || []));
    } catch (error) { next(error); }
  });

  router.post('/:id/budget-lines', async (req, res, next) => {
    try {
      const { expenseId, financialCompanyId, technologyDirectionId } = req.body;
      res.status(201).json(await budgetService.addBudgetLine(req.params.id, expenseId, financialCompanyId, technologyDirectionId));
    } catch (error: any) {
      if (error.message?.includes('Ya existe')) return res.status(409).json({ error: error.message });
      if (error.message?.includes('no encontrad')) return res.status(404).json({ error: error.message });
      next(error);
    }
  });

  router.delete('/:id/budget-lines/:budgetLineId', async (req, res, next) => {
    try { await budgetService.removeBudgetLine(req.params.budgetLineId); res.status(204).send(); }
    catch (error) { next(error); }
  });

  return router;
}
