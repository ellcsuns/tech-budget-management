import { PrismaClient } from '@prisma/client';

export class ReportService {
  constructor(private prisma: PrismaClient) {}

  async getReport(type: string, filters: Record<string, string>) {
    const budgetId = filters.budgetId;
    if (!budgetId) throw new Error('budgetId is required');

    switch (type) {
      case 'executive-summary': return this.executiveSummary(budgetId);
      case 'budget-execution': return this.budgetExecution(budgetId, filters);
      case 'plan-vs-real': return this.planVsReal(budgetId, filters);
      case 'by-financial-company': return this.byFinancialCompany(budgetId);
      case 'by-tech-direction': return this.byTechDirection(budgetId);
      case 'by-user-area': return this.byUserArea(budgetId);
      case 'detailed-transactions': return this.detailedTransactions(budgetId, filters);
      case 'variance-analysis': return this.varianceAnalysis(budgetId);
      case 'savings-deferrals': return this.savingsDeferrals(budgetId);
      case 'annual-projection': return this.annualProjection(budgetId);
      default: throw new Error('Invalid report type');
    }
  }

  private getPlanTotal(line: any): number {
    let total = 0;
    for (let m = 1; m <= 12; m++) total += Number(line[`planM${m}`] || 0);
    return total;
  }

  private getPlanForMonth(line: any, month: number): number {
    return Number(line[`planM${month}`] || 0);
  }

  private async executiveSummary(budgetId: string) {
    const lines = await this.prisma.budgetLine.findMany({
      where: { budgetId, expense: { active: true } },
      include: { expense: true, financialCompany: true, transactions: true }
    });

    let totalPlan = 0, totalCommitted = 0, totalReal = 0;
    const byCompany: Record<string, { name: string; plan: number; committed: number; real: number }> = {};

    for (const line of lines) {
      const plan = this.getPlanTotal(line);
      const committed = line.transactions.filter((t: any) => t.type === 'COMMITTED' && !t.isCompensated).reduce((s: number, t: any) => s + Number(t.usdValue), 0);
      const real = line.transactions.filter((t: any) => t.type === 'REAL').reduce((s: number, t: any) => s + Number(t.usdValue), 0);
      totalPlan += plan; totalCommitted += committed; totalReal += real;
      const cName = line.financialCompany?.name || 'Sin empresa';
      if (!byCompany[cName]) byCompany[cName] = { name: cName, plan: 0, committed: 0, real: 0 };
      byCompany[cName].plan += plan; byCompany[cName].committed += committed; byCompany[cName].real += real;
    }

    return {
      columns: ['Indicador', 'Valor USD'],
      rows: [
        { indicator: 'Total Presupuesto Plan', value: totalPlan },
        { indicator: 'Total Comprometido', value: totalCommitted },
        { indicator: 'Total Real', value: totalReal },
        { indicator: '% Ejecución Comprometido', value: totalPlan > 0 ? ((totalCommitted / totalPlan) * 100).toFixed(1) + '%' : '0%' },
        { indicator: '% Ejecución Real', value: totalPlan > 0 ? ((totalReal / totalPlan) * 100).toFixed(1) + '%' : '0%' },
        { indicator: 'Saldo Disponible', value: totalPlan - totalCommitted - totalReal },
        { indicator: 'Total Líneas Activas', value: lines.length },
        { indicator: 'Empresas Financieras', value: Object.keys(byCompany).length },
      ],
      summary: { totalPlan, totalCommitted, totalReal, byCompany: Object.values(byCompany) }
    };
  }

