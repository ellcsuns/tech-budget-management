import { PrismaClient } from '@prisma/client';

export interface AuditLogInput {
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  details?: any;
  ipAddress?: string;
}

export interface AuditFilters {
  userId?: string;
  action?: string;
  entity?: string;
  dateFrom?: string;
  dateTo?: string;
  page: number;
  pageSize: number;
}

export class AuditService {
  constructor(private prisma: PrismaClient) {}

  async log(input: AuditLogInput): Promise<void> {
    try {
      // Validate userId exists before inserting to avoid FK constraint violations
      let validUserId: string | null = input.userId || null;
      if (validUserId) {
        const user = await this.prisma.user.findUnique({ where: { id: validUserId }, select: { id: true } });
        if (!user) validUserId = null;
      }
      await this.prisma.auditLog.create({
        data: {
          userId: validUserId,
          action: input.action,
          entity: input.entity,
          entityId: input.entityId || null,
          details: input.details || null,
          ipAddress: input.ipAddress || null,
        }
      });
    } catch (error) {
      console.error('Audit log error:', error);
    }
  }

  async getLogs(filters: AuditFilters) {
    const where: any = {};

    if (filters.userId) where.userId = filters.userId;
    if (filters.action) where.action = filters.action;
    if (filters.entity) where.entity = filters.entity;
    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom);
      if (filters.dateTo) where.createdAt.lte = new Date(filters.dateTo + 'T23:59:59.999Z');
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        include: {
          user: { select: { id: true, username: true, fullName: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip: (filters.page - 1) * filters.pageSize,
        take: filters.pageSize,
      }),
      this.prisma.auditLog.count({ where })
    ]);

    return {
      logs,
      total,
      page: filters.page,
      pageSize: filters.pageSize,
      totalPages: Math.ceil(total / filters.pageSize),
    };
  }

  async getDistinctActions(): Promise<string[]> {
    const result = await this.prisma.auditLog.findMany({
      distinct: ['action'],
      select: { action: true },
      orderBy: { action: 'asc' }
    });
    return result.map((r: any) => r.action);
  }

  async getDistinctEntities(): Promise<string[]> {
    const result = await this.prisma.auditLog.findMany({
      distinct: ['entity'],
      select: { entity: true },
      orderBy: { entity: 'asc' }
    });
    return result.map((r: any) => r.entity);
  }
}
