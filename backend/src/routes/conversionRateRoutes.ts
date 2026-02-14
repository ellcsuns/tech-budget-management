import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { CurrencyConverterService } from '../services/CurrencyConverterService';

export function conversionRateRouter(prisma: PrismaClient) {
  const router = Router();
  const currencyConverterService = new CurrencyConverterService(prisma);

  // POST /api/conversion-rates - Configurar tasa
  router.post('/', async (req, res, next) => {
    try {
      const conversionRate = await currencyConverterService.setConversionRate(req.body);
      res.status(201).json(conversionRate);
    } catch (error) {
      next(error);
    }
  });

  // GET /api/conversion-rates?budgetId=:id - Obtener historial por presupuesto
  router.get('/', async (req, res, next) => {
    try {
      const budgetId = req.query.budgetId as string;
      if (!budgetId) {
        return res.status(400).json({ error: 'budgetId es requerido' });
      }
      const conversionRates = await currencyConverterService.getConversionHistory(budgetId);
      res.json(conversionRates);
    } catch (error) {
      next(error);
    }
  });

  // GET /api/conversion-rates/:budgetId/:currency/:month - Obtener tasa específica
  router.get('/:budgetId/:currency/:month', async (req, res, next) => {
    try {
      const { budgetId, currency, month } = req.params;
      const conversionRate = await currencyConverterService.getConversionRate(
        budgetId,
        currency,
        parseInt(month)
      );
      if (!conversionRate) {
        return res.status(404).json({ error: 'Tasa de conversión no encontrada' });
      }
      res.json(conversionRate);
    } catch (error) {
      next(error);
    }
  });

  // DELETE /api/conversion-rates/:budgetId/:currency/:month - Eliminar tasa
  router.delete('/:budgetId/:currency/:month', async (req, res, next) => {
    try {
      const { budgetId, currency, month } = req.params;
      await currencyConverterService.deleteConversionRate(budgetId, currency, parseInt(month));
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  return router;
}