  private async budgetExecution(budgetId: string, filters: Record<string, string>) {
    const where: any = { budgetId, expense: { active: true } };
    if (filters.financialCompanyId) where.financialCompanyId = filters.financialCompanyId;

    const lines = await this.prisma.budgetLine.findMany({
      where, include: { expense: true, financialCompany: true, transactions: true }
    });

    const rows = lines.map((line: any) => {
      const plan = this.getPlanTotal(line);
      const committed = line.transactions.filter((t: any) => t.type === 'COMMITTED' && !t.isCompensated).reduce((s: number, t: any) => s + Number(t.usdValue), 0);
      const real = line.transactions.filter((t: any) => t.type === 'REAL').reduce((s: number, t: any) => s + Number(t.usdValue), 0);
      return {
        code: line.expense.code, description: line.expense.shortDescription,
        company: line.financialCompany?.name || '', plan, committed, real,
        balance: plan - committed - real,
        executionPct: plan > 0 ? Number(((committed + real) / plan * 100).toFixed(1)) : 0
      };
    });

    return { columns: ['Código', 'Descripción', 'Empresa', 'Plan USD', 'Comprometido USD', 'Real USD', 'Saldo USD', '% Ejecución'], rows };
  }

  private async planVsReal(budgetId: string, filters: Record<string, string>) {
    const monthFrom = filters.monthFrom ? parseInt(filters.monthFrom) : 1;
    const monthTo = filters.monthTo ? parseInt(filters.monthTo) : 12;

    const lines = await this.prisma.budgetLine.findMany({
      where: { budgetId, expense: { active: true } },
      include: { transactions: { where: { month: { gte: monthFrom, lte: monthTo } } } }
    });

    const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    const monthlyData = [];
    for (let m = monthFrom; m <= monthTo; m++) {
      let plan = 0, committed = 0, real = 0;
      for (const line of lines) {
        plan += this.getPlanForMonth(line, m);
        committed += line.transactions.filter((t: any) => t.type === 'COMMITTED' && !t.isCompensated && t.month === m).reduce((s: number, t: any) => s + Number(t.usdValue), 0);
        real += line.transactions.filter((t: any) => t.type === 'REAL' && t.month === m).reduce((s: number, t: any) => s + Number(t.usdValue), 0);
      }
      monthlyData.push({ month: MONTHS[m - 1], plan, committed, real, difference: plan - committed - real });
    }

    return { columns: ['Mes', 'Plan USD', 'Comprometido USD', 'Real USD', 'Diferencia USD'], rows: monthlyData };
  }

  private async byFinancialCompany(budgetId: string) {
    const lines = await this.prisma.budgetLine.findMany({
      where: { budgetId, expense: { active: true } },
      include: { financialCompany: true, transactions: true }
    });

    const grouped: Record<string, { name: string; plan: number; committed: number; real: number; count: number }> = {};
    for (const line of lines) {
      const key = line.financialCompany?.name || 'Sin empresa';
      if (!grouped[key]) grouped[key] = { name: key, plan: 0, committed: 0, real: 0, count: 0 };
      grouped[key].plan += this.getPlanTotal(line);
      grouped[key].committed += line.transactions.filter((t: any) => t.type === 'COMMITTED' && !t.isCompensated).reduce((s: number, t: any) => s + Number(t.usdValue), 0);
      grouped[key].real += line.transactions.filter((t: any) => t.type === 'REAL').reduce((s: number, t: any) => s + Number(t.usdValue), 0);
      grouped[key].count++;
    }

    return {
      columns: ['Empresa Financiera', 'Líneas', 'Plan USD', 'Comprometido USD', 'Real USD', '% del Total'],
      rows: Object.values(grouped).map(g => {
        const totalPlan = Object.values(grouped).reduce((s, x) => s + x.plan, 0);
        return { ...g, pctTotal: totalPlan > 0 ? Number((g.plan / totalPlan * 100).toFixed(1)) : 0 };
      })
    };
  }

