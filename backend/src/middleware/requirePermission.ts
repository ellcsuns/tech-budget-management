import { Request, Response, NextFunction } from 'express';
import { PermissionType } from '@prisma/client';
import { PermissionService } from '../services/PermissionService';
import { MenuCode } from '../constants/menuCodes';

export function createRequirePermission(permissionService: PermissionService) {
  return (menuCode: MenuCode, permissionType: PermissionType) => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        // Check if user is authenticated
        if (!req.user) {
          res.status(401).json({ error: 'Not authenticated' });
          return;
        }

        // Check if user has required permission
        const hasPermission = await permissionService.hasPermission(
          req.user.userId,
          menuCode,
          permissionType
        );

        if (!hasPermission) {
          // Log permission denial for security auditing
          console.warn(`Permission denied: User ${req.user.username} (${req.user.userId}) attempted to access ${menuCode} with ${permissionType} permission`);

          res.status(403).json({
            error: 'Insufficient permissions',
            required: {
              menuCode,
              permissionType
            }
          });
          return;
        }

        next();
      } catch (error) {
        res.status(500).json({
          error: 'Permission validation failed',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    };
  };
}
