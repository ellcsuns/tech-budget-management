import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { createAuthenticateJWT } from '../middleware/authenticateJWT';
import { AuthService } from '../services/AuthService';
import { PasswordService } from '../services/PasswordService';
import { UserService } from '../services/UserService';
import { RoleService } from '../services/RoleService';

export function userPreferenceRouter(prisma: PrismaClient) {
  const router = Router();

  const passwordService = new PasswordService();
  const userService = new UserService(prisma, passwordService);
  const roleService = new RoleService(prisma);
  const authService = new AuthService(prisma, passwordService, userService, roleService);
  const authenticateJWT = createAuthenticateJWT(authService);

  // GET /api/user-preferences - Get all preferences for current user
  router.get('/', authenticateJWT, async (req, res, next) => {
    try {
      const userId = req.user?.userId;
      if (!userId) return res.status(401).json({ error: 'Not authenticated' });

      const prefs = await prisma.userPreference.findMany({ where: { userId } });
      const result: Record<string, string> = {};
      prefs.forEach(p => { result[p.key] = p.value; });
      res.json(result);
    } catch (error) { next(error); }
  });

  // PUT /api/user-preferences - Bulk upsert preferences
  router.put('/', authenticateJWT, async (req, res, next) => {
    try {
      const userId = req.user?.userId;
      if (!userId) return res.status(401).json({ error: 'Not authenticated' });

      const prefs: Record<string, string> = req.body;
      const ops = Object.entries(prefs).map(([key, value]) =>
        prisma.userPreference.upsert({
          where: { userId_key: { userId, key } },
          update: { value },
          create: { userId, key, value },
        })
      );
      await Promise.all(ops);
      res.json({ success: true });
    } catch (error) { next(error); }
  });

  return router;
}
