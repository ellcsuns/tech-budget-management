import { Request, Response, NextFunction } from 'express';
import { AuditService } from '../services/AuditService';

// Map route patterns to entity/action descriptions
const ROUTE_MAP: Record<string, { entity: string; actions: Record<string, string> }> = {
  '/api/auth/login': { entity: 'Session', actions: { POST: 'LOGIN' } },
  '/api/auth/logout': { entity: 'Session', actions: { POST: 'LOGOUT' } },
  '/api/budgets': { entity: 'Budget', actions: { POST: 'CREATE' } },
  '/api/budget-lines': { entity: 'BudgetLine', actions: { POST: 'CREATE', PUT: 'UPDATE', DELETE: 'DELETE' } },
  '/api/transactions': { entity: 'Transaction', actions: { POST: 'CREATE', PUT: 'UPDATE', DELETE: 'DELETE' } },
  '/api/expenses': { entity: 'Expense', actions: { POST: 'CREATE', PUT: 'UPDATE', DELETE: 'DELETE' } },
  '/api/expenses-enhanced': { entity: 'Expense', actions: { POST: 'CREATE', PUT: 'UPDATE', DELETE: 'DELETE' } },
  '/api/savings': { entity: 'Saving', actions: { POST: 'CREATE', DELETE: 'DELETE' } },
  '/api/deferrals': { entity: 'Deferral', actions: { POST: 'CREATE', DELETE: 'DELETE' } },
  '/api/change-requests': { entity: 'ChangeRequest', actions: { POST: 'CREATE' } },
  '/api/users': { entity: 'User', actions: { POST: 'CREATE', PUT: 'UPDATE', DELETE: 'DELETE' } },
  '/api/roles': { entity: 'Role', actions: { POST: 'CREATE', PUT: 'UPDATE', DELETE: 'DELETE' } },
  '/api/conversion-rates': { entity: 'ConversionRate', actions: { POST: 'CREATE', DELETE: 'DELETE' } },
  '/api/config': { entity: 'SystemConfig', actions: { PUT: 'UPDATE' } },
  '/api/translations': { entity: 'Translation', actions: { POST: 'CREATE', PUT: 'UPDATE', DELETE: 'DELETE' } },
  '/api/technology-directions': { entity: 'TechnologyDirection', actions: { POST: 'CREATE', PUT: 'UPDATE', DELETE: 'DELETE' } },
  '/api/user-areas': { entity: 'UserArea', actions: { POST: 'CREATE', PUT: 'UPDATE', DELETE: 'DELETE' } },
  '/api/financial-companies': { entity: 'FinancialCompany', actions: { POST: 'CREATE', PUT: 'UPDATE', DELETE: 'DELETE' } },
  '/api/tag-definitions': { entity: 'TagDefinition', actions: { POST: 'CREATE', PUT: 'UPDATE', DELETE: 'DELETE' } },
};

// Special sub-path patterns
const SPECIAL_PATTERNS: Array<{ pattern: RegExp; entity: string; action: string }> = [
  { pattern: /\/api\/change-requests\/[^/]+\/approve/, entity: 'ChangeRequest', action: 'APPROVE' },
  { pattern: /\/api\/change-requests\/[^/]+\/reject/, entity: 'ChangeRequest', action: 'REJECT' },
  { pattern: /\/api\/savings\/approve/, entity: 'Saving', action: 'APPROVE' },
  { pattern: /\/api\/budgets\/[^/]+\/versions/, entity: 'Budget', action: 'CREATE_VERSION' },
  { pattern: /\/api\/budgets\/[^/]+\/budget-lines/, entity: 'BudgetLine', action: 'ADD_TO_BUDGET' },
  { pattern: /\/api\/expenses-enhanced\/[^/]+\/tags/, entity: 'ExpenseTag', action: 'MODIFY_TAG' },
  { pattern: /\/api\/users\/[^/]+\/status/, entity: 'User', action: 'CHANGE_STATUS' },
  { pattern: /\/api\/users\/[^/]+\/password/, entity: 'User', action: 'CHANGE_PASSWORD' },
];

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}

function resolveRoute(method: string, path: string): { entity: string; action: string } | null {
  // Check special patterns first
  for (const sp of SPECIAL_PATTERNS) {
    if (sp.pattern.test(path) && method === 'POST') {
      return { entity: sp.entity, action: sp.action };
    }
  }

  // Check base routes
  for (const [route, config] of Object.entries(ROUTE_MAP)) {
    if (path === route || path.startsWith(route + '/')) {
      const action = config.actions[method];
      if (action) return { entity: config.entity, action };
    }
  }

  return null;
}

function extractEntityId(path: string): string | undefined {
  // Match UUID in path: /api/something/uuid-here or /api/something/uuid-here/action
  const match = path.match(/\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
  return match ? match[1] : undefined;
}

function sanitizeBody(body: any): any {
  if (!body || typeof body !== 'object') return body;
  const sanitized = { ...body };
  // Remove sensitive fields
  delete sanitized.password;
  delete sanitized.passwordHash;
  delete sanitized.currentPassword;
  delete sanitized.newPassword;
  delete sanitized.token;
  return sanitized;
}

export function createAuditLogger(auditService: AuditService) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Only audit mutating methods + login
    const method = req.method;
    if (method !== 'POST' && method !== 'PUT' && method !== 'DELETE') {
      return next();
    }

    const originalJson = res.json.bind(res);
    res.json = function (body: any) {
      // Log after response is sent (async, non-blocking)
      const statusCode = res.statusCode;
      if (statusCode >= 200 && statusCode < 300) {
        const resolved = resolveRoute(method, req.path);
        if (resolved) {
          const userId = (req as any).user?.userId || undefined;
          const entityId = extractEntityId(req.path) || body?.id;

          // For login, extract userId from response
          let loginUserId = userId;
          if (req.path === '/api/auth/login' && body?.user?.id) {
            loginUserId = body.user.id;
          }

          const details: any = {};
          if (method === 'POST' || method === 'PUT') {
            details.input = sanitizeBody(req.body);
          }
          if (method === 'DELETE') {
            details.deletedId = entityId;
          }

          auditService.log({
            userId: loginUserId,
            action: resolved.action,
            entity: resolved.entity,
            entityId: typeof entityId === 'string' ? entityId : undefined,
            details: Object.keys(details).length > 0 ? details : undefined,
            ipAddress: getClientIp(req),
          });
        }
      }

      return originalJson(body);
    };

    next();
  };
}
