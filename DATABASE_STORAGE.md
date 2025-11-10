# Database Storage and Data Persistence

This guide explains where PostgreSQL stores your data so it persists between database restarts.

## Data Storage Locations

### Local Development (PostgreSQL installed directly)

When you install PostgreSQL locally, data is stored in PostgreSQL's **data directory**:

**Linux (Ubuntu/Debian):**
```bash
/var/lib/postgresql/[VERSION]/main
# Example: /var/lib/postgresql/16/main
```

**macOS (Homebrew):**
```bash
/usr/local/var/postgres
# or
/opt/homebrew/var/postgres  # Apple Silicon
```

**Windows:**
```bash
C:\Program Files\PostgreSQL\[VERSION]\data
```

**Find your data directory:**
```bash
# Connect to PostgreSQL and check
psql -U postgres -c "SHOW data_directory;"

# Or check PostgreSQL config
psql -U postgres -c "SHOW config_file;"
# Then check the config file for 'data_directory'
```

### Production (Docker)

When using Docker Compose, data is stored in a **Docker volume**:

**Volume name:** `task-manager-postgres-data`

**Location on host:**
```bash
# Linux
/var/lib/docker/volumes/task-manager-postgres-data/_data

# macOS/Windows (Docker Desktop)
# Managed by Docker Desktop, accessible via Docker commands
```

**Find volume location:**
```bash
# List volumes
docker volume ls

# Inspect volume
docker volume inspect task-manager-postgres-data

# This shows the "Mountpoint" where data is stored
```

## Data Persistence

### ✅ Data Persists When:

1. **PostgreSQL service restarts** - Data is on disk, survives service restart
2. **System reboots** - Data directory remains on disk
3. **Application restarts** - Database is independent of your app
4. **Docker container restarts** - Volume persists data

### ⚠️ Data Lost When:

1. **Database is dropped** - `DROP DATABASE taskmanager;`
2. **Data directory is deleted** - Removing PostgreSQL data directory
3. **Docker volume is removed** - `docker volume rm task-manager-postgres-data`
4. **PostgreSQL is uninstalled** - Without backing up data first

## Backup and Restore

### Backup Local Database

```bash
# Backup database
pg_dump -h localhost -p 5433 -U postgres taskmanager > backup_$(date +%Y%m%d).sql

# Backup all databases
pg_dumpall -h localhost -p 5433 -U postgres > backup_all_$(date +%Y%m%d).sql
```

### Restore Local Database

```bash
# Restore from backup
psql -h localhost -p 5433 -U postgres taskmanager < backup_20240101.sql
```

### Backup Docker Volume

```bash
# Backup Docker volume
docker run --rm \
  -v task-manager-postgres-data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/postgres-backup-$(date +%Y%m%d).tar.gz /data

# Or backup database directly
docker exec task-manager-postgres pg_dump -U postgres taskmanager > backup.sql
```

### Restore Docker Volume

```bash
# Restore from database backup
docker exec -i task-manager-postgres psql -U postgres taskmanager < backup.sql

# Or restore entire volume
docker run --rm \
  -v task-manager-postgres-data:/data \
  -v $(pwd):/backup \
  alpine tar xzf /backup/postgres-backup-20240101.tar.gz -C /
```

## Verify Data Persistence

### Test: Restart PostgreSQL

**Local:**
```bash
# Stop PostgreSQL
sudo systemctl stop postgresql

# Start PostgreSQL
sudo systemctl start postgresql

# Check your data is still there
psql -h localhost -p 5433 -U postgres -d taskmanager -c "SELECT COUNT(*) FROM panels;"
```

**Docker:**
```bash
# Restart container
docker-compose -f docker-compose-new-container.yml restart task-manager-postgres

# Check data
docker exec task-manager-postgres psql -U postgres -d taskmanager -c "SELECT COUNT(*) FROM panels;"
```

## Data Directory Contents

The PostgreSQL data directory contains:
- **Base directory** - All database files
- **pg_wal/** - Write-Ahead Log (transaction log)
- **pg_tblspc/** - Tablespaces
- **global/** - Cluster-wide tables
- **pg_stat/** - Statistics files

**⚠️ Never manually edit files in the data directory!**

## Migration Between Systems

### Move Local Database to Docker

```bash
# 1. Backup local database
pg_dump -h localhost -p 5433 -U postgres taskmanager > migration.sql

# 2. Start Docker database
docker-compose -f docker-compose-new-container.yml up -d task-manager-postgres

# 3. Restore to Docker
docker exec -i task-manager-postgres psql -U postgres taskmanager < migration.sql
```

### Move Docker Database to Local

```bash
# 1. Backup Docker database
docker exec task-manager-postgres pg_dump -U postgres taskmanager > migration.sql

# 2. Restore to local
psql -h localhost -p 5433 -U postgres taskmanager < migration.sql
```

## Summary

| Environment | Data Location | Persists After |
|-------------|---------------|----------------|
| **Local PostgreSQL** | `/var/lib/postgresql/...` | Service restart, system reboot |
| **Docker Volume** | Docker managed volume | Container restart, system reboot |
| **Both** | On disk | ✅ Yes, data persists |

**Key Point:** As long as you don't delete the data directory or drop the database, your data will persist through restarts!


