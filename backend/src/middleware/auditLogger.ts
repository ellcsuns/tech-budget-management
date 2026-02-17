import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { AuditService } from '../services/AuditService';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Entity mapping: route prefix → Prisma model name for fetching "before" state
const ENTITY_MAP: Record<string, { entity: string; model: string }> = {
  '/api/budgets': { entity: 'Budget', model: 'budget' },
  '/api/budget-lines': { entity: 'BudgetLine', model: 'budgetLine' },
  '/api/transactions': { entity: 'Transaction', model: 'transaction' },
  '/api/expenses': { entity: 'Expense', model: 'expense' },
  '/api/expenses-enhanced': { entity: 'Expense', model: 'expense' },
  '/api/savings': { entity: 'Saving', model: 'saving' },
  '/api/deferrals': { entity: 'Deferral', model: 'deferral' },
  '/api/change-requests': { entity: 'ChangeRequest', model: 'budgetLineChangeRequest' },
  '/api/users': { entity: 'User', model: 'user' },
  '/api/roles': { entity: 'Role', model: 'role' },
  '/api/conversion-rates': { entity: 'ConversionRate', model: 'conversionRate' },
  '/api/config': { entity: 'SystemConfig', model: 'systemConfig' },
  '/api/translations': { entity: 'Translation', model: 'translation' },
  '/api/technology-directions': { entity: 'TechnologyDirection', model: 'technologyDirection' },
  '/api/user-areas': { entity: 'UserArea', model: 'userArea' },
  '/api/financial-companies': { entity: 'FinancialCompany', model: 'financialCompany' },
  '/api/tag-definitions': { entity: 'TagDefinition', model: 'tagDefinition' },
};

// Special action patterns (POST sub-paths)
const SPECIAL_ACTIONS: Array<{ pattern: RegExp; entity: string; action: string }> = [
  { pattern: /\/api\/change-requests\/[^/]+\/approve/, entity: 'ChangeRequest', action: 'APPROVE' },
  { pattern: /\/api\/change-requests\/[^/]+\/reject/, entity: 'ChangeRequest', action: 'REJECT' },
  { pattern: /\/api\/savings\/approve/, entity: 'Saving', action: 'APPROVE' },
  { pattern: /\/api\/budgets\/[^/]+\/versions/, entity: 'Budget', action: 'CREATE_VERSION' },
  { pattern: /\/api\/budgets\/[^/]+\/budget-lines/, entity: 'BudgetLine', action: 'ADD_TO_BUDGET' },
  { pattern: /\/api\/expenses-enhanced\/[^/]+\/tags/, entity: 'ExpenseTag', action: 'MODIFY_TAG' },
  { pattern: /\/api\/users\/[^/]+\/status/, entity: 'User', action: 'CHANGE_STATUS' },
  { pattern: /\/api\/users\/[^/]+\/password/, entity: 'User', action: 'CHANGE_PASSWORD' },
];

// Navigation modules for GET tracking
const NAV_MAP: Record<string, string> = {
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
  '/api/translations': 'Translations',
  '/api/technology-directions': 'TechnologyDirections',
  '/api/user-areas': 'UserAreas',
  '/api/financial-companies': 'FinancialCompanies',
  '/api/tag-definitions': 'TagDefinitions',
  '/api/reports': 'Reports',
  '/api/audit': 'AuditLogs',
};

