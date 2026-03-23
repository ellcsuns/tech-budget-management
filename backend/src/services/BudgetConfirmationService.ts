import { PrismaClient, ConfirmationResponseStatus } from '@prisma/client';

export class BudgetConfirmationService {
  constructor(private prisma: PrismaClient) {}

  async createMassiveRequest(budgetId: string, requestedById: string) {
    // Get all budget lines for this budget with their expense userAreas
    const budgetLines = await this.prisma.budgetLine.findMany({
      where: { budgetId },
      include: { expense: true }
    });

    if (budgetLines.length === 0) {
      throw new Error('No hay líneas de presupuesto en este presupuesto');
    }

    // Collect all unique userArea IDs from expenses
    const allUserAreaIds = new Set<string>();
    budgetLines.forEach(bl => {
      (bl.expense.userAreas || []).forEach(areaId => allUserAreaIds.add(areaId));
    });

    // Find users that have a technologyDirection or are active
    const users = await this.prisma.user.findMany({
      where: { active: true },
      select: { id: true, fullName: true, username: true }
    });

    if (users.length === 0) {
      throw new Error('No hay usuarios activos para solicitar confirmación');
    }

    // Create the request with responses for all active users
    return await this.prisma.budgetConfirmationRequest.create({
      data: {
        budgetId,
        requestedById,
        type: 'MASSIVE',
        responses: {
          create: users.map(u => ({ userId: u.id }))
        }
      },
      include: {
        responses: { include: { user: { select: { id: true, fullName: true, username: true } } } },
        requestedBy: { select: { id: true, fullName: true, username: true } }
      }
    });
  }

  async createIndividualRequest(budgetId: string, userId: string, requestedById: string) {
    // Check if there's already a pending request for this user on this budget
    const existing = await this.prisma.budgetConfirmationResponse.findFirst({
      where: {
        userId,
        status: ConfirmationResponseStatus.PENDING,
        request: { budgetId, status: 'OPEN' }
      }
    });

    if (existing) {
      throw new Error('Ya existe una solicitud pendiente para este usuario en este presupuesto');
    }

    return await this.prisma.budgetConfirmationRequest.create({
      data: {
        budgetId,
        requestedById,
        type: 'INDIVIDUAL',
        responses: {
          create: [{ userId }]
        }
      },
      include: {
        responses: { include: { user: { select: { id: true, fullName: true, username: true } } } },
        requestedBy: { select: { id: true, fullName: true, username: true } }
      }
    });
  }

  async getAllRequests(budgetId?: string) {
    const where: any = {};
    if (budgetId) where.budgetId = budgetId;

    const requests = await this.prisma.budgetConfirmationRequest.findMany({
      where,
      include: {
        requestedBy: { select: { id: true, fullName: true, username: true } },
        _count: { select: { responses: true } },
        responses: { select: { status: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return requests.map(r => {
      const confirmedCount = r.responses.filter(resp => resp.status === 'CONFIRMED').length;
      const totalCount = r._count.responses;
      return {
        id: r.id,
        budgetId: r.budgetId,
        requestedById: r.requestedById,
        requestedBy: r.requestedBy,
        type: r.type,
        status: r.status,
        confirmedCount,
        pendingCount: totalCount - confirmedCount,
        totalCount,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt
      };
    });
  }

  async getRequestDetail(requestId: string) {
    const request = await this.prisma.budgetConfirmationRequest.findUnique({
      where: { id: requestId },
      include: {
        requestedBy: { select: { id: true, fullName: true, username: true } },
        responses: {
          include: { user: { select: { id: true, fullName: true, username: true } } },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!request) throw new Error('Solicitud no encontrada');
    return request;
  }

  async confirmResponse(requestId: string, userId: string) {
    const response = await this.prisma.budgetConfirmationResponse.findUnique({
      where: { requestId_userId: { requestId, userId } }
    });

    if (!response) throw new Error('No se encontró una respuesta de confirmación para este usuario');
    if (response.status === 'CONFIRMED') throw new Error('Ya confirmaste esta solicitud');

    return await this.prisma.budgetConfirmationResponse.update({
      where: { id: response.id },
      data: { status: ConfirmationResponseStatus.CONFIRMED, confirmedAt: new Date() },
      include: { request: true, user: { select: { id: true, fullName: true, username: true } } }
    });
  }

  async getMyPending(userId: string) {
    return await this.prisma.budgetConfirmationResponse.findMany({
      where: {
        userId,
        status: ConfirmationResponseStatus.PENDING,
        request: { status: 'OPEN' }
      },
      include: {
        request: {
          include: { requestedBy: { select: { id: true, fullName: true, username: true } } }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getPendingCount(userId: string): Promise<number> {
    return await this.prisma.budgetConfirmationResponse.count({
      where: {
        userId,
        status: ConfirmationResponseStatus.PENDING,
        request: { status: 'OPEN' }
      }
    });
  }

  async getUsersWithBudgetLines(budgetId: string) {
    // Get all active users to show in the admin panel
    const users = await this.prisma.user.findMany({
      where: { active: true },
      select: { id: true, fullName: true, username: true }
    });
    return users;
  }
}
