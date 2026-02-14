import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import { UserSession } from '../services/AuthService';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: UserSession;
    }
  }
}

export function createAuthenticateJWT(authService: AuthService) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Extract token from Authorization header
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'No token provided' });
        return;
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix

      // Validate token and get user session
      const userSession = await authService.validateToken(token);

      // Attach user to request
      req.user = userSession;

      next();
    } catch (error) {
      res.status(401).json({ 
        error: 'Invalid or expired token',
        message: error instanceof Error ? error.message : 'Authentication failed'
      });
    }
  };
}