function extractUUID(path: string): string | undefined {
  const m = path.match(/\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
  return m ? m[1] : undefined;
}

function getUserIdFromToken(req: Request): string | undefined {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return undefined;
  try {
    const decoded = jwt.verify(auth.substring(7), JWT_SECRET) as { userId: string };
    return decoded.userId;
  } catch { return undefined; }
}

function sanitize(body: any): any {
  if (!body || typeof body !== 'object') return body;
  const s = { ...body };
  delete s.password; delete s.passwordHash; delete s.currentPassword;
  delete s.newPassword; delete s.token;
  return s;
}

function resolveWriteAction(method: string, path: string): { entity: string; action: string } | null {
  // Special patterns first
  for (const sp of SPECIAL_ACTIONS) {
    if (sp.pattern.test(path) && method === 'POST') {
      return { entity: sp.entity, action: sp.action };
    }
  }
  // Login/logout
  if (path === '/api/auth/login' && method === 'POST') return { entity: 'Session', action: 'LOGIN' };
  if (path === '/api/auth/logout' && method === 'POST') return { entity: 'Session', action: 'LOGOUT' };

  // Standard CRUD
  for (const [route, config] of Object.entries(ENTITY_MAP)) {
    if (path === route || path.startsWith(route + '/')) {
      if (method === 'POST') return { entity: config.entity, action: 'CREATE' };
      if (method === 'PUT') return { entity: config.entity, action: 'UPDATE' };
      if (method === 'DELETE') return { entity: config.entity, action: 'DELETE' };
    }
  }
  return null;
}

function resolveNavModule(path: string): string | null {
  // Skip audit sub-endpoints (actions, entities)
  if (path.startsWith('/api/audit/actions') || path.startsWith('/api/audit/entities')) return null;
  // Skip auth/me (called on every page load)
  if (path === '/api/auth/me') return null;

  for (const [route, mod] of Object.entries(NAV_MAP)) {
    if (path === route || path.startsWith(route + '?') || path.startsWith(route + '/')) {
      return mod;
    }
  }
  return null;
}

// Fetch the current record before it gets modified (for UPDATE/DELETE)
async function fetchBefore(prisma: PrismaClient, path: string, entityId: string | undefined): Promise<any> {
  if (!entityId) return undefined;
  for (const [route, config] of Object.entries(ENTITY_MAP)) {
    if (path === route || path.startsWith(route + '/')) {
      try {
        const model = (prisma as any)[config.model];
        if (model && typeof model.findUnique === 'function') {
          const record = await model.findUnique({ where: { id: entityId } });
          if (record) {
            // Remove internal/sensitive fields
            const clean = { ...record };
            delete clean.passwordHash;
            return clean;
          }
        }
      } catch { /* model might not support findUnique by id */ }
      return undefined;
    }
  }
  return undefined;
}

export function createAuditLogger(auditService: AuditService, prisma?: PrismaClient) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const method = req.method;
    const path = req.path;

    // ========================================
    // GET → log navigation (VIEW)
    // ========================================
    if (method === 'GET') {
      const uid = getUserIdFromToken(req);
      if (uid) {
        const mod = resolveNavModule(path);
        if (mod) {
          auditService.log({
            userId: uid,
            action: 'VIEW',
            entity: mod,
            details: undefined,
          });
        }
      }
      return next();
    }

    // ========================================
    // POST/PUT/DELETE → log writes with before/after
    // ========================================
    const entityId = extractUUID(path);
    let beforeState: any = undefined;

    // For UPDATE and DELETE, capture the "before" state
    if (prisma && (method === 'PUT' || method === 'DELETE') && entityId) {
      beforeState = await fetchBefore(prisma, path, entityId);
    }

    const originalJson = res.json.bind(res);
    res.json = function (body: any) {
      const statusCode = res.statusCode;
      const resolved = resolveWriteAction(method, path);

      // Successful write (2xx)
      if (statusCode >= 200 && statusCode < 300 && resolved) {
        let logUserId = (req as any).user?.userId || getUserIdFromToken(req);

        // For login, get userId from response
        if (path === '/api/auth/login' && body?.user?.id) {
          logUserId = body.user.id;
        }

        // Build details with before/after
        const details: any = {};

        if (method === 'POST' || method === 'PUT') {
          // "after" = the response body (the saved record) or the input
          if (beforeState) details.before = beforeState;
          // For the "after", use the response body (which is the updated record)
          // but sanitize it
          const afterData = body && typeof body === 'object' ? sanitize(body) : sanitize(req.body);
          details.after = afterData;
        }

        if (method === 'DELETE') {
          if (beforeState) details.before = beforeState;
          details.after = null;
        }

        auditService.log({
          userId: logUserId,
          action: resolved.action,
          entity: resolved.entity,
          details: Object.keys(details).length > 0 ? details : undefined,
        });
      }

      // Failed login → log attempt
      if (path === '/api/auth/login' && statusCode === 401) {
        auditService.log({
          userId: undefined,
          action: 'LOGIN_FAILED',
          entity: 'Session',
          details: { username: req.body?.username || 'unknown' },
        });
      }

      return originalJson(body);
    };

    next();
  };
}
