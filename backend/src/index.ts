import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { budgetRouter } from './routes/budgetRoutes';
import { expenseRouter } from './routes/expenseRoutes';
import { transactionRouter } from './routes/transactionRoutes';
import { planValueRouter } from './routes/planValueRoutes';
import { masterDataRouter } from './routes/masterDataRoutes';
import { taggingRouter } from './routes/taggingRoutes';
import { conversionRateRouter } from './routes/conversionRateRoutes';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(requestLogger);

// Routes
app.use('/api/budgets', budgetRouter(prisma));
app.use('/api/expenses', expenseRouter(prisma));
app.use('/api/transactions', transactionRouter(prisma));
app.use('/api/plan-values', planValueRouter(prisma));
app.use('/api/technology-directions', masterDataRouter(prisma, 'TECH_DIRECTION'));
app.use('/api/user-areas', masterDataRouter(prisma, 'USER_AREA'));
app.use('/api/financial-companies', masterDataRouter(prisma, 'FINANCIAL_COMPANY'));
app.use('/api/tag-definitions', taggingRouter(prisma));
app.use('/api/conversion-rates', conversionRateRouter(prisma));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler (debe ser el último middleware)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Servidor backend ejecutándose en http://localhost:${PORT}`);
  console.log(`📊 Health check disponible en http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Cerrando servidor...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Cerrando servidor...');
  await prisma.$disconnect();
  process.exit(0);
});
