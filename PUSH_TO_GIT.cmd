@echo off
echo Agregando archivos modificados...
git add backend/src/services/AuthService.ts backend/src/services/BudgetService.ts

echo Haciendo commit...
git commit -m "Fix: Errores de compilacion TypeScript en AuthService y BudgetService - usar connect para tagDefinition"

echo Subiendo a GitHub...
git push origin main

echo.
echo ===================================
echo Listo! Ahora ejecuta en EC2:
echo ===================================
echo cd /home/ubuntu/tech-budget-management ^&^& git reset --hard HEAD ^&^& git pull origin main ^&^& cd backend ^&^& npm run build ^&^& pm2 restart tech-budget-api
echo ===================================
pause
