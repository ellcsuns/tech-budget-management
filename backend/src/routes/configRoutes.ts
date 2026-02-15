import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { ConfigService } from '../services/ConfigService';

export function configRouter(prisma: PrismaClient) {
  const router = Router();
  const service = new ConfigService(prisma);

  // GET /api/config/:key
  router.get('/:key', async (req, res, next) => {
    try {
      const value = await service.get(req.params.key);
      res.json({ key: req.params.key, value });
    } catch (error) { next(error); }
  });

  // PUT /api/config/:key
  router.put('/:key', async (req, res, next) => {
    try {
      const { value } = req.body;
      if (req.params.key === 'locale') {
        await service.setLocale(value);
      } else {
        await service.set(req.params.key, value);
      }
      res.json({ key: req.params.key, value });
    } catch (error: any) {
      if (error.message?.includes('Invalid locale')) return res.status(400).json({ error: error.message });
      next(error);
    }
  });

  return router;
}
