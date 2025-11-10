#!/bin/bash

# Script to set up the database schema (run migrations)
# This should be run after ensuring PostgreSQL is running locally
# 
# IMPORTANT DATA PERSISTENCE NOTES:
# - db:push is safe if schema hasn't changed (no-op)
# - db:push can be DESTRUCTIVE if schema changed (may drop columns/tables)
# - For production, use db:migrate instead (safer, preserves data)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_ROOT"

echo "📦 Setting up Task Manager database schema..."

# Check if PostgreSQL is accessible (basic check)
if ! command -v psql &> /dev/null; then
    echo "⚠️  Warning: psql command not found. Make sure PostgreSQL is installed and in your PATH."
fi

# Generate migrations
echo "📝 Generating database migrations..."
npm run db:generate

# Check if any migrations were generated
if [ -d "drizzle" ] && [ "$(ls -A drizzle 2>/dev/null)" ]; then
    MIGRATION_COUNT=$(find drizzle -name "*.sql" 2>/dev/null | wc -l)
    if [ "$MIGRATION_COUNT" -gt 0 ]; then
        echo "⚠️  Warning: Schema changes detected!"
        echo "   db:push may modify your database structure."
        echo "   Your data will be preserved, but columns may be added/removed."
    else
        echo "✅ No schema changes detected - safe to proceed"
    fi
else
    echo "✅ No migrations to apply - schema is up to date"
fi

# Push schema to database
echo "🚀 Pushing schema to database..."
npm run db:push

echo "✅ Database setup complete!"
echo ""
echo "💡 You can now:"
echo "   - View your database with: npm run db:studio"
echo "   - Start your app with: npm run dev"
echo ""
echo "📌 Note: For production, use 'npm run db:migrate' instead (safer for data)"

