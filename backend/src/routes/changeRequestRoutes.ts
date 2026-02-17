import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { ChangeRequestService } from '../services/ChangeRequestService';

export function changeRequestRouter(prisma: PrismaClient) {
  const router = Router();
  const service = new ChangeRequestService(prisma);

  router.post('/', async (req: any, res, next) => {
    try {
      const userId = req.user?.userId;
      if (!userId) return res.status(401).json({ error: 'No autenticado' });
      const result = await service.createChangeRequest(req.body, userId);
      res.status(201).json(result);
    } catch (error: any) {
      if (error.message?.includes('no encontrad')) return res.status(404).json({ error: error.message });
      next(error);
    }
  });

  router.get('/pending', async (req: any, res, next) => {
    try {
      const userId = req.user?.userId;
      if (!userId) return res.status(401).json({ error: 'No autenticado' });
      res.json(await service.getPendingForApprover(userId));
    } catch (error) { next(error); }
  });

  router.post('/:id/approve', async (req: any, res, next) => {
    try {
      const userId = req.user?.userId;
      if (!userId) return res.status(401).json({ error: 'No autenticado' });
      res.json(await service.approveRequest(req.params.id, userId));
    } catch (error: any) {
      if (error.message?.includes('no encontrad') || error.message?.includes('ya fue')) return res.status(400).json({ error: error.message });
      next(error);
    }
  });

  router.post('/:id/reject', async (req: any, res, next) => {
    try {
      const userId = req.user?.userId;
      if (!userId) return res.status(401).json({ error: 'No autenticado' });
      res.json(await service.rejectRequest(req.params.id, userId));
    } catch (error: any) {
      if (error.message?.includes('no encontrad') || error.message?.includes('ya fue')) return res.status(400).json({ error: error.message });
      next(error);
    }
  });

  return router;
}
