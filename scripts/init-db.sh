#!/bin/bash

# Script to initialize and launch local database setup with Drizzle Kit
# This script creates the database if it doesn't exist and sets up the schema

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_ROOT"

# Load environment variables
if [ -f .env.local ]; then
    export $(cat .env.local | grep -v '^#' | xargs)
fi

DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5433}
DB_USER=${DB_USER:-postgres}
DB_PASSWORD=${DB_PASSWORD:-postgres}
DB_NAME=${DB_NAME:-taskmanager}

echo "🚀 Initializing Task Manager database..."

# Check if PostgreSQL is accessible
if ! command -v psql &> /dev/null; then
    echo "❌ Error: psql command not found. Please install PostgreSQL."
    exit 1
fi

# Check if PostgreSQL is running
echo "⏳ Checking PostgreSQL connection..."
export PGPASSWORD=$DB_PASSWORD
if ! psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c '\q' 2>/dev/null; then
    echo "❌ Error: Cannot connect to PostgreSQL at $DB_HOST:$DB_PORT"
    echo "   Please make sure PostgreSQL is running and accessible."
    exit 1
fi

echo "✅ PostgreSQL is running"

# Check if database exists, create if it doesn't
echo "📊 Checking if database '$DB_NAME' exists..."
DB_EXISTS=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" 2>/dev/null || echo "")

if [ -z "$DB_EXISTS" ]; then
    echo "📦 Creating database '$DB_NAME'..."
    psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "CREATE DATABASE $DB_NAME" 2>/dev/null
    echo "✅ Database created"
else
    echo "✅ Database already exists"
fi

# Run schema setup
echo ""
echo "📝 Setting up database schema with Drizzle Kit..."
npm run setup-db

echo ""
echo "✅ Database initialization complete!"
echo ""
echo "💡 Next steps:"
echo "   - View your database with: npm run db:studio"
echo "   - Start your app with: npm run dev"
echo ""
echo "📊 Data Storage:"
echo "   Your database data is stored in PostgreSQL's data directory"
echo "   Data will persist between PostgreSQL restarts"
echo "   Find location: psql -U postgres -c 'SHOW data_directory;'"

