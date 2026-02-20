#!/bin/bash
# =============================================================
# Script de Deploy: Dashboard & Savings Overhaul + Fixes
# =============================================================
# Ejecutar en EC2 como: bash DEPLOY_DASHBOARD_OVERHAUL.sh
# =============================================================

set -e

echo "🚀 Iniciando deploy de Dashboard & Savings Overhaul..."

cd /home/ubuntu/tech-budget-management

# 1. Pull latest changes
echo "📥 Descargando cambios de Git..."
git pull origin main

# 2. Backend: Install deps, generate Prisma, push schema, build
echo "🔧 Configurando backend..."
cd backend
npm install

echo "📦 Generando cliente Prisma..."
npx prisma generate

echo "📦 Aplicando cambios de esquema (db push)..."
npx prisma db push

echo "🔨 Compilando backend..."
npm run build

# 3. Actualizar permisos del admin (agrega APPROVE_BUDGET)
echo "🔑 Actualizando permisos del administrador..."
npx ts-node src/updateAdminPermissions.ts

# 4. Frontend: Install deps, build
echo "🎨 Configurando frontend..."
cd ../frontend
npm install

echo "🔨 Compilando frontend..."
npm run build

# 5. Restart backend service
echo "♻️  Reiniciando servicio backend..."
cd ..
pm2 restart tech-budget-api

echo "📋 Logs del servicio:"
pm2 logs tech-budget-api --lines 30

echo ""
echo "✅ Deploy completado exitosamente!"
echo ""
echo "📝 Cambios incluidos:"
echo "   - BudgetTable: columnas colapsables de última modificación + meses M1-M12"
echo "   - Todos los confirm()/alert() reemplazados por ConfirmationDialog"
echo "   - API: endpoints savingsApi.activate y budgetApi.submitForReview"
echo "   - Admin: permiso APPROVE_BUDGET agregado"
echo "   - BudgetsPage: popup de detalle de solicitudes de cambio"
echo "   - ApprovalsPage: meses M1-M12 + ConfirmationDialog"
echo "   - Seed: SavingStatus.APPROVED → SavingStatus.ACTIVE"
echo "   - BudgetService: import correcto de SavingStatus"
echo "   - DeferralsPage: meses M1-M12"
