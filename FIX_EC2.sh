#!/bin/bash
# Script para corregir errores de TypeScript directamente en EC2

cd /home/ubuntu/tech-budget-management/backend/src/services

# Fix AuthService.ts - Línea 107
sed -i '107s/const token = jwt.sign(/const token = jwt.sign(/' AuthService.ts
sed -i '110,112d' AuthService.ts
sed -i '107a\      {\n        userId: user.id,\n        username: user.username\n      },\n      JWT_SECRET as string,\n      { expiresIn: JWT_EXPIRATION as string }\n    );' AuthService.ts

# Fix AuthService.ts - Línea 230
sed -i '230s/const newToken = jwt.sign(/const newToken = jwt.sign(/' AuthService.ts
sed -i '233,235d' AuthService.ts
sed -i '230a\      {\n        userId: session.userId,\n        username: session.username\n      },\n      JWT_SECRET as string,\n      { expiresIn: JWT_EXPIRATION as string }\n    );' AuthService.ts

# Fix BudgetService.ts - Línea 204
sed -i '204s/transactionValue = change.transactionValue;/transactionValue = change.transactionValue as any;/' BudgetService.ts

# Fix BudgetService.ts - Línea 242
sed -i '242s/tagDefinitionId: tagValue.tagDefinitionId,/tagDefinitionId: tagValue.tagDefinition.id,/' BudgetService.ts

# Fix BudgetService.ts - Línea 243
sed -i '243s/value: tagValue.value/value: tagValue.value as any/' BudgetService.ts

echo "✅ Correcciones aplicadas"
