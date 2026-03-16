#!/bin/bash
# Script to force rebuild frontend with cache clearing

cd /home/ubuntu/tech-budget-management/frontend

# Remove node_modules/.vite cache
rm -rf node_modules/.vite

# Remove dist folder
rm -rf dist

# Rebuild
npm run build

# Verify the build
echo "=== Verifying build ==="
ls -la dist/
echo ""
echo "=== Checking for InvestIQ in built files ==="
grep -r "InvestIQ" dist/ || echo "WARNING: InvestIQ not found in build!"
echo ""
echo "=== Checking for Tech Budget in built files ==="
grep -r "Tech Budget" dist/ || echo "Good: Tech Budget not found in build"
