import { Router } from 'express';
import { PrismaClient, TransactionType } from '@prisma/client';
import { TransactionService } from '../services/TransactionService';

export function transactionRouter(prisma: PrismaClient) {
  const router = Router();
  const transactionService = new TransactionService(prisma);

  router.post('/', async (req, res, next) => {
    try {
      const transaction = await transactionService.createTransaction(req.body);
      res.status(201).json(transaction);
    } catch (error: any) {
      if (error.message?.includes('no encontrad') || error.message?.includes('not found')) return res.status(404).json({ error: error.message });
      if (error.message?.includes('Ya existe') || error.message?.includes('ya está compensada')) return res.status(409).json({ error: error.message });
      next(error);
    }
  });

  router.get('/', async (req, res, next) => {
    try {
      const budgetLineId = req.query.budgetLineId as string;
      const type = req.query.type as string;

      if (type && !budgetLineId) {
        const transactions = await transactionService.getTransactionsByType(type as TransactionType);
        return res.json(transactions);
      }

      if (!budgetLineId) return res.status(400).json({ error: 'budgetLineId o type es requerido' });

      if (req.query.uncompensated === 'true') {
        const transactions = await transactionService.getUncompensatedCommitted(budgetLineId);
        return res.json(transactions);
      }

      const transactions = await transactionService.getTransactionsByBudgetLine(budgetLineId);
      res.json(transactions);
    } catch (error) { next(error); }
  });

  router.get('/:id', async (req, res, next) => {
    try {
      const transaction = await transactionService.getTransaction(req.params.id);
      if (!transaction) return res.status(404).json({ error: 'Transacción no encontrada' });
      res.json(transaction);
    } catch (error) { next(error); }
  });

  router.put('/:id', async (req, res, next) => {
    try {
      const transaction = await transactionService.updateTransaction(req.params.id, req.body);
      res.json(transaction);
    } catch (error) { next(error); }
  });

  router.delete('/:id', async (req, res, next) => {
    try {
      await transactionService.deleteTransaction(req.params.id);
      res.status(204).send();
    } catch (error) { next(error); }
  });

  return router;
}