  private async byTechDirection(budgetId: string) {
    const lines = await this.prisma.budgetLine.findMany({
      where: { budgetId, expense: { active: true } },
      include: { expense: true, transactions: true }
    });
    const techDirs = await this.prisma.technologyDirection.findMany();
    const dirMap = Object.fromEntries(techDirs.map((d: any) => [d.id, d.name]));

    const grouped: Record<string, { name: string; plan: number; committed: number; real: number; count: number }> = {};
    for (const line of lines) {
      const dirs = (line.expense.technologyDirections as string[]) || [];
      const plan = this.getPlanTotal(line);
      const committed = line.transactions.filter((t: any) => t.type === 'COMMITTED' && !t.isCompensated).reduce((s: number, t: any) => s + Number(t.usdValue), 0);
      const real = line.transactions.filter((t: any) => t.type === 'REAL').reduce((s: number, t: any) => s + Number(t.usdValue), 0);
      for (const dId of dirs) {
        const name = dirMap[dId] || dId;
        if (!grouped[name]) grouped[name] = { name, plan: 0, committed: 0, real: 0, count: 0 };
        grouped[name].plan += plan; grouped[name].committed += committed; grouped[name].real += real; grouped[name].count++;
      }
    }

    return { columns: ['Dirección Tecnológica', 'Líneas', 'Plan USD', 'Comprometido USD', 'Real USD'], rows: Object.values(grouped) };
  }

  private async byUserArea(budgetId: string) {
    const lines = await this.prisma.budgetLine.findMany({
      where: { budgetId, expense: { active: true } },
      include: { expense: true, transactions: true }
    });
    const areas = await this.prisma.userArea.findMany();
    const areaMap = Object.fromEntries(areas.map((a: any) => [a.id, a.name]));

    const grouped: Record<string, { name: string; plan: number; committed: number; real: number; count: number }> = {};
    for (const line of lines) {
      const uAreas = (line.expense.userAreas as string[]) || [];
      const plan = this.getPlanTotal(line);
      const committed = line.transactions.filter((t: any) => t.type === 'COMMITTED' && !t.isCompensated).reduce((s: number, t: any) => s + Number(t.usdValue), 0);
      const real = line.transactions.filter((t: any) => t.type === 'REAL').reduce((s: number, t: any) => s + Number(t.usdValue), 0);
      for (const aId of uAreas) {
        const name = areaMap[aId] || aId;
        if (!grouped[name]) grouped[name] = { name, plan: 0, committed: 0, real: 0, count: 0 };
        grouped[name].plan += plan; grouped[name].committed += committed; grouped[name].real += real; grouped[name].count++;
      }
    }

    return { columns: ['Área Usuaria', 'Líneas', 'Plan USD', 'Comprometido USD', 'Real USD'], rows: Object.values(grouped) };
  }

  private async detailedTransactions(budgetId: string, filters: Record<string, string>) {
    const where: any = { budgetLine: { budgetId, expense: { active: true } } };
    if (filters.type) where.type = filters.type;
    if (filters.monthFrom || filters.monthTo) {
      where.month = {};
      if (filters.monthFrom) where.month.gte = parseInt(filters.monthFrom);
      if (filters.monthTo) where.month.lte = parseInt(filters.monthTo);
    }

    const transactions = await this.prisma.transaction.findMany({
      where,
      include: { budgetLine: { include: { expense: true, financialCompany: true } }, financialCompany: true },
      orderBy: [{ month: 'asc' }, { serviceDate: 'asc' }]
    });

    const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    return {
      columns: ['Mes', 'Tipo', 'Gasto', 'Empresa', 'Referencia', 'Moneda', 'Valor Original', 'Valor USD', 'Fecha Servicio', 'Compensada'],
      rows: transactions.map((t: any) => ({
        month: MONTHS[t.month - 1],
        type: t.type === 'COMMITTED' ? 'Comprometido' : 'Real',
        expense: `${t.budgetLine.expense.code} - ${t.budgetLine.expense.shortDescription}`,
        company: t.financialCompany?.name || '',
        reference: t.referenceDocumentNumber,
        currency: t.transactionCurrency,
        originalValue: Number(t.transactionValue),
        usdValue: Number(t.usdValue),
        serviceDate: t.serviceDate.toISOString().split('T')[0],
        compensated: t.isCompensated ? 'Sí' : 'No'
      }))
    };
  }

