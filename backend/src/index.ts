import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { budgetRouter } from './routes/budgetRoutes';
import { expenseRouter } from './routes/expenseRoutes';
import { transactionRouter } from './routes/transactionRoutes';
import { planValueRouter } from './routes/planValueRoutes';
import { masterDataRouter } from './routes/masterDataRoutes';
import { taggingRouter } from './routes/taggingRoutes';
import { conversionRateRouter } from './routes/conversionRateRoutes';
import { authRouter } from './routes/authRoutes';
import { userRouter } from './routes/userRoutes';
import { roleRouter } from './routes/roleRoutes';
import { savingsRouter } from './routes/savings';
import { expensesRouter } from './routes/expenses';
import { deferralsRouter } from './routes/deferrals';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { AuthService } from './services/AuthService';
import { PasswordService } from './services/PasswordService';
import { UserService } from './services/UserService';
import { RoleService } from './services/RoleService';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// Initialize services and ensure default admin exists
const passwordService = new PasswordService();
const userService = new UserService(prisma, passwordService);
const roleService = new RoleService(prisma);
const authService = new AuthService(prisma, passwordService, userService, roleService);

// Ensure default admin user exists on startup
authService.ensureDefaultAdmin().catch(console.error);

// Middleware
app.use(cors());
app.use(express.json());
app.use(requestLogger);

// Authentication and Authorization Routes
app.use('/api/auth', authRouter(prisma));
app.use('/api/users', userRouter(prisma));
app.use('/api/roles', roleRouter(prisma));

// Existing Routes
app.use('/api/budgets', budgetRouter(prisma));
app.use('/api/expenses', expenseRouter(prisma));
app.use('/api/transactions', transactionRouter(prisma));
app.use('/api/plan-values', planValueRouter(prisma));
app.use('/api/technology-directions', masterDataRouter(prisma, 'TECH_DIRECTION'));
app.use('/api/user-areas', masterDataRouter(prisma, 'USER_AREA'));
app.use('/api/financial-companies', masterDataRouter(prisma, 'FINANCIAL_COMPANY'));
app.use('/api/tag-definitions', taggingRouter(prisma));
app.use('/api/conversion-rates', conversionRateRouter(prisma));

// New Routes - Savings and Enhanced Expenses
app.use('/api/savings', savingsRouter(prisma));
app.use('/api/expenses-enhanced', expensesRouter(prisma));
app.use('/api/deferrals', deferralsRouter(prisma));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Servir archivos estáticos del frontend en producción
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../frontend/dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
  });
}

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
