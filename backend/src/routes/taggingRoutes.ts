import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { TaggingService } from '../services/TaggingService';

export function taggingRouter(prisma: PrismaClient) {
  const router = Router();
  const taggingService = new TaggingService(prisma);

  // Tag Definitions
  router.post('/', async (req, res, next) => {
    try {
      const tagDefinition = await taggingService.createTagDefinition(req.body);
      res.status(201).json(tagDefinition);
    } catch (error) {
      next(error);
    }
  });

  router.get('/', async (req, res, next) => {
    try {
      const tagDefinitions = await taggingService.getTagDefinitions();
      res.json(tagDefinitions);
    } catch (error) {
      next(error);
    }
  });

  router.get('/:id', async (req, res, next) => {
    try {
      const tagDefinition = await taggingService.getTagDefinition(req.params.id);
      if (!tagDefinition) {
        return res.status(404).json({ error: 'Definición de etiqueta no encontrada' });
      }
      res.json(tagDefinition);
    } catch (error) {
      next(error);
    }
  });

  router.put('/:id', async (req, res, next) => {
    try {
      const tagDefinition = await taggingService.updateTagDefinition(req.params.id, req.body);
      res.json(tagDefinition);
    } catch (error) {
      next(error);
    }
  });

  router.delete('/:id', async (req, res, next) => {
    try {
      await taggingService.deleteTagDefinition(req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  return router;
}
