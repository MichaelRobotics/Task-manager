# Quick Start - Database Setup

## 🚀 Local Development

1. **Install and start PostgreSQL locally:**
   - Make sure PostgreSQL is installed and running on your machine
   - Create database: `createdb taskmanager`

2. **Create `.env.local` file:**
   ```bash
   cp .env.local.example .env.local
   ```

3. **Initialize database and set up schema:**
   ```bash
   npm run db:init
   ```
   
   Or if database already exists:
   ```bash
   npm run setup-db
   ```

4. **Start your app:**
   ```bash
   npm run dev
   ```

## 📋 Available Commands

| Command | Description |
|---------|-------------|
| `npm run db:init` | Initialize database (creates DB + sets up schema) |
| `npm run setup-db` | Set up database schema (requires DB to exist) |
| `npm run db:studio` | Open Drizzle Studio (database GUI) |
| `npm run db:push` | Push schema changes (dev) |
| `npm run db:generate` | Generate migrations |
| `npm run db:migrate` | Run migrations (production) |

## 🐳 Production (Docker Compose)

```bash
docker-compose up -d
```

This starts:
- `task-manager-postgres` - PostgreSQL database
- `task-manager-app` - Your Next.js application

## 📖 Full Documentation

See [DATABASE_SETUP.md](./DATABASE_SETUP.md) for complete documentation.

