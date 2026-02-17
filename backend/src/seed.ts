import { PrismaClient, TransactionType, TagInputType, PermissionType, SavingStatus } from '@prisma/client';
import { seedTranslations } from './seedTranslations';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed masivo de base de datos...');

  // Limpiar datos existentes
  console.log('🗑️  Limpiando datos existentes...');
  await prisma.auditLog.deleteMany();
  await prisma.translation.deleteMany();
  await prisma.systemConfig.deleteMany();
  await prisma.budgetLineChangeRequest.deleteMany();
  await prisma.deferral.deleteMany();
  await prisma.saving.deleteMany();
  await prisma.tagValue.deleteMany();
  await prisma.tagDefinition.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.budgetLine.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.conversionRate.deleteMany();
  await prisma.budget.deleteMany();
  await prisma.financialCompany.deleteMany();
  await prisma.allowedCurrency.deleteMany();
  await prisma.userArea.deleteMany();
  await prisma.technologyDirection.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.userRole.deleteMany();
  await prisma.session.deleteMany();
  await prisma.role.deleteMany();
  await prisma.user.deleteMany();

  // ============================================
  // DATOS MAESTROS
  // ============================================
  console.log('📊 Creando datos maestros...');

  const techDirections = await Promise.all([
    prisma.technologyDirection.create({ data: { code: 'INFRA', name: 'Infraestructura', description: 'Infraestructura y servidores on-premise y cloud' } }),
    prisma.technologyDirection.create({ data: { code: 'DEV', name: 'Desarrollo', description: 'Desarrollo de software y aplicaciones' } }),
    prisma.technologyDirection.create({ data: { code: 'SEC', name: 'Seguridad', description: 'Seguridad informática y ciberseguridad' } }),
    prisma.technologyDirection.create({ data: { code: 'DATA', name: 'Datos & Analytics', description: 'Big Data, BI y analítica avanzada' } }),
    prisma.technologyDirection.create({ data: { code: 'CLOUD', name: 'Cloud Computing', description: 'Servicios cloud y migración' } }),
    prisma.technologyDirection.create({ data: { code: 'NET', name: 'Redes & Comunicaciones', description: 'Redes, telecomunicaciones y conectividad' } }),
    prisma.technologyDirection.create({ data: { code: 'AI', name: 'Inteligencia Artificial', description: 'IA, Machine Learning y automatización' } }),
    prisma.technologyDirection.create({ data: { code: 'DEVOPS', name: 'DevOps', description: 'CI/CD, automatización y operaciones' } }),
  ]);

  const userAreas = await Promise.all([
    prisma.userArea.create({ data: { code: 'FIN', name: 'Finanzas', description: 'Área financiera y contabilidad' } }),
    prisma.userArea.create({ data: { code: 'OPS', name: 'Operaciones', description: 'Área de operaciones y logística' } }),
    prisma.userArea.create({ data: { code: 'MKT', name: 'Marketing', description: 'Marketing y comunicaciones' } }),
    prisma.userArea.create({ data: { code: 'RRHH', name: 'Recursos Humanos', description: 'Gestión de personas y talento' } }),
    prisma.userArea.create({ data: { code: 'LEGAL', name: 'Legal', description: 'Área legal y cumplimiento' } }),
    prisma.userArea.create({ data: { code: 'VENT', name: 'Ventas', description: 'Área comercial y ventas' } }),
    prisma.userArea.create({ data: { code: 'TI', name: 'Tecnología', description: 'Área de tecnología interna' } }),
    prisma.userArea.create({ data: { code: 'GER', name: 'Gerencia General', description: 'Gerencia y dirección ejecutiva' } }),
    prisma.userArea.create({ data: { code: 'PROD', name: 'Producción', description: 'Área de producción y manufactura' } }),
    prisma.userArea.create({ data: { code: 'ATEN', name: 'Atención al Cliente', description: 'Soporte y servicio al cliente' } }),
  ]);

  // AllowedCurrencies
  console.log('💱 Creando monedas permitidas...');
  await Promise.all([
    prisma.allowedCurrency.create({ data: { code: 'USD', name: 'US Dollar' } }),
    prisma.allowedCurrency.create({ data: { code: 'EUR', name: 'Euro' } }),
    prisma.allowedCurrency.create({ data: { code: 'CLP', name: 'Chilean Peso' } }),
    prisma.allowedCurrency.create({ data: { code: 'BRL', name: 'Brazilian Real' } }),
    prisma.allowedCurrency.create({ data: { code: 'MXN', name: 'Mexican Peso' } }),
  ]);

  const financialCompanies = await Promise.all([
    prisma.financialCompany.create({ data: { code: 'CORP', name: 'Corporación Principal S.A.', description: 'Empresa matriz', taxId: '76.123.456-7', currencyCode: 'USD' } }),
    prisma.financialCompany.create({ data: { code: 'SUB1', name: 'Subsidiaria Norte Ltda.', description: 'Filial zona norte', taxId: '76.234.567-8', currencyCode: 'CLP' } }),
    prisma.financialCompany.create({ data: { code: 'SUB2', name: 'Subsidiaria Sur S.A.', description: 'Filial zona sur', taxId: '76.345.678-9', currencyCode: 'CLP' } }),
    prisma.financialCompany.create({ data: { code: 'TECH', name: 'Tech Solutions SpA', description: 'Empresa de tecnología', taxId: '76.456.789-0', currencyCode: 'USD' } }),
    prisma.financialCompany.create({ data: { code: 'SERV', name: 'Servicios Digitales Ltda.', description: 'Servicios digitales y consultoría', taxId: '76.567.890-1', currencyCode: 'EUR' } }),
  ]);

  // ============================================
  // ETIQUETAS (TAG DEFINITIONS)
  // ============================================
  console.log('🏷️  Creando definiciones de etiquetas...');

  const tagDefs = await Promise.all([
    prisma.tagDefinition.create({ data: { name: 'Prioridad', description: 'Nivel de prioridad del gasto', inputType: TagInputType.SELECT_LIST, selectOptions: ['Crítica', 'Alta', 'Media', 'Baja'] } }),
    prisma.tagDefinition.create({ data: { name: 'Proyecto', description: 'Código del proyecto asociado', inputType: TagInputType.FREE_TEXT } }),
    prisma.tagDefinition.create({ data: { name: 'Centro de Costo', description: 'Centro de costo contable', inputType: TagInputType.FORMAT, format: 'CC-####' } }),
    prisma.tagDefinition.create({ data: { name: 'Tipo Contrato', description: 'Tipo de contrato del gasto', inputType: TagInputType.SELECT_LIST, selectOptions: ['Anual', 'Mensual', 'Por demanda', 'Único'] } }),
    prisma.tagDefinition.create({ data: { name: 'Responsable', description: 'Persona responsable del gasto', inputType: TagInputType.FREE_TEXT } }),
    prisma.tagDefinition.create({ data: { name: 'Categoría CAPEX/OPEX', description: 'Clasificación contable', inputType: TagInputType.SELECT_LIST, selectOptions: ['CAPEX', 'OPEX'] } }),
    prisma.tagDefinition.create({ data: { name: 'Proveedor', description: 'Nombre del proveedor', inputType: TagInputType.FREE_TEXT } }),
    prisma.tagDefinition.create({ data: { name: 'Fecha Vencimiento', description: 'Fecha de vencimiento del contrato', inputType: TagInputType.FORMAT, format: 'DD/MM/YYYY' } }),
  ]);

  // ============================================
  // PRESUPUESTOS
  // ============================================
  console.log('💰 Creando presupuestos...');

  const budget2025v1 = await prisma.budget.create({ data: { year: 2025, version: 'v1' } });
  const budget2025v2 = await prisma.budget.create({ data: { year: 2025, version: 'v2' } });
  const budget2026v1 = await prisma.budget.create({ data: { year: 2026, version: 'v1' } });
  const budgets = [budget2025v1, budget2025v2, budget2026v1];

  // ============================================
  // TASAS DE CONVERSIÓN
  // ============================================
  console.log('💱 Creando tasas de conversión...');

  const currencyRates: Record<string, number[]> = {
    CLP: [0.00108, 0.00109, 0.00107, 0.00110, 0.00112, 0.00111, 0.00113, 0.00110, 0.00108, 0.00109, 0.00111, 0.00112],
    EUR: [1.08, 1.09, 1.07, 1.10, 1.11, 1.09, 1.08, 1.10, 1.11, 1.12, 1.10, 1.09],
    BRL: [0.20, 0.19, 0.20, 0.21, 0.20, 0.19, 0.20, 0.21, 0.20, 0.19, 0.20, 0.21],
    MXN: [0.058, 0.057, 0.059, 0.058, 0.057, 0.056, 0.058, 0.059, 0.057, 0.058, 0.059, 0.057],
    USD: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  };

  for (const budget of budgets) {
    for (const [currency, monthlyRates] of Object.entries(currencyRates)) {
      for (let month = 1; month <= 12; month++) {
        await prisma.conversionRate.create({
          data: { budgetId: budget.id, currency, month, rate: monthlyRates[month - 1] }
        });
      }
    }
  }

  // ============================================
  // GASTOS (EXPENSES) - Entidades maestras independientes
  // ============================================
  console.log('📝 Creando gastos (entidades maestras)...');

  const expenseDefinitions = [
    { code: 'INFRA-001', short: 'Servidores Cloud AWS', long: 'Instancias EC2, RDS y servicios AWS para producción', techIdx: [0, 4], areaIdx: [6], compIdx: 0 },
    { code: 'INFRA-002', short: 'Servidores Cloud Azure', long: 'Máquinas virtuales y servicios Azure para desarrollo', techIdx: [0, 4], areaIdx: [6], compIdx: 0 },
    { code: 'INFRA-003', short: 'Data Center On-Premise', long: 'Mantenimiento y operación del data center principal', techIdx: [0], areaIdx: [6, 1], compIdx: 0 },
    { code: 'INFRA-004', short: 'Storage & Backup', long: 'Almacenamiento S3, Glacier y soluciones de backup', techIdx: [0, 4], areaIdx: [6], compIdx: 1 },
    { code: 'INFRA-005', short: 'CDN & Distribución', long: 'CloudFront y servicios de distribución de contenido', techIdx: [0, 5], areaIdx: [6, 2], compIdx: 0 },
    { code: 'DEV-001', short: 'Licencias IDE & Tools', long: 'JetBrains, VS Code Enterprise, herramientas de desarrollo', techIdx: [1], areaIdx: [6], compIdx: 0 },
    { code: 'DEV-002', short: 'Plataforma GitHub Enterprise', long: 'Licencias GitHub Enterprise para repositorios y CI/CD', techIdx: [1, 7], areaIdx: [6], compIdx: 3 },
    { code: 'DEV-003', short: 'Testing & QA Tools', long: 'Herramientas de testing automatizado y QA', techIdx: [1], areaIdx: [6], compIdx: 3 },
    { code: 'DEV-004', short: 'Desarrollo App Móvil', long: 'Desarrollo de aplicación móvil corporativa', techIdx: [1], areaIdx: [6, 5], compIdx: 3 },
    { code: 'DEV-005', short: 'Portal Web Clientes', long: 'Desarrollo y mantenimiento del portal web de clientes', techIdx: [1], areaIdx: [9, 5], compIdx: 0 },
    { code: 'SEC-001', short: 'Firewall & WAF', long: 'Firewalls de nueva generación y Web Application Firewall', techIdx: [2], areaIdx: [6], compIdx: 0 },
    { code: 'SEC-002', short: 'Antivirus Corporativo', long: 'Licencias de antivirus y endpoint protection', techIdx: [2], areaIdx: [6], compIdx: 1 },
    { code: 'SEC-003', short: 'SIEM & Monitoreo', long: 'Sistema de gestión de eventos de seguridad', techIdx: [2, 3], areaIdx: [6], compIdx: 4 },
    { code: 'SEC-004', short: 'Pentesting & Auditoría', long: 'Servicios de pentesting y auditoría de seguridad', techIdx: [2], areaIdx: [6, 4], compIdx: 4 },
    { code: 'DATA-001', short: 'Data Warehouse', long: 'Infraestructura de data warehouse y ETL', techIdx: [3, 4], areaIdx: [6, 0], compIdx: 0 },
    { code: 'DATA-002', short: 'Herramientas BI', long: 'Power BI, Tableau y herramientas de visualización', techIdx: [3], areaIdx: [0, 7], compIdx: 0 },
    { code: 'DATA-003', short: 'Data Lake', long: 'Almacenamiento y procesamiento de datos no estructurados', techIdx: [3, 4], areaIdx: [6], compIdx: 0 },
    { code: 'NET-001', short: 'Conectividad WAN', long: 'Enlaces WAN entre oficinas y data centers', techIdx: [5], areaIdx: [6, 1], compIdx: 1 },
    { code: 'NET-002', short: 'WiFi Corporativo', long: 'Infraestructura WiFi para todas las oficinas', techIdx: [5], areaIdx: [6], compIdx: 1 },
    { code: 'NET-003', short: 'VPN & Acceso Remoto', long: 'Soluciones VPN para trabajo remoto', techIdx: [5, 2], areaIdx: [6, 3], compIdx: 2 },
    { code: 'AI-001', short: 'Plataforma ML', long: 'Plataforma de Machine Learning y modelos predictivos', techIdx: [6, 3], areaIdx: [6], compIdx: 3 },
    { code: 'AI-002', short: 'Chatbot Corporativo', long: 'Chatbot con IA para atención al cliente', techIdx: [6, 1], areaIdx: [9, 5], compIdx: 3 },
    { code: 'AI-003', short: 'Automatización RPA', long: 'Robots de automatización de procesos', techIdx: [6], areaIdx: [1, 0], compIdx: 4 },
    { code: 'DEVOPS-001', short: 'Kubernetes & Containers', long: 'Plataforma de contenedores y orquestación', techIdx: [7, 4], areaIdx: [6], compIdx: 0 },
    { code: 'DEVOPS-002', short: 'Monitoreo APM', long: 'Datadog, New Relic y monitoreo de aplicaciones', techIdx: [7], areaIdx: [6], compIdx: 4 },
    { code: 'LIC-001', short: 'Microsoft 365', long: 'Licencias Microsoft 365 Enterprise para toda la empresa', techIdx: [1], areaIdx: [6, 3], compIdx: 0 },
    { code: 'LIC-002', short: 'Salesforce CRM', long: 'Licencias Salesforce para equipo comercial', techIdx: [1], areaIdx: [5, 2], compIdx: 0 },
    { code: 'LIC-003', short: 'SAP ERP', long: 'Licencias y mantenimiento SAP', techIdx: [1], areaIdx: [0, 1], compIdx: 0 },
    { code: 'LIC-004', short: 'Jira & Confluence', long: 'Herramientas de gestión de proyectos Atlassian', techIdx: [1, 7], areaIdx: [6], compIdx: 3 },
    { code: 'CONS-001', short: 'Consultoría Cloud', long: 'Servicios de consultoría para migración cloud', techIdx: [4], areaIdx: [6, 7], compIdx: 4 },
    { code: 'CONS-002', short: 'Consultoría Seguridad', long: 'Asesoría en ciberseguridad y compliance', techIdx: [2], areaIdx: [6, 4], compIdx: 4 },
    { code: 'CONS-003', short: 'Consultoría Data', long: 'Consultoría en estrategia de datos', techIdx: [3, 6], areaIdx: [7, 0], compIdx: 4 },
    { code: 'TEL-001', short: 'Telefonía IP', long: 'Sistema de telefonía IP corporativa', techIdx: [5], areaIdx: [6, 9], compIdx: 2 },
    { code: 'TEL-002', short: 'Contact Center', long: 'Plataforma de contact center omnicanal', techIdx: [5, 6], areaIdx: [9], compIdx: 2 },
    { code: 'CAP-001', short: 'Capacitación TI', long: 'Programas de capacitación y certificaciones TI', techIdx: [1], areaIdx: [6, 3], compIdx: 0 },
  ];

  // Create expenses as independent master data (no budgetId, no financialCompanyId)
  const allExpenses: any[] = [];
  for (const def of expenseDefinitions) {
    const expense = await prisma.expense.create({
      data: {
        code: def.code,
        shortDescription: def.short,
        longDescription: def.long,
        technologyDirections: def.techIdx.map(i => techDirections[i].id),
        userAreas: def.areaIdx.map(i => userAreas[i].id),
      }
    });
    allExpenses.push({ ...expense, compIdx: def.compIdx });
  }

  // Sub-expenses
  console.log('📝 Creando sub-gastos...');
  const subExpenses = [
    { parent: 0, code: 'INFRA-001-A', short: 'AWS EC2 Producción', long: 'Instancias EC2 para ambiente de producción' },
    { parent: 0, code: 'INFRA-001-B', short: 'AWS RDS Databases', long: 'Bases de datos RDS PostgreSQL y MySQL' },
    { parent: 0, code: 'INFRA-001-C', short: 'AWS Lambda Functions', long: 'Funciones serverless Lambda' },
    { parent: 5, code: 'DEV-001-A', short: 'JetBrains Licenses', long: 'IntelliJ IDEA, WebStorm, DataGrip' },
    { parent: 5, code: 'DEV-001-B', short: 'VS Code Enterprise', long: 'Visual Studio Code con extensiones enterprise' },
    { parent: 10, code: 'SEC-001-A', short: 'Firewall Perimetral', long: 'Firewall principal del perímetro de red' },
    { parent: 10, code: 'SEC-001-B', short: 'WAF CloudFlare', long: 'Web Application Firewall en CloudFlare' },
  ];

  for (const sub of subExpenses) {
    const parentExp = allExpenses[sub.parent];
    const expense = await prisma.expense.create({
      data: {
        code: sub.code,
        shortDescription: sub.short,
        longDescription: sub.long,
        technologyDirections: parentExp.technologyDirections || [],
        userAreas: parentExp.userAreas || [],
        parentExpenseId: parentExp.id,
      }
    });
    allExpenses.push({ ...expense, compIdx: parentExp.compIdx });
  }

  // ============================================
  // BUDGET LINES (with planM1-M12)
  // ============================================
  console.log('📅 Creando líneas de presupuesto con valores plan...');

  const monthlyBudgets: number[][] = [
    [12000, 12000, 13000, 13000, 14000, 14000, 15000, 15000, 14000, 13000, 12000, 12000],
    [8000, 8000, 8500, 8500, 9000, 9000, 9500, 9500, 9000, 8500, 8000, 8000],
    [5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000],
    [3000, 3000, 3500, 3500, 4000, 4000, 4500, 4500, 4000, 3500, 3000, 3000],
    [2000, 2000, 2000, 2500, 2500, 3000, 3000, 3000, 2500, 2500, 2000, 2000],
    [4500, 4500, 4500, 4500, 4500, 4500, 4500, 4500, 4500, 4500, 4500, 4500],
    [6000, 6000, 6000, 6000, 6000, 6000, 6000, 6000, 6000, 6000, 6000, 6000],
    [3000, 3000, 3500, 3500, 4000, 4000, 3500, 3500, 3000, 3000, 2500, 2500],
    [15000, 15000, 18000, 18000, 20000, 20000, 22000, 22000, 18000, 15000, 12000, 10000],
    [8000, 8000, 9000, 9000, 10000, 10000, 10000, 9000, 9000, 8000, 8000, 7000],
    [7000, 7000, 7000, 7000, 7000, 7000, 7000, 7000, 7000, 7000, 7000, 7000],
    [2500, 2500, 2500, 2500, 2500, 2500, 2500, 2500, 2500, 2500, 2500, 2500],
    [5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000],
    [0, 0, 15000, 0, 0, 15000, 0, 0, 15000, 0, 0, 15000],
    [10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000],
    [3500, 3500, 3500, 3500, 3500, 3500, 3500, 3500, 3500, 3500, 3500, 3500],
    [6000, 6000, 7000, 7000, 8000, 8000, 8000, 7000, 7000, 6000, 6000, 6000],
    [4000, 4000, 4000, 4000, 4000, 4000, 4000, 4000, 4000, 4000, 4000, 4000],
    [1500, 1500, 1500, 1500, 1500, 1500, 1500, 1500, 1500, 1500, 1500, 1500],
    [2000, 2000, 2000, 2000, 2000, 2000, 2000, 2000, 2000, 2000, 2000, 2000],
    [8000, 8000, 10000, 10000, 12000, 12000, 12000, 10000, 10000, 8000, 8000, 8000],
    [5000, 5000, 6000, 6000, 7000, 7000, 7000, 6000, 6000, 5000, 5000, 5000],
    [4000, 4000, 4500, 4500, 5000, 5000, 5000, 4500, 4500, 4000, 4000, 4000],
    [6000, 6000, 6000, 6000, 6000, 6000, 6000, 6000, 6000, 6000, 6000, 6000],
    [3000, 3000, 3000, 3000, 3000, 3000, 3000, 3000, 3000, 3000, 3000, 3000],
    [15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000],
    [8000, 8000, 8000, 8000, 8000, 8000, 8000, 8000, 8000, 8000, 8000, 8000],
    [25000, 25000, 25000, 25000, 25000, 25000, 25000, 25000, 25000, 25000, 25000, 25000],
    [2000, 2000, 2000, 2000, 2000, 2000, 2000, 2000, 2000, 2000, 2000, 2000],
    [0, 0, 20000, 20000, 20000, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 12000, 12000, 12000, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 15000, 15000, 15000, 0],
    [3000, 3000, 3000, 3000, 3000, 3000, 3000, 3000, 3000, 3000, 3000, 3000],
    [5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000],
    [0, 0, 8000, 0, 0, 8000, 0, 0, 8000, 0, 0, 8000],
  ];

  // BudgetLines for budget2025v1
  const allBudgetLines: any[] = [];
  for (let expIdx = 0; expIdx < allExpenses.length && expIdx < monthlyBudgets.length; expIdx++) {
    const exp = allExpenses[expIdx];
    const vals = monthlyBudgets[expIdx];
    const companyIdx = exp.compIdx ?? 0;
    const company = financialCompanies[companyIdx];
    // Assign technologyDirectionId from expense's first tech direction
    const techDirIds = exp.technologyDirections || [];
    const techDirId = techDirIds.length > 0 ? techDirIds[0] : null;
    const bl = await prisma.budgetLine.create({
      data: {
        budgetId: budget2025v1.id,
        expenseId: exp.id,
        financialCompanyId: company.id,
        technologyDirectionId: techDirId,
        currency: company.currencyCode || 'USD',
        planM1: vals[0], planM2: vals[1], planM3: vals[2], planM4: vals[3],
        planM5: vals[4], planM6: vals[5], planM7: vals[6], planM8: vals[7],
        planM9: vals[8], planM10: vals[9], planM11: vals[10], planM12: vals[11],
      }
    });
    allBudgetLines.push(bl);
  }

  // BudgetLines for budget2025v2 (subset, +/- 10%)
  const v2BudgetLines: any[] = [];
  for (let expIdx = 0; expIdx < 20 && expIdx < monthlyBudgets.length; expIdx++) {
    const exp = allExpenses[expIdx];
    const vals = monthlyBudgets[expIdx].map(v => Math.round(v * (0.9 + Math.random() * 0.2)));
    const companyIdx = exp.compIdx ?? 0;
    const company = financialCompanies[companyIdx];
    const techDirIds2 = exp.technologyDirections || [];
    const techDirId2 = techDirIds2.length > 0 ? techDirIds2[0] : null;
    const bl = await prisma.budgetLine.create({
      data: {
        budgetId: budget2025v2.id,
        expenseId: exp.id,
        financialCompanyId: company.id,
        technologyDirectionId: techDirId2,
        currency: company.currencyCode || 'USD',
        planM1: vals[0], planM2: vals[1], planM3: vals[2], planM4: vals[3],
        planM5: vals[4], planM6: vals[5], planM7: vals[6], planM8: vals[7],
        planM9: vals[8], planM10: vals[9], planM11: vals[10], planM12: vals[11],
      }
    });
    v2BudgetLines.push(bl);
  }

  // BudgetLines for budget2026v1 (subset, +15%)
  for (let expIdx = 0; expIdx < 25 && expIdx < monthlyBudgets.length; expIdx++) {
    const exp = allExpenses[expIdx];
    const vals = monthlyBudgets[expIdx].map(v => Math.round(v * 1.15));
    const companyIdx = exp.compIdx ?? 0;
    const company = financialCompanies[companyIdx];
    const techDirIds3 = exp.technologyDirections || [];
    const techDirId3 = techDirIds3.length > 0 ? techDirIds3[0] : null;
    await prisma.budgetLine.create({
      data: {
        budgetId: budget2026v1.id,
        expenseId: exp.id,
        financialCompanyId: company.id,
        technologyDirectionId: techDirId3,
        currency: company.currencyCode || 'USD',
        planM1: vals[0], planM2: vals[1], planM3: vals[2], planM4: vals[3],
        planM5: vals[4], planM6: vals[5], planM7: vals[6], planM8: vals[7],
        planM9: vals[8], planM10: vals[9], planM11: vals[10], planM12: vals[11],
      }
    });
  }

  // ============================================
  // TRANSACCIONES (Comprometidas y Reales)
  // ============================================
  console.log('💳 Creando transacciones...');

  let docCounter = 1;
  const pad = (n: number) => String(n).padStart(5, '0');

  for (let blIdx = 0; blIdx < allBudgetLines.length && blIdx < monthlyBudgets.length; blIdx++) {
    const bl = allBudgetLines[blIdx];
    const budgetValues = monthlyBudgets[blIdx];

    for (let month = 1; month <= 6; month++) {
      const planValue = budgetValues[month - 1];
      if (planValue <= 0) continue;

      const committedValue = Math.round(planValue * (0.9 + Math.random() * 0.2));
      await prisma.transaction.create({
        data: {
          budgetLineId: bl.id,
          financialCompanyId: bl.financialCompanyId,
          type: TransactionType.COMMITTED,
          serviceDate: new Date(2025, month - 1, 10 + Math.floor(Math.random() * 10)),
          postingDate: new Date(2025, month - 1, 5 + Math.floor(Math.random() * 5)),
          referenceDocumentNumber: `COM-${pad(docCounter++)}`,
          externalPlatformLink: `https://erp.corp.com/doc/${docCounter}`,
          transactionCurrency: 'USD',
          transactionValue: committedValue,
          usdValue: committedValue,
          conversionRate: 1.0,
          month,
        }
      });

      if (month <= 4) {
        const realValue = Math.round(committedValue * (0.85 + Math.random() * 0.15));
        await prisma.transaction.create({
          data: {
            budgetLineId: bl.id,
            financialCompanyId: bl.financialCompanyId,
            type: TransactionType.REAL,
            serviceDate: new Date(2025, month - 1, 25 + Math.floor(Math.random() * 5)),
            postingDate: new Date(2025, month - 1, 28),
            referenceDocumentNumber: `REAL-${pad(docCounter++)}`,
            externalPlatformLink: `https://erp.corp.com/doc/${docCounter}`,
            transactionCurrency: 'USD',
            transactionValue: realValue,
            usdValue: realValue,
            conversionRate: 1.0,
            month,
          }
        });
      }
    }
  }

  // ============================================
  // TAG VALUES
  // ============================================
  console.log('🏷️  Asignando etiquetas a gastos...');

  const priorities = ['Crítica', 'Alta', 'Media', 'Baja'];
  const projects = ['PRJ-DIGITAL', 'PRJ-CLOUD', 'PRJ-SECURITY', 'PRJ-DATA', 'PRJ-INFRA', 'PRJ-MOBILE', 'PRJ-ERP', 'PRJ-CRM'];
  const costCenters = ['CC-1001', 'CC-1002', 'CC-2001', 'CC-2002', 'CC-3001', 'CC-3002', 'CC-4001'];
  const contractTypes = ['Anual', 'Mensual', 'Por demanda', 'Único'];
  const responsables = ['Juan Pérez', 'María García', 'Carlos López', 'Ana Martínez', 'Roberto Sánchez', 'Laura Torres'];
  const capexOpex = ['CAPEX', 'OPEX'];
  const proveedores = ['Amazon Web Services', 'Microsoft', 'Google Cloud', 'Cisco', 'Oracle', 'SAP', 'Salesforce', 'Atlassian', 'Fortinet', 'CrowdStrike', 'Datadog', 'Cloudflare'];

  for (let i = 0; i < allExpenses.length && i < 35; i++) {
    const expense = allExpenses[i];
    await prisma.tagValue.create({ data: { expenseId: expense.id, tagId: tagDefs[0].id, value: JSON.parse(JSON.stringify(priorities[i % priorities.length])) } });
    await prisma.tagValue.create({ data: { expenseId: expense.id, tagId: tagDefs[1].id, value: JSON.parse(JSON.stringify(projects[i % projects.length])) } });
    await prisma.tagValue.create({ data: { expenseId: expense.id, tagId: tagDefs[2].id, value: JSON.parse(JSON.stringify(costCenters[i % costCenters.length])) } });
    await prisma.tagValue.create({ data: { expenseId: expense.id, tagId: tagDefs[3].id, value: JSON.parse(JSON.stringify(contractTypes[i % contractTypes.length])) } });
    await prisma.tagValue.create({ data: { expenseId: expense.id, tagId: tagDefs[4].id, value: JSON.parse(JSON.stringify(responsables[i % responsables.length])) } });
    await prisma.tagValue.create({ data: { expenseId: expense.id, tagId: tagDefs[5].id, value: JSON.parse(JSON.stringify(capexOpex[i % capexOpex.length])) } });
    await prisma.tagValue.create({ data: { expenseId: expense.id, tagId: tagDefs[6].id, value: JSON.parse(JSON.stringify(proveedores[i % proveedores.length])) } });
    if (i % 3 === 0) {
      const month = String(1 + (i % 12)).padStart(2, '0');
      await prisma.tagValue.create({ data: { expenseId: expense.id, tagId: tagDefs[7].id, value: JSON.parse(JSON.stringify(`31/${month}/2026`)) } });
    }
  }

  // ============================================
  // USUARIOS Y ROLES
  // ============================================
  console.log('👥 Creando usuarios y roles...');

  const { PasswordService } = await import('./services/PasswordService');
  const passwordService = new PasswordService();
  const adminHash = await passwordService.hashPassword('belcorp123');
  const userHash = await passwordService.hashPassword('user123');

  const adminRole = await prisma.role.create({ data: { name: 'Administrador', description: 'Acceso completo al sistema', isSystem: true, approveAllDirections: true } });
  const viewerRole = await prisma.role.create({ data: { name: 'Visualizador', description: 'Solo lectura en todos los módulos' } });
  const budgetManagerRole = await prisma.role.create({ data: { name: 'Gestor de Presupuesto', description: 'Gestión completa de presupuestos y gastos' } });
  const analystRole = await prisma.role.create({ data: { name: 'Analista', description: 'Visualización y reportes' } });
  const approverRole = await prisma.role.create({ data: { name: 'Aprobador', description: 'Aprobación de cambios en presupuesto', approverTechDirectionIds: [techDirections[0].id, techDirections[1].id, techDirections[2].id] } });

  const allMenuCodes = ['dashboard', 'budgets', 'expenses', 'transactions', 'budget-lines', 'committed-transactions', 'real-transactions', 'master-data', 'technology-directions', 'user-areas', 'financial-companies', 'tag-definitions', 'conversion-rates', 'users', 'roles', 'reports', 'deferrals', 'configuration', 'approvals', 'audit'];
  for (const menuCode of allMenuCodes) {
    await prisma.permission.create({ data: { roleId: adminRole.id, menuCode, permissionType: PermissionType.VIEW } });
    await prisma.permission.create({ data: { roleId: adminRole.id, menuCode, permissionType: PermissionType.MODIFY } });
  }
  for (const menuCode of allMenuCodes) {
    await prisma.permission.create({ data: { roleId: viewerRole.id, menuCode, permissionType: PermissionType.VIEW } });
  }
  const budgetMenus = ['dashboard', 'budgets', 'expenses', 'transactions', 'budget-lines', 'committed-transactions', 'real-transactions', 'conversion-rates', 'reports', 'deferrals', 'approvals'];
  for (const menuCode of budgetMenus) {
    await prisma.permission.create({ data: { roleId: budgetManagerRole.id, menuCode, permissionType: PermissionType.VIEW } });
    await prisma.permission.create({ data: { roleId: budgetManagerRole.id, menuCode, permissionType: PermissionType.MODIFY } });
  }
  const analystMenus = ['dashboard', 'budgets', 'expenses', 'transactions', 'budget-lines', 'committed-transactions', 'real-transactions', 'reports'];
  for (const menuCode of analystMenus) {
    await prisma.permission.create({ data: { roleId: analystRole.id, menuCode, permissionType: PermissionType.VIEW } });
  }

  // Approver role permissions
  const approverMenus = ['dashboard', 'budgets', 'approvals'];
  for (const menuCode of approverMenus) {
    await prisma.permission.create({ data: { roleId: approverRole.id, menuCode, permissionType: PermissionType.VIEW } });
  }
  await prisma.permission.create({ data: { roleId: approverRole.id, menuCode: 'approvals', permissionType: PermissionType.APPROVE_BUDGET } });

  const adminUser = await prisma.user.create({ data: { username: 'admin', passwordHash: adminHash, email: 'admin@corp.com', fullName: 'Administrador del Sistema' } });
  const user1 = await prisma.user.create({ data: { username: 'jperez', passwordHash: userHash, email: 'jperez@corp.com', fullName: 'Juan Pérez', technologyDirectionId: techDirections[0].id } });
  const user2 = await prisma.user.create({ data: { username: 'mgarcia', passwordHash: userHash, email: 'mgarcia@corp.com', fullName: 'María García', technologyDirectionId: techDirections[1].id } });
  const user3 = await prisma.user.create({ data: { username: 'clopez', passwordHash: userHash, email: 'clopez@corp.com', fullName: 'Carlos López', technologyDirectionId: techDirections[2].id } });
  const user4 = await prisma.user.create({ data: { username: 'amartinez', passwordHash: userHash, email: 'amartinez@corp.com', fullName: 'Ana Martínez', technologyDirectionId: techDirections[3].id } });
  const user5 = await prisma.user.create({ data: { username: 'rsanchez', passwordHash: userHash, email: 'rsanchez@corp.com', fullName: 'Roberto Sánchez', technologyDirectionId: techDirections[4].id } });

  await prisma.userRole.create({ data: { userId: adminUser.id, roleId: adminRole.id } });
  await prisma.userRole.create({ data: { userId: user1.id, roleId: budgetManagerRole.id } });
  await prisma.userRole.create({ data: { userId: user2.id, roleId: budgetManagerRole.id } });
  await prisma.userRole.create({ data: { userId: user3.id, roleId: analystRole.id } });
  await prisma.userRole.create({ data: { userId: user4.id, roleId: viewerRole.id } });
  await prisma.userRole.create({ data: { userId: user5.id, roleId: analystRole.id } });
  await prisma.userRole.create({ data: { userId: user5.id, roleId: approverRole.id } });

  // ============================================
  // SAVINGS (using budgetLineId)
  // ============================================
  console.log('💵 Creando ahorros...');

  const savingsData = [
    { blIdx: 0, amount: 5000, desc: 'Optimización de instancias EC2 con Reserved Instances', status: SavingStatus.APPROVED, dist: [0, 0, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500] },
    { blIdx: 1, amount: 3000, desc: 'Migración a instancias spot para ambientes de desarrollo', status: SavingStatus.APPROVED, dist: [0, 0, 0, 500, 500, 500, 500, 500, 500, 0, 0, 0] },
    { blIdx: 5, amount: 2000, desc: 'Consolidación de licencias IDE duplicadas', status: SavingStatus.PENDING, dist: [0, 0, 0, 0, 400, 400, 400, 400, 400, 0, 0, 0] },
    { blIdx: 11, amount: 1500, desc: 'Renegociación contrato antivirus corporativo', status: SavingStatus.APPROVED, dist: [125, 125, 125, 125, 125, 125, 125, 125, 125, 125, 125, 125] },
    { blIdx: 14, amount: 8000, desc: 'Migración data warehouse a solución cloud más económica', status: SavingStatus.PENDING, dist: [0, 0, 0, 0, 0, 1000, 1000, 1000, 1000, 1000, 1000, 2000] },
    { blIdx: 25, amount: 10000, desc: 'Renegociación licencias Microsoft 365 por volumen', status: SavingStatus.APPROVED, dist: [833, 833, 833, 833, 833, 833, 833, 833, 833, 833, 833, 837] },
    { blIdx: 27, amount: 15000, desc: 'Optimización módulos SAP no utilizados', status: SavingStatus.PENDING, dist: [0, 0, 0, 0, 0, 0, 2500, 2500, 2500, 2500, 2500, 2500] },
    { blIdx: 23, amount: 4000, desc: 'Reducción de nodos Kubernetes en horario nocturno', status: SavingStatus.APPROVED, dist: [333, 333, 333, 333, 333, 333, 333, 333, 333, 333, 333, 337] },
    { blIdx: 17, amount: 2400, desc: 'Optimización ancho de banda WAN', status: SavingStatus.APPROVED, dist: [200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 200] },
    { blIdx: 20, amount: 6000, desc: 'Uso de modelos ML open source en lugar de propietarios', status: SavingStatus.PENDING, dist: [0, 0, 0, 1000, 1000, 1000, 1000, 1000, 1000, 0, 0, 0] },
  ];

  for (const s of savingsData) {
    if (s.blIdx >= allBudgetLines.length) continue;
    const monthlyDist: Record<string, number> = {};
    s.dist.forEach((val, idx) => { monthlyDist[String(idx + 1)] = val; });
    await prisma.saving.create({
      data: {
        budgetLineId: allBudgetLines[s.blIdx].id,
        totalAmount: s.amount,
        description: s.desc,
        status: s.status,
        monthlyDistribution: monthlyDist,
        createdBy: s.status === SavingStatus.APPROVED ? user1.id : user2.id,
        approvedAt: s.status === SavingStatus.APPROVED ? new Date() : null,
      }
    });
  }

  // ============================================
  // DEFERRALS (using budgetLineId)
  // ============================================
  console.log('📆 Creando diferidos...');

  const deferralsData = [
    { blIdx: 8, desc: 'Diferido desarrollo app móvil - fase 1', amount: 30000, start: 1, end: 6 },
    { blIdx: 8, desc: 'Diferido desarrollo app móvil - fase 2', amount: 25000, start: 4, end: 9 },
    { blIdx: 9, desc: 'Diferido portal web clientes - rediseño', amount: 20000, start: 2, end: 7 },
    { blIdx: 29, desc: 'Diferido consultoría cloud - migración', amount: 60000, start: 3, end: 8 },
    { blIdx: 30, desc: 'Diferido consultoría seguridad - auditoría', amount: 36000, start: 6, end: 9 },
    { blIdx: 31, desc: 'Diferido consultoría data - estrategia', amount: 45000, start: 9, end: 12 },
    { blIdx: 13, desc: 'Diferido pentesting anual', amount: 60000, start: 1, end: 12 },
    { blIdx: 34, desc: 'Diferido programa capacitación anual TI', amount: 32000, start: 1, end: 12 },
  ];

  for (const d of deferralsData) {
    if (d.blIdx >= allBudgetLines.length) continue;
    await prisma.deferral.create({
      data: {
        budgetLineId: allBudgetLines[d.blIdx].id,
        description: d.desc,
        totalAmount: d.amount,
        startMonth: d.start,
        endMonth: d.end,
        createdBy: adminUser.id,
      }
    });
  }

  // ============================================
  // TRADUCCIONES E I18N
  // ============================================
  await seedTranslations(prisma);

  // ============================================
  // RESUMEN
  // ============================================
  console.log('\n✅ Seed masivo completado exitosamente!');
  console.log('   📊 Datos maestros:');
  console.log(`      - ${techDirections.length} direcciones tecnológicas`);
  console.log(`      - ${userAreas.length} áreas de usuario`);
  console.log(`      - ${financialCompanies.length} empresas financieras`);
  console.log(`      - ${tagDefs.length} definiciones de etiquetas`);
  console.log('   💰 Presupuestos:');
  console.log(`      - ${budgets.length} presupuestos (2025 v1, 2025 v2, 2026 v1)`);
  console.log(`      - ${allBudgetLines.length} líneas de presupuesto en 2025 v1`);
  console.log(`      - ${v2BudgetLines.length} líneas en 2025 v2`);
  console.log(`      - ~${docCounter} transacciones`);
  console.log('   👥 Usuarios:');
  console.log('      - admin / belcorp123 (Administrador)');
  console.log('      - jperez / user123 (Gestor de Presupuesto)');
  console.log('      - mgarcia / user123 (Gestor de Presupuesto)');
  console.log('      - clopez / user123 (Analista)');
  console.log('      - amartinez / user123 (Visualizador)');
  console.log('      - rsanchez / user123 (Analista)');
  console.log('   💵 Ahorros: 10 registros');
  console.log('   📆 Diferidos: 8 registros');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