  private async varianceAnalysis(budgetId: string) {
    const lines = await this.prisma.budgetLine.findMany({
      where: { budgetId, expense: { active: true } },
      include: { expense: true, financialCompany: true, transactions: true }
    });

    const rows = lines.map((line: any) => {
      const plan = this.getPlanTotal(line);
      const actual = line.transactions.reduce((s: number, t: any) => s + Number(t.usdValue), 0);
      const variance = plan - actual;
      const variancePct = plan > 0 ? Number(((variance / plan) * 100).toFixed(1)) : 0;
      return {
        code: line.expense.code, description: line.expense.shortDescription,
        company: line.financialCompany?.name || '', plan, actual, variance, variancePct,
        status: variancePct > 10 ? 'Subejecutado' : variancePct < -10 ? 'Sobreejecutado' : 'Normal'
      };
    }).sort((a: any, b: any) => Math.abs(b.variance) - Math.abs(a.variance));

    return { columns: ['Código', 'Descripción', 'Empresa', 'Plan USD', 'Ejecutado USD', 'Variación USD', 'Variación %', 'Estado'], rows };
  }

  private async savingsDeferrals(budgetId: string) {
    const [savings, deferrals] = await Promise.all([
      this.prisma.saving.findMany({
        where: { budgetLine: { budgetId } },
        include: { budgetLine: { include: { expense: true } }, user: { select: { fullName: true } } }
      }),
      this.prisma.deferral.findMany({
        where: { budgetLine: { budgetId } },
        include: { budgetLine: { include: { expense: true } }, user: { select: { fullName: true } } }
      })
    ]);

    const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    const savingRows = savings.map((s: any) => ({
      type: 'Ahorro', expense: `${s.budgetLine.expense.code} - ${s.budgetLine.expense.shortDescription}`,
      description: s.description, amount: Number(s.totalAmount), status: s.status, period: '-',
      createdBy: s.user.fullName, date: s.createdAt.toISOString().split('T')[0]
    }));

    const deferralRows = deferrals.map((d: any) => ({
      type: 'Diferido', expense: `${d.budgetLine.expense.code} - ${d.budgetLine.expense.shortDescription}`,
      description: d.description, amount: Number(d.totalAmount), status: 'Activo',
      period: `${MONTHS[d.startMonth - 1]} - ${MONTHS[d.endMonth - 1]}`,
      createdBy: d.user.fullName, date: d.createdAt.toISOString().split('T')[0]
    }));

    return { columns: ['Tipo', 'Gasto', 'Descripción', 'Monto USD', 'Estado', 'Período', 'Creado por', 'Fecha'], rows: [...savingRows, ...deferralRows] };
  }

  private async annualProjection(budgetId: string) {
    const currentMonth = new Date().getMonth() + 1;
    const lines = await this.prisma.budgetLine.findMany({
      where: { budgetId, expense: { active: true } },
      include: { transactions: true }
    });

    const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    const monthlyProjection = [];

    for (let m = 1; m <= 12; m++) {
      let plan = 0, actual = 0;
      for (const line of lines) {
        plan += this.getPlanForMonth(line, m);
        actual += line.transactions.filter((t: any) => t.month === m).reduce((s: number, t: any) => s + Number(t.usdValue), 0);
      }
      monthlyProjection.push({
        month: MONTHS[m - 1], plan,
        actual: m <= currentMonth ? actual : null,
        projected: m > currentMonth ? plan : null,
        cumPlan: 0, cumActual: 0
      });
    }

    let cumPlan = 0, cumActual = 0;
    for (const mp of monthlyProjection) {
      cumPlan += mp.plan;
      cumActual += (mp.actual ?? mp.projected ?? 0);
      mp.cumPlan = cumPlan;
      mp.cumActual = cumActual;
    }

    return { columns: ['Mes', 'Plan USD', 'Real USD', 'Proyectado USD', 'Acumulado Plan', 'Acumulado Real/Proy'], rows: monthlyProjection };
  }
}
