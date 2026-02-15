import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { TransactionService } from '../services/TransactionService';

export function transactionRouter(prisma: PrismaClient) {
  const router = Router();
  const transactionService = new TransactionService(prisma);

  router.post('/', async (req, res, next) => {
    try {
      const transaction = await transactionService.createTransaction(req.body);
      res.status(201).json(transaction);
    } catch (error) {
      next(error);
    }
  });

  router.get('/', async (req, res, next) => {
    try {
      const expenseId = req.query.expenseId as string;
      const month = req.query.month ? parseInt(req.query.month as string) : null;
      const type = req.query.type as string;

      if (!expenseId && !type) {
        return res.status(400).json({ error: 'expenseId o type es requerido' });
      }

      // If filtering by type only (no expenseId), return all transactions of that type
      if (type && !expenseId) {
        const transactions = await prisma.transaction.findMany({
          where: { type: type as any },
          orderBy: { createdAt: 'desc' },
          include: { expense: true }
        });
        return res.json(transactions);
      }

      if (month) {
        const transactions = await transactionService.getTransactionsByMonth(expenseId, month);
        res.json(transactions);
      } else {
        const transactions = await transactionService.getTransactionsByExpense(expenseId);
        res.json(transactions);
      }
    } catch (error) {
      next(error);
    }
  });

  router.get('/:id', async (req, res, next) => {
    try {
      const transaction = await transactionService.getTransaction(req.params.id);
      if (!transaction) {
        return res.status(404).json({ error: 'Transacción no encontrada' });
      }
      res.json(transaction);
    } catch (error) {
      next(error);
    }
  });

  router.put('/:id', async (req, res, next) => {
    try {
      const transaction = await transactionService.updateTransaction(req.params.id, req.body);
      res.json(transaction);
    } catch (error) {
      next(error);
    }
  });

  router.delete('/:id', async (req, res, next) => {
    try {
      await transactionService.deleteTransaction(req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  return router;
}
