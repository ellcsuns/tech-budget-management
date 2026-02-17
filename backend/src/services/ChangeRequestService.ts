import { PrismaClient, ChangeRequestStatus } from '@prisma/client';
import { ChangeRequestInput, MonthlyPlanValues } from '../types';

export class ChangeRequestService {
  constructor(private prisma: PrismaClient) {}

  async createChangeRequest(data: ChangeRequestInput, userId: string) {
    const budgetLine = await this.prisma.budgetLine.findUnique({
      where: { id: data.budgetLineId },
      include: { expense: true, financialCompany: true }
    });
    if (!budgetLine) throw new Error('Línea de presupuesto no encontrada');

    const currentValues: Record<string, number> = {};
    for (let m = 1; m <= 12; m++) {
      currentValues[`planM${m}`] = Number((budgetLine as any)[`planM${m}`]) || 0;
    }

    return await this.prisma.budgetLineChangeRequest.create({
      data: {
        budgetLineId: data.budgetLineId,
        requestedById: userId,
        currentValues,
        proposedValues: data.proposedValues as any,
        comment: data.comment,
      },
      include: {
        budgetLine: { include: { expense: true, financialCompany: true, technologyDirection: true } },
        requestedBy: { select: { id: true, username: true, fullName: true } }
      }
    });
  }

  async getPendingForApprover(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { userRoles: { include: { role: true } } }
    });
    if (!user) throw new Error('Usuario no encontrado');

    const canApproveAll = user.userRoles.some(ur => ur.role.approveAllDirections);
    const approverTechIds = user.userRoles.flatMap(ur => ur.role.approverTechDirectionIds);

    const where: any = { status: ChangeRequestStatus.PENDING };
    if (!canApproveAll && approverTechIds.length > 0) {
      where.budgetLine = { technologyDirectionId: { in: approverTechIds } };
    } else if (!canApproveAll) {
      return [];
    }

    return await this.prisma.budgetLineChangeRequest.findMany({
      where,
      include: {
        budgetLine: { include: { expense: true, financialCompany: true, technologyDirection: true, budget: true } },
        requestedBy: { select: { id: true, username: true, fullName: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async approveRequest(requestId: string, approverId: string) {
    const request = await this.prisma.budgetLineChangeRequest.findUnique({
      where: { id: requestId },
      include: { budgetLine: true }
    });
    if (!request) throw new Error('Solicitud no encontrada');
    if (request.status !== ChangeRequestStatus.PENDING) throw new Error('La solicitud ya fue procesada');

    const proposed = request.proposedValues as Record<string, number>;
    const updateData: any = {};
    for (let m = 1; m <= 12; m++) {
      const key = `planM${m}`;
      if (proposed[key] !== undefined) updateData[key] = proposed[key];
    }

    return await this.prisma.$transaction(async (tx: any) => {
      await tx.budgetLine.update({ where: { id: request.budgetLineId }, data: updateData });
      return await tx.budgetLineChangeRequest.update({
        where: { id: requestId },
        data: { status: ChangeRequestStatus.APPROVED, approvedById: approverId, resolvedAt: new Date() },
        include: {
          budgetLine: { include: { expense: true, financialCompany: true, technologyDirection: true } },
          requestedBy: { select: { id: true, username: true, fullName: true } },
          approvedBy: { select: { id: true, username: true, fullName: true } }
        }
      });
    });
  }

  async rejectRequest(requestId: string, approverId: string) {
    const request = await this.prisma.budgetLineChangeRequest.findUnique({ where: { id: requestId } });
    if (!request) throw new Error('Solicitud no encontrada');
    if (request.status !== ChangeRequestStatus.PENDING) throw new Error('La solicitud ya fue procesada');

    return await this.prisma.budgetLineChangeRequest.update({
      where: { id: requestId },
      data: { status: ChangeRequestStatus.REJECTED, approvedById: approverId, resolvedAt: new Date() },
      include: {
        budgetLine: { include: { expense: true, financialCompany: true } },
        requestedBy: { select: { id: true, username: true, fullName: true } },
        approvedBy: { select: { id: true, username: true, fullName: true } }
      }
    });
  }

  async getByBudgetLine(budgetLineId: string) {
    return await this.prisma.budgetLineChangeRequest.findMany({
      where: { budgetLineId },
      include: {
        requestedBy: { select: { id: true, username: true, fullName: true } },
        approvedBy: { select: { id: true, username: true, fullName: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getMyRequests(userId: string) {
    return await this.prisma.budgetLineChangeRequest.findMany({
      where: { requestedById: userId },
      include: {
        budgetLine: { include: { expense: true, financialCompany: true, technologyDirection: true, budget: true } },
        requestedBy: { select: { id: true, username: true, fullName: true } },
        approvedBy: { select: { id: true, username: true, fullName: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async approveMultiple(requestIds: string[], approverId: string, sourceBudgetId?: string) {
    return await this.prisma.$transaction(async (tx: any) => {
      const results = [];
      for (const requestId of requestIds) {
        const request = await tx.budgetLineChangeRequest.findUnique({
          where: { id: requestId },
          include: { budgetLine: true }
        });
        if (!request) throw new Error(`Solicitud ${requestId} no encontrada`);
        if (request.status !== 'PENDING') throw new Error(`La solicitud ${requestId} ya fue procesada`);

        const proposed = request.proposedValues as Record<string, number>;
        const updateData: any = {};
        for (let m = 1; m <= 12; m++) {
          const key = `planM${m}`;
          if (proposed[key] !== undefined) updateData[key] = proposed[key];
        }

        await tx.budgetLine.update({ where: { id: request.budgetLineId }, data: updateData });

        const updated = await tx.budgetLineChangeRequest.update({
          where: { id: requestId },
          data: { status: 'APPROVED', approvedById: approverId, resolvedAt: new Date() },
          include: {
            budgetLine: { include: { expense: true, financialCompany: true, technologyDirection: true } },
            requestedBy: { select: { id: true, username: true, fullName: true } },
            approvedBy: { select: { id: true, username: true, fullName: true } }
          }
        });
        results.push(updated);
      }
      return results;
    });
  }
}
