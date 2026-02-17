import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuditService } from '../services/AuditService';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Map route patterns to entity/action descriptions for mutating operations
const ROUTE_MAP: Record<string, { entity: string; actions: Record<string, string> }> = {
  '/api/auth/login': { entity: 'Session', actions: { POST: 'LOGIN' } },
  '/api/auth/logout': { entity: 'Session', actions: { POST: 'LOGOUT' } },
  '/api/budgets': { entity: 'Budget', actions: { POST: 'CREATE', PUT: 'UPDATE', DELETE: 'DELETE' } },
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

// Special sub-path patterns for mutating operations
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

// Navigation / module access tracking (GET requests)
const NAVIGATION_MAP: Record<string, string> = {
  '/api/budgets': 'Budgets',
  '/api/budget-lines': 'BudgetLines',
  '/api/transactions': 'Transactions',
  '/api/expenses': 'Expenses',
  '/api/expenses-enhanced': 'Expenses',
  '/api/savings': 'Savings',
  '/api/deferrals': 'Deferrals',
  '/api/change-requests': 'ChangeRequests',
  '/api/users': 'Users',
  '/api/roles': 'Roles',
  '/api/conversion-rates': 'ConversionRates',
  '/api/config': 'SystemConfig',
  '/api/translations': 'Translations',
  '/api/technology-directions': 'TechnologyDirections',
  '/api/user-areas': 'UserAreas',
  '/api/financial-companies': 'FinancialCompanies',
  '/api/tag-definitions': 'TagDefinitions',
  '/api/reports': 'Reports',
  '/api/audit': 'AuditLogs',
  '/api/budgets/compare': 'BudgetCompare',
  '/api/budgets/active': 'BudgetActive',
};

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

function resolveNavigation(path: string): string | null {
  // Check specific paths first (longer matches)
  if (path === '/api/budgets/compare' || path.startsWith('/api/budgets/compare?')) return 'BudgetCompare';
  if (path === '/api/budgets/active') return 'BudgetActive';
  if (path.startsWith('/api/audit/actions') || path.startsWith('/api/audit/entities')) return null; // skip filter helpers

  for (const [route, module] of Object.entries(NAVIGATION_MAP)) {
    if (path === route || path.startsWith(route + '?') || path.startsWith(route + '/')) {
      return module;
    }
  }
  return null;
}

function extractEntityId(path: string): string | undefined {
  const match = path.match(/\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
  return match ? match[1] : undefined;
}

function sanitizeBody(body: any): any {
  if (!body || typeof body !== 'object') return body;
  const sanitized = { ...body };
  delete sanitized.password;
  delete sanitized.passwordHash;
  delete sanitized.currentPassword;
  delete sanitized.newPassword;
  delete sanitized.token;
  return sanitized;
}

export function createAuditLogger(auditService: AuditService) {
  return (req: Request, res: Response, next: NextFunction) => {
    const method = req.method;
    const path = req.path;
    const userId = (req as any).user?.userId || undefined;
    const ip = getClientIp(req);

    // ========================================
    // 1) GET requests → log navigation/access
    // ========================================
    if (method === 'GET') {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        let tokenUserId: string | undefined;
        try {
          const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
          tokenUserId = decoded.userId;
        } catch { /* invalid token, skip */ }

        if (tokenUserId) {
          const module = resolveNavigation(path);
          if (module) {
            const entityId = extractEntityId(path);
            const queryParams = req.query && Object.keys(req.query).length > 0
              ? Object.fromEntries(Object.entries(req.query).map(([k, v]) => [k, String(v)]))
              : undefined;

            auditService.log({
              userId: tokenUserId,
              action: 'VIEW',
              entity: module,
              entityId,
              details: queryParams ? { filters: queryParams } : undefined,
              ipAddress: ip,
            });
          }
        }
      }
      return next();
    }

    // ========================================
    // 2) POST/PUT/DELETE → log mutations
    // ========================================
    const originalJson = res.json.bind(res);
    res.json = function (body: any) {
      const statusCode = res.statusCode;

      // Log successful mutations (2xx)
      if (statusCode >= 200 && statusCode < 300) {
        const resolved = resolveRoute(method, path);
        if (resolved) {
          let logUserId = userId;
          if (path === '/api/auth/login' && body?.user?.id) {
            logUserId = body.user.id;
          }

          const details: any = {};
          if (method === 'POST' || method === 'PUT') {
            details.input = sanitizeBody(req.body);
          }
          if (method === 'DELETE') {
            details.deletedId = extractEntityId(path);
          }

          auditService.log({
            userId: logUserId,
            action: resolved.action,
            entity: resolved.entity,
            entityId: extractEntityId(path) || body?.id,
            details: Object.keys(details).length > 0 ? details : undefined,
            ipAddress: ip,
          });
        }
      }

      // Log failed login attempts (401)
      if (path === '/api/auth/login' && statusCode === 401) {
        auditService.log({
          userId: undefined,
          action: 'LOGIN_FAILED',
          entity: 'Session',
          details: { username: req.body?.username || 'unknown' },
          ipAddress: ip,
        });
      }

      return originalJson(body);
    };

    next();
  };
}
