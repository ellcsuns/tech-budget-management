import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { ReportService } from '../services/ReportService';

export function reportRouter(prisma: PrismaClient) {
  const router = Router();
  const reportService = new ReportService(prisma);

  // GET /api/reports/:type - Generate report data
  router.get('/:type', async (req, res, next) => {
    try {
      const { type } = req.params;
      const filters = req.query as Record<string, string>;
      const data = await reportService.getReport(type, filters);
      res.json(data);
    } catch (error: any) {
      if (error.message === 'budgetId is required' || error.message === 'Invalid report type') {
        return res.status(400).json({ error: error.message });
      }
      next(error);
    }
  });

  return router;
}
