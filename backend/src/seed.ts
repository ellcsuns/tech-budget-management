import { PrismaClient, TransactionType, TagInputType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de base de datos...');

  // Limpiar datos existentes
  console.log('🗑️  Limpiando datos existentes...');
  await prisma.tagValue.deleteMany();
  await prisma.tagDefinition.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.planValue.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.conversionRate.deleteMany();
  await prisma.budget.deleteMany();
  await prisma.financialCompany.deleteMany();
  await prisma.userArea.deleteMany();
  await prisma.technologyDirection.deleteMany();

  // Crear datos maestros
  console.log('📊 Creando datos maestros...');
  
  const techDirections = await Promise.all([
    prisma.technologyDirection.create({
      data: { code: 'INFRA', name: 'Infraestructura', description: 'Infraestructura y servidores' }
    }),
    prisma.technologyDirection.create({
      data: { code: 'DEV', name: 'Desarrollo', description: 'Desarrollo de software' }
    }),
    prisma.technologyDirection.create({
      data: { code: 'SEC', name: 'Seguridad', description: 'Seguridad informática' }
    })
  ]);

  const userAreas = await Promise.all([
    prisma.userArea.create({
      data: { code: 'FIN', name: 'Finanzas', description: 'Área financiera' }
    }),
    prisma.userArea.create({
      data: { code: 'OPS', name: 'Operaciones', description: 'Área de operaciones' }
    }),
    prisma.userArea.create({
      data: { code: 'MKT', name: 'Marketing', description: 'Área de marketing' }
    })
  ]);

  const financialCompanies = await Promise.all([
    prisma.financialCompany.create({
      data: { code: 'CORP', name: 'Corporación Principal', taxId: '12345678-9' }
    }),
    prisma.financialCompany.create({
      data: { code: 'SUB1', name: 'Subsidiaria 1', taxId: '98765432-1' }
    })
  ]);

  // Crear presupuestos
  console.log('💰 Creando presupuestos...');
  
  const budget2024v1 = await prisma.budget.create({
    data: { year: 2024, version: 'v1' }
  });

  const budget2024v2 = await prisma.budget.create({
    data: { year: 2024, version: 'v2' }
  });

  // Crear tasas de conversión para 2024 v1
  console.log('💱 Creando tasas de conversión...');
  
  const currencies = ['CLP', 'USD', 'EUR'];
  const rates = {
    CLP: 0.0011, // 1 CLP = 0.0011 USD
    USD: 1.0,
    EUR: 1.10
  };

  for (const currency of currencies) {
    for (let month = 1; month <= 12; month++) {
      await prisma.conversionRate.create({
        data: {
          budgetId: budget2024v1.id,
          currency,
          month,
          rate: rates[currency as keyof typeof rates]
        }
      });
    }
  }

  // Crear gastos
  console.log('📝 Creando gastos...');
  
  const expense1 = await prisma.expense.create({
    data: {
      budgetId: budget2024v1.id,
      code: 'HW-001',
      shortDescription: 'Servidores Cloud',
      longDescription: 'Servidores en la nube para aplicaciones críticas',
      technologyDirections: [techDirections[0].id],
      userAreas: [userAreas[1].id],
      financialCompanyId: financialCompanies[0].id
    }
  });

  const expense2 = await prisma.expense.create({
    data: {
      budgetId: budget2024v1.id,
      code: 'LIC-001',
      shortDescription: 'Licencias Software',
      longDescription: 'Licencias de software empresarial',
      technologyDirections: [techDirections[1].id],
      userAreas: [userAreas[0].id, userAreas[1].id],
      financialCompanyId: financialCompanies[0].id
    }
  });

  const expense3 = await prisma.expense.create({
    data: {
      budgetId: budget2024v1.id,
      code: 'SEC-001',
      shortDescription: 'Herramientas Seguridad',
      longDescription: 'Herramientas de seguridad y monitoreo',
      technologyDirections: [techDirections[2].id],
      userAreas: [userAreas[1].id],
      financialCompanyId: financialCompanies[1].id
    }
  });

  // Crear valores plan
  console.log('📅 Creando valores plan...');
  
  const planValues = [
    { expenseId: expense1.id, months: [3000, 3000, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], currency: 'USD' },
    { expenseId: expense2.id, months: [29465, 29465, 29465, 29465, 0, 0, 0, 0, 0, 0, 0, 0], currency: 'USD' },
    { expenseId: expense3.id, months: [5000, 5000, 5000, 5000, 5000, 5000, 0, 0, 0, 0, 0, 0], currency: 'USD' }
  ];

  for (const pv of planValues) {
    for (let month = 1; month <= 12; month++) {
      const value = pv.months[month - 1];
      if (value > 0) {
        await prisma.planValue.create({
          data: {
            expenseId: pv.expenseId,
            month,
            transactionCurrency: pv.currency,
            transactionValue: value,
            usdValue: value,
            conversionRate: 1.0
          }
        });
      }
    }
  }

  // Crear transacciones comprometidas
  console.log('💳 Creando transacciones...');
  
  await prisma.transaction.create({
    data: {
      expenseId: expense1.id,
      type: TransactionType.COMMITTED,
      serviceDate: new Date('2024-01-15'),
      postingDate: new Date('2024-01-10'),
      referenceDocumentNumber: 'DOC-001',
      externalPlatformLink: 'https://erp.example.com/doc/001',
      transactionCurrency: 'USD',
      transactionValue: 2800,
      usdValue: 2800,
      conversionRate: 1.0,
      month: 1
    }
  });

  await prisma.transaction.create({
    data: {
      expenseId: expense2.id,
      type: TransactionType.COMMITTED,
      serviceDate: new Date('2024-01-20'),
      postingDate: new Date('2024-01-18'),
      referenceDocumentNumber: 'DOC-002',
      externalPlatformLink: 'https://erp.example.com/doc/002',
      transactionCurrency: 'USD',
      transactionValue: 28000,
      usdValue: 28000,
      conversionRate: 1.0,
      month: 1
    }
  });

  // Crear transacciones reales
  await prisma.transaction.create({
    data: {
      expenseId: expense1.id,
      type: TransactionType.REAL,
      serviceDate: new Date('2024-01-31'),
      postingDate: new Date('2024-01-31'),
      referenceDocumentNumber: 'DOC-003',
      externalPlatformLink: 'https://erp.example.com/doc/003',
      transactionCurrency: 'USD',
      transactionValue: 2000,
      usdValue: 2000,
      conversionRate: 1.0,
      month: 1
    }
  });

  await prisma.transaction.create({
    data: {
      expenseId: expense3.id,
      type: TransactionType.COMMITTED,
      serviceDate: new Date('2024-02-10'),
      postingDate: new Date('2024-02-08'),
      referenceDocumentNumber: 'DOC-004',
      externalPlatformLink: 'https://erp.example.com/doc/004',
      transactionCurrency: 'USD',
      transactionValue: 5000,
      usdValue: 5000,
      conversionRate: 1.0,
      month: 2
    }
  });

  await prisma.transaction.create({
    data: {
      expenseId: expense3.id,
      type: TransactionType.REAL,
      serviceDate: new Date('2024-02-28'),
      postingDate: new Date('2024-02-28'),
      referenceDocumentNumber: 'DOC-005',
      externalPlatformLink: 'https://erp.example.com/doc/005',
      transactionCurrency: 'USD',
      transactionValue: 4400,
      usdValue: 4400,
      conversionRate: 1.0,
      month: 2
    }
  });

  // Crear definiciones de etiquetas
  console.log('🏷️  Creando definiciones de etiquetas...');
  
  await prisma.tagDefinition.create({
    data: {
      name: 'Prioridad',
      description: 'Nivel de prioridad del gasto',
      inputType: TagInputType.SELECT_LIST,
      selectOptions: ['Alta', 'Media', 'Baja']
    }
  });

  await prisma.tagDefinition.create({
    data: {
      name: 'Proyecto',
      description: 'Código del proyecto asociado',
      inputType: TagInputType.FREE_TEXT
    }
  });

  console.log('✅ Seed completado exitosamente!');
  console.log(`   - ${techDirections.length} direcciones tecnológicas`);
  console.log(`   - ${userAreas.length} áreas de usuario`);
  console.log(`   - ${financialCompanies.length} empresas financieras`);
  console.log(`   - 2 presupuestos`);
  console.log(`   - 3 gastos`);
  console.log(`   - Valores plan y transacciones creados`);
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
