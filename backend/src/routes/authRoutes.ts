import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthService } from '../services/AuthService';
import { PasswordService } from '../services/PasswordService';
import { UserService } from '../services/UserService';
import { RoleService } from '../services/RoleService';
import { createAuthenticateJWT } from '../middleware/authenticateJWT';

export function authRouter(prisma: PrismaClient): Router {
  const router = Router();
  
  const passwordService = new PasswordService();
  const userService = new UserService(prisma, passwordService);
  const roleService = new RoleService(prisma);
  const authService = new AuthService(prisma, passwordService, userService, roleService);
  
  const authenticateJWT = createAuthenticateJWT(authService);

  /**
   * POST /api/auth/login
   * Authenticate user and return JWT token
   */
  router.post('/login', async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
      }

      const result = await authService.login(username, password);

      res.json(result);
    } catch (error) {
      console.error('Login error:', error);
      res.status(401).json({
        error: 'Authentication failed',
        message: error instanceof Error ? error.message : 'Invalid credentials'
      });
    }
  });

  /**
   * POST /api/auth/logout
   * Invalidate current session
   */
  router.post('/logout', authenticateJWT, async (req, res) => {
    try {
      const token = req.headers.authorization?.substring(7);
      
      if (token) {
        await authService.logout(token);
      }

      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        error: 'Logout failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * POST /api/auth/refresh
   * Refresh JWT token
   */
  router.post('/refresh', authenticateJWT, async (req, res) => {
    try {
      const token = req.headers.authorization?.substring(7);
      
      if (!token) {
        return res.status(400).json({ error: 'Token is required' });
      }

      const newToken = await authService.refreshToken(token);

      res.json({ token: newToken });
    } catch (error) {
      console.error('Token refresh error:', error);
      res.status(401).json({
        error: 'Token refresh failed',
        message: error instanceof Error ? error.message : 'Invalid token'
      });
    }
  });

  /**
   * GET /api/auth/me
   * Get current user information
   */
  router.get('/me', authenticateJWT, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const user = await userService.getUserWithPermissions(req.user.userId);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Remove password hash from response
      const { passwordHash, ...userWithoutPassword } = user;

      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Get current user error:', error);
      res.status(500).json({
        error: 'Failed to get user information',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  return router;
}
