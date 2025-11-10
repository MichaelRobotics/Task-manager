# Database Setup Guide

This guide explains how to set up and use PostgreSQL with Drizzle ORM for the Task Manager application.

## Quick Start (Local Development)

### 1. Install PostgreSQL

Make sure PostgreSQL is installed and running on your local machine:

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**macOS:**
```bash
brew install postgresql
brew services start postgresql
```

**Windows:**
Download and install from [PostgreSQL official website](https://www.postgresql.org/download/windows/)

### 2. Create Database

Create the database for the application:

```bash
createdb taskmanager
```

Or using psql:
```bash
psql -U postgres
CREATE DATABASE taskmanager;
\q
```

### 3. Set Up Environment Variables

Create a `.env.local` file in the project root:

```env
DB_HOST=localhost
DB_PORT=5433
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=taskmanager
PORT=3001
```

Or copy from the example:
```bash
cp .env.local.example .env.local
```

### 4. Initialize Database and Set Up Schema

**Option 1: Full initialization (recommended for first time)**
```bash
npm run db:init
```
This will:
- Check if PostgreSQL is running
- Create the database if it doesn't exist
- Set up the schema with Drizzle Kit

**Option 2: Schema setup only (if database already exists)**
```bash
npm run setup-db
```

**Option 3: Manual setup**
```bash
npm run db:generate  # Generate migrations
npm run db:push      # Push schema to database
```

### 5. Start Your Application

```bash
npm run dev
```

## Available Scripts

- `npm run db:init` - Initialize database (creates DB if needed, then sets up schema with Drizzle Kit)
- `npm run setup-db` - Set up database schema with Drizzle Kit (generates and pushes) - requires DB to exist
- `npm run db:generate` - Generate Drizzle migrations
- `npm run db:push` - Push schema changes to database (dev)
- `npm run db:migrate` - Run migrations (production)
- `npm run db:studio` - Open Drizzle Studio (database GUI)

## Database Connection

### Local Development
- **Host**: `localhost`
- **Port**: `5433` (to avoid conflict with other PostgreSQL instances)
- **User**: `postgres`
- **Password**: `postgres`
- **Database**: `taskmanager`
- **Connection String**: `postgresql://postgres:postgres@localhost:5433/taskmanager`
- **Application Port**: `3001` (to avoid conflict with other services)

### Production (Docker Compose)

The production `docker-compose.yml` includes:
- `task-manager-postgres` - PostgreSQL service (external port: 5433, internal: 5432)
- `task-manager-app` - Your Next.js application (external port: 3001, internal: 3000)

**Port Configuration:**
- Database: External port `5433` (to avoid conflicts with other PostgreSQL instances)
- Application: External port `3001` (to avoid conflicts with other services)
- Internal container ports remain standard (5432 for DB, 3000 for app)

To start in production:
```bash
docker-compose up -d
```

## Database Schema

### Tables

#### `panels`
- `id` (VARCHAR) - Primary key
- `userId` (VARCHAR) - Unique user identifier
- `sendToLocations` (TEXT[]) - Array of locations panel can send to
- `receiveFromLocations` (TEXT[]) - Array of locations panel can receive from
- `createdAt` (TIMESTAMP) - Creation timestamp


## Using Drizzle in Your Code

```typescript
import { db } from '@/db';
import { panels } from '@/db/schema';
import { eq } from 'drizzle-orm';

// Get all panels
const allPanels = await db.select().from(panels);

// Get panel by userId
const panel = await db.select().from(panels).where(eq(panels.userId, 'user-123'));

// Create a panel
const newPanel = await db.insert(panels).values({
  id: 'panel-123',
  userId: 'user-123',
  sendToLocations: ['A1', 'A2'],
  receiveFromLocations: ['B1', 'B2'],
}).returning();

// Update a panel
await db.update(panels)
  .set({ sendToLocations: ['A1', 'A2', 'A3'] })
  .where(eq(panels.userId, 'user-123'));

// Delete a panel
await db.delete(panels).where(eq(panels.userId, 'user-123'));
```

## Data Storage and Persistence

### Where is Data Stored?

**Local PostgreSQL:**
- Data is stored in PostgreSQL's data directory (typically `/var/lib/postgresql/...`)
- Data persists between PostgreSQL service restarts
- Find location: `psql -U postgres -c "SHOW data_directory;"`

**Docker (Production):**
- Data is stored in Docker volume: `task-manager-postgres-data`
- Volume persists between container restarts
- Find location: `docker volume inspect task-manager-postgres-data`

### Data Persistence

✅ **Data persists when:**
- PostgreSQL service restarts
- System reboots
- Docker container restarts
- Application restarts

⚠️ **Data is lost when:**
- Database is dropped (`DROP DATABASE`)
- Data directory is deleted
- Docker volume is removed

For more details, see [DATABASE_STORAGE.md](./DATABASE_STORAGE.md)

## Troubleshooting

### Database connection errors
- Verify `.env.local` exists and has correct values
- Check if PostgreSQL is running: `pg_isready` or `systemctl status postgresql`
- Test connection: `psql -U postgres -d taskmanager -h localhost`
- Verify database exists: `psql -U postgres -l | grep taskmanager`

### PostgreSQL not found
- Make sure PostgreSQL is installed and in your PATH
- Check installation: `psql --version`
- On Linux, ensure PostgreSQL service is running: `sudo systemctl status postgresql`

### Schema changes not applying
- Run `npm run db:generate` to create migrations
- Run `npm run db:push` to apply changes

## Production Deployment

For production, use `docker-compose.yml`:

```bash
# Set environment variables
export DB_USER=your_user
export DB_PASSWORD=your_secure_password
export DB_NAME=taskmanager

# Start services
docker-compose up -d

# Run migrations
npm run db:migrate
```

The production setup includes:
- Persistent data volumes
- Health checks
- Automatic restarts
- Network isolation

