# Data Persistence Guide

This guide explains how data is handled when running database setup scripts.

## Important Concepts

### `db:push` vs `db:migrate`

| Command | Use Case | Data Safety | Behavior |
|---------|----------|-------------|----------|
| `db:push` | Development | ⚠️ Can be destructive | Directly syncs schema, may drop columns/tables |
| `db:migrate` | Production | ✅ Safe | Applies migrations incrementally, preserves data |

## What Happens to Your Data?

### Scenario 1: Schema Hasn't Changed

**When you run `npm run setup-db` or `npm run db:init`:**

1. `db:generate` checks your schema
2. If no changes detected:
   - ✅ **No migrations generated** (or empty migrations)
   - ✅ **Data is completely safe** - nothing happens
   - ✅ **Script completes successfully**

**Example:**
```bash
$ npm run setup-db
📝 Generating database migrations...
✅ No schema changes detected - safe to proceed
🚀 Pushing schema to database...
✅ Database setup complete!
```

### Scenario 2: Schema Has Changed (New Columns/Tables)

**When schema changes:**

1. `db:generate` creates migration files
2. `db:push` applies changes:
   - ✅ **New columns/tables**: Added safely, existing data preserved
   - ✅ **New indexes**: Created without affecting data
   - ⚠️ **Removed columns**: **DATA IN THOSE COLUMNS WILL BE LOST**
   - ⚠️ **Dropped tables**: **ALL DATA IN THOSE TABLES WILL BE LOST**

**Example:**
```bash
# You removed a column from schema.ts
$ npm run setup-db
📝 Generating database migrations...
⚠️  Warning: Schema changes detected!
🚀 Pushing schema to database...
# Column is dropped, data in that column is lost
```

### Scenario 3: Database Already Has Data

**Current behavior:**
- ✅ **Existing rows are preserved** when adding columns
- ✅ **Existing data is safe** if you only add new tables/columns
- ⚠️ **Data can be lost** if you remove columns or drop tables

## Best Practices

### For Development

✅ **Safe to use `db:push`:**
- Adding new columns
- Adding new tables
- Creating indexes
- Schema matches your code

⚠️ **Be careful with `db:push`:**
- Removing columns (data loss)
- Dropping tables (data loss)
- Renaming columns (may cause issues)

### For Production

✅ **Always use `db:migrate`:**
```bash
npm run db:migrate
```

This:
- Applies migrations incrementally
- Tracks which migrations ran
- Safer for data preservation
- Can be rolled back

## How to Check if Schema Changed

Before running setup, check:

```bash
# Generate migrations (doesn't modify DB)
npm run db:generate

# Check if any SQL files were created
ls -la drizzle/

# If empty or no new files, schema hasn't changed
```

## Data Safety Checklist

Before running `setup-db` or `db:init`:

- [ ] **Backup your database** if you have important data
- [ ] **Review schema changes** in `db/schema.ts`
- [ ] **Check generated migrations** in `drizzle/` folder
- [ ] **Test on development** database first
- [ ] **Use `db:migrate`** for production

## Backup Before Schema Changes

```bash
# Create backup
pg_dump -h localhost -p 5433 -U postgres taskmanager > backup_$(date +%Y%m%d).sql

# Restore if needed
psql -h localhost -p 5433 -U postgres taskmanager < backup_20240101.sql
```

## Summary

| Situation | Data Safety | Recommendation |
|-----------|-------------|----------------|
| Schema unchanged | ✅ 100% Safe | Run anytime |
| Adding columns/tables | ✅ Safe | Run safely |
| Removing columns | ⚠️ Data loss | Backup first |
| Dropping tables | ⚠️ Data loss | Backup first |
| Production environment | ⚠️ Use migrate | Use `db:migrate` |

## Quick Reference

```bash
# Development (can be destructive)
npm run setup-db      # Uses db:push

# Production (safer)
npm run db:migrate    # Uses migrations

# Check changes first
npm run db:generate   # Just generates, doesn't apply
```


