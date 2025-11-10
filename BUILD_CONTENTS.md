# What Gets Included in Next.js Standalone Build

This document explains what files are included in the Docker build and what Next.js standalone output contains.

## How Standalone Output Works

When you set `output: 'standalone'` in `next.config.ts`, Next.js uses **automatic file tracing** to include only the files that are actually used by your application.

## ✅ Automatically Included in `.next/standalone/`

Next.js automatically traces and includes:

### 1. **Source Code Files** (via imports)
- ✅ `app/` directory - All pages, layouts, API routes, etc.
- ✅ `components/` - All components that are imported
- ✅ `actions/` - All server actions that are imported
- ✅ `hooks/` - All hooks that are imported
- ✅ Any other TypeScript/JavaScript files that are imported

### 2. **Minimal Dependencies**
- ✅ Only the `node_modules` packages that are actually used
- ✅ Automatically traced based on imports
- ✅ Much smaller than full `node_modules`

### 3. **Build Artifacts**
- ✅ Compiled JavaScript bundles
- ✅ Server-side code
- ✅ `server.js` - The main entry point

## ❌ NOT Automatically Included (Must Copy Manually)

These files are NOT included in standalone output and must be copied separately:

### 1. **Public Assets**
- ❌ `public/` folder - Static assets (images, fonts, etc.)
- **Solution**: Copy manually in Dockerfile (line 47)

### 2. **Static Build Output**
- ❌ `.next/static/` - Static chunks, CSS, JS bundles
- **Solution**: Copy manually in Dockerfile (line 49)

## 🚫 NOT Needed in Production (Build-Time Only)

These files are only needed during the build process, NOT in the final Docker image:

- ❌ `next.config.ts` - Only needed during build
- ❌ `tsconfig.json` - Only needed during build
- ❌ `eslint.config.mjs` - Only needed during build
- ❌ `postcss.config.mjs` - Only needed during build
- ❌ `package.json` - Not needed (standalone has its own)
- ❌ Source `.ts`/`.tsx` files - Already compiled to `.js`
- ❌ `node_modules` (full) - Only minimal traced deps included

## Current Dockerfile Structure

```dockerfile
# Stage 2: Builder
COPY . .                    # Copies ALL files for build
RUN npm run build           # Builds and creates .next/standalone

# Stage 3: Runner
COPY --from=builder /app/.next/standalone ./    # ✅ Includes: app/, components/, actions/, hooks/ (traced)
COPY --from=builder /app/public ./public         # ✅ Manual copy: public assets
COPY --from=builder /app/.next/static ./.next/static  # ✅ Manual copy: static chunks
```

## What's Actually in the Final Image?

After the build, your Docker image contains:

```
/app/
├── server.js                    # Main entry point (from standalone)
├── node_modules/                # Minimal traced dependencies only
├── package.json                 # From standalone
├── app/                         # ✅ Your app directory (compiled)
│   ├── api/
│   ├── layout.js
│   ├── page.js
│   └── ...
├── components/                  # ✅ Your components (compiled)
│   ├── ui/
│   ├── tasks/
│   └── ...
├── actions/                      # ✅ Your server actions (compiled)
│   ├── tasks.js
│   └── ...
├── hooks/                        # ✅ Your hooks (compiled)
│   ├── useTasks.js
│   └── ...
├── public/                       # ✅ Manually copied
│   └── ...
└── .next/
    └── static/                  # ✅ Manually copied
        └── ...
```

## File Tracing Example

If you have:

```typescript
// app/page.tsx
import { TaskList } from '@/components'
import { useTasks } from '@/hooks'

// components/tasks/TaskList.tsx
import { useTasks } from '@/hooks'
import { Button } from '@/components/ui/Button'

// hooks/useTasks.ts
// (makes API calls)
```

Next.js will automatically trace and include:
- ✅ `app/page.tsx` (entry point)
- ✅ `components/tasks/TaskList.tsx` (imported)
- ✅ `components/ui/Button.tsx` (imported)
- ✅ `hooks/useTasks.ts` (imported)
- ✅ All dependencies of these files

## Verifying What's Included

To see what files are actually traced, you can:

1. **Build locally:**
   ```bash
   npm run build
   ```

2. **Check the standalone folder:**
   ```bash
   ls -la .next/standalone/
   ```

3. **Inspect the structure:**
   ```bash
   find .next/standalone -type f | head -20
   ```

## Important Notes

1. **Only imported files are included** - If a file is never imported, it won't be in the build
2. **TypeScript is compiled** - Source `.ts`/`.tsx` files become `.js` in the build
3. **Config files are not needed** - They're only used during the build process
4. **Public and static must be copied** - These are not automatically included

## Summary

✅ **Included automatically:**
- `app/`, `components/`, `actions/`, `hooks/` (anything imported)
- Minimal `node_modules` (only used packages)
- Compiled JavaScript bundles

✅ **Included manually (in Dockerfile):**
- `public/` folder
- `.next/static/` folder

❌ **Not needed in production:**
- `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`
- Source `.ts`/`.tsx` files (already compiled)
- Full `node_modules` (only minimal deps included)

Your Dockerfile is correct! The standalone output includes everything you need (app, components, actions, hooks) automatically through file tracing.



