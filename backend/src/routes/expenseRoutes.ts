import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { ExpenseService } from '../services/ExpenseService';

export function expenseRouter(prisma: PrismaClient) {
  const router = Router();
  const expenseService = new ExpenseService(prisma);

  router.post('/', async (req, res, next) => {
    try {
      const { budgetId, ...data } = req.body;
      const expense = await expenseService.createExpense(budgetId, data);
      res.status(201).json(expense);
    } catch (error) {
      next(error);
    }
  });

  router.get('/:id', async (req, res, next) => {
    try {
      const expense = await expenseService.getExpense(req.params.id);
      if (!expense) {
        return res.status(404).json({ error: 'Gasto no encontrado' });
      }
      res.json(expense);
    } catch (error) {
      next(error);
    }
  });

  router.get('/', async (req, res, next) => {
    try {
      const budgetId = req.query.budgetId as string;
      if (!budgetId) {
        return res.status(400).json({ error: 'budgetId es requerido' });
      }
      const expenses = await expenseService.getExpensesByBudget(budgetId);
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

  router.put('/:id', async (req, res, next) => {
    try {
      const expense = await expenseService.updateExpense(req.params.id, req.body);
      res.json(expense);
    } catch (error) {
      next(error);
    }
  });

  router.delete('/:id', async (req, res, next) => {
    try {
      await expenseService.deleteExpense(req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  return router;
}
