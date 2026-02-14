import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { MasterDataService } from '../services/MasterDataService';

export function masterDataRouter(prisma: PrismaClient, type: 'TECH_DIRECTION' | 'USER_AREA' | 'FINANCIAL_COMPANY') {
  const router = Router();
  const masterDataService = new MasterDataService(prisma);

  const methods = {
    TECH_DIRECTION: {
      create: masterDataService.createTechnologyDirection.bind(masterDataService),
      getAll: masterDataService.getTechnologyDirections.bind(masterDataService),
      getOne: masterDataService.getTechnologyDirection.bind(masterDataService),
      update: masterDataService.updateTechnologyDirection.bind(masterDataService),
      delete: masterDataService.deleteTechnologyDirection.bind(masterDataService)
    },
    USER_AREA: {
      create: masterDataService.createUserArea.bind(masterDataService),
      getAll: masterDataService.getUserAreas.bind(masterDataService),
      getOne: masterDataService.getUserArea.bind(masterDataService),
      update: masterDataService.updateUserArea.bind(masterDataService),
      delete: masterDataService.deleteUserArea.bind(masterDataService)
    },
    FINANCIAL_COMPANY: {
      create: masterDataService.createFinancialCompany.bind(masterDataService),
      getAll: masterDataService.getFinancialCompanies.bind(masterDataService),
      getOne: masterDataService.getFinancialCompany.bind(masterDataService),
      update: masterDataService.updateFinancialCompany.bind(masterDataService),
      delete: masterDataService.deleteFinancialCompany.bind(masterDataService)
    }
  };

  const service = methods[type];

  router.post('/', async (req, res, next) => {
    try {
      const item = await service.create(req.body);
      res.status(201).json(item);
    } catch (error) {
      next(error);
    }
  });

  router.get('/', async (req, res, next) => {
    try {
      const items = await service.getAll();
      res.json(items);
    } catch (error) {
      next(error);
    }
  });

  router.get('/:id', async (req, res, next) => {
    try {
      const item = await service.getOne(req.params.id);
      if (!item) {
        return res.status(404).json({ error: 'Elemento no encontrado' });
      }
      res.json(item);
    } catch (error) {
      next(error);
    }
  });

  router.put('/:id', async (req, res, next) => {
    try {
      const item = await service.update(req.params.id, req.body);
      res.json(item);
    } catch (error) {
      next(error);
    }
  });

  router.delete('/:id', async (req, res, next) => {
    try {
      await service.delete(req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  return router;
}
