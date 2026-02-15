import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { TranslationService } from '../services/TranslationService';

export function translationRouter(prisma: PrismaClient) {
  const router = Router();
  const service = new TranslationService(prisma);

  // GET /api/translations - List all with pagination and search
  router.get('/', async (req, res, next) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const search = req.query.search as string | undefined;
      const category = req.query.category as string | undefined;
      const result = await service.getAll(page, limit, search, category);
      res.json(result);
    } catch (error) { next(error); }
  });

  // GET /api/translations/locale/:locale - Get translations map by locale
  router.get('/locale/:locale', async (req, res, next) => {
    try {
      const map = await service.getByLocale(req.params.locale);
      res.json(map);
    } catch (error) { next(error); }
  });

  // POST /api/translations - Create translation
  router.post('/', async (req, res, next) => {
    try {
      const translation = await service.create(req.body);
      res.status(201).json(translation);
    } catch (error: any) {
      if (error.message === 'Key already exists') return res.status(409).json({ error: error.message });
      if (error.message === 'Key cannot be empty') return res.status(400).json({ error: error.message });
      next(error);
    }
  });

  // PUT /api/translations/:id - Update translation
  router.put('/:id', async (req, res, next) => {
    try {
      const translation = await service.update(req.params.id, req.body);
      res.json(translation);
    } catch (error) { next(error); }
  });

  // DELETE /api/translations/:id - Delete translation
  router.delete('/:id', async (req, res, next) => {
    try {
      await service.delete(req.params.id);
      res.status(204).send();
    } catch (error) { next(error); }
  });

  return router;
}
