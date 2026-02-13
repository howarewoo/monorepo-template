# Staging Database Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Set up a staging database environment where development merges to staging branch (synced to staging DB), then staging merges to main (migrating changes to production).

**Architecture:** Create a new Supabase project for staging, update CI/CD workflows to deploy migrations to staging on staging branch pushes, and add a promotion workflow that syncs staging migrations to production when staging merges to main.

**Tech Stack:** Supabase CLI, GitHub Actions, Vercel environment variables

---

## Development Workflow

**Local development pulls from staging:**
```
Staging DB (source of truth for dev)
     ↓ db:pull (pulls schema + runs migrations + gencode)
Local Supabase → Local builds (pnpm dev)
     ↓ Create migration (db:diff)
     ↓ Test locally (db:reset)
     ↓ Commit + PR to staging
```

**GitHub Actions handle all remote databases:**
```
PR merged to staging → GitHub Action → Migrations to Staging DB
PR merged to main    → GitHub Action → Migrations to Production DB
```

**Key principles:**
1. **Staging is source of truth for development** - Local `db:pull` syncs from staging
2. **Developers NEVER manually push** to staging or production - All remote database operations happen through GitHub Actions
3. **Production only receives migrations** when staging merges to main

---

## Prerequisites

Before starting, you'll need:
- Supabase account access to create a new project
- GitHub repository admin access for secrets/variables
- Vercel dashboard access for environment configuration

---

## Task 1: Verify Staging Supabase Project

**Files:**
- Reference: `.env` (staging project already exists)

The staging project already exists:
- Project Ref: `ukjiofxqcdhebwutbthz`
- URL: `https://ukjiofxqcdhebwutbthz.supabase.co`

**Step 1: Get the missing keys from Supabase dashboard**

1. Go to https://supabase.com/dashboard/project/ukjiofxqcdhebwutbthz/settings/api
2. Copy:
   - `anon` `public` key → `STAGING_SUPABASE_PUBLISHABLE_KEY`
   - `service_role` `secret` key → `STAGING_SUPABASE_SECRET_KEY`

**Step 2: Update `.env` with correct key names**

Replace the placeholder entries:
```
STAGING_SUPABASE_PUBLISHABLE_KEY=<actual-publishable-key>
NEXT_PUBLIC_STAGING_SUPABASE_PUBLISHABLE_KEY=<actual-publishable-key>
STAGING_SUPABASE_SECRET_KEY=<actual-secret-key>
```

Remove the old placeholder lines:
```
STAGING_SUPABASE_ANON_KEY=<anon-key>
STAGING_SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

**Step 3: Commit checkpoint**

No code changes yet - this is environment setup.

---

## Task 2: Update Database Scripts for Staging-First Development

**Files:**
- Modify: `packages/infrastructure/supabase/package.json`

**Step 1: Update scripts to make staging the default for development**

Update these scripts in `package.json`:

```json
{
  "scripts": {
    "gencode": "pnpx supabase gen types typescript --project-id $STAGING_SUPABASE_PROJECT_REF > ./src/generated/database.types.ts",
    "db:link": "pnpx supabase link --project-ref $STAGING_SUPABASE_PROJECT_REF",
    "db:pull": "pnpx supabase db pull && pnpm db:migrate && pnpm gencode",
    "db:link:production": "pnpx supabase link --project-ref srfopnjnuypnsgvsuwfa",
    "gencode:production": "pnpx supabase gen types typescript --project-id srfopnjnuypnsgvsuwfa > ./src/generated/database.types.ts"
  }
}
```

**Changes:**
- `db:link` now points to **staging** (was production)
- `gencode` now generates from **staging** (was production)
- Added `db:link:production` and `gencode:production` for rare production access
- `gencode:local` remains unchanged (for local development)

**Step 2: Verify script syntax**

Run: `cd packages/infrastructure/supabase && cat package.json | jq '.scripts'`

Expected: Valid JSON with updated scripts.

**Step 3: Commit**

```bash
gt add packages/infrastructure/supabase/package.json
gt commit -m "feat(supabase): make staging the default for db:link and gencode"
```

---

## Task 3: Initialize Staging Database Schema (One-Time Setup)

**Files:**
- Reference: `packages/infrastructure/supabase/migrations/`

This is a one-time setup to bring staging in sync with production's current state.

**Step 1: Verify the staging environment variable**

The `.env` already has:
```bash
STAGING_SUPABASE_PROJECT_REF=ukjiofxqcdhebwutbthz
```

**Step 2: Link to staging and push all migrations**

```bash
cd packages/infrastructure/supabase
pnpm db:link  # Now links to staging by default
pnpx supabase db push
```

Expected: All 51+ migrations applied successfully.

**Step 3: Run seed data on staging**

```bash
pnpx supabase db reset --linked
```

Note: This applies migrations + seed.sql to staging. Alternatively, run seed.sql via Supabase Studio SQL editor.

**Step 4: Verify staging database**

1. Open staging Supabase Studio (https://<staging-ref>.supabase.co)
2. Verify all tables exist
3. Check seed data is present (roles, pricing plans, AI providers)

**Step 5: Verify local can pull from staging**

```bash
pnpm db:pull
```

Expected: Schema pulled from staging, types regenerated.

---

## Task 4: Add GitHub Repository Secrets

**Files:**
- None (GitHub UI configuration)

**Step 1: Add staging secrets to GitHub**

Go to: Repository → Settings → Secrets and variables → Actions

Add these secrets:
- `STAGING_SUPABASE_PROJECT_REF` = `ukjiofxqcdhebwutbthz`
- `STAGING_SUPABASE_SECRET_KEY` - The staging service role key

Note: `SUPABASE_ACCESS_TOKEN` can be reused (same Supabase account).

**Step 2: Add staging variables to GitHub**

Go to: Repository → Settings → Secrets and variables → Actions → Variables

Add these variables:
- `STAGING_SUPABASE_URL` = `https://ukjiofxqcdhebwutbthz.supabase.co`
- `STAGING_SUPABASE_PUBLISHABLE_KEY` - Public key for staging

**Step 3: Verify secrets are configured**

Check Actions secrets page shows:
- `SUPABASE_ACCESS_TOKEN` (existing)
- `STAGING_SUPABASE_PROJECT_REF` (new)
- `STAGING_SUPABASE_SECRET_KEY` (new)

---

## Task 5: Create Staging CI Workflow

**Files:**
- Create: `.github/workflows/staging.yml`

**Step 1: Create the staging workflow file**

```yaml
name: Staging Deployment

on:
  push:
    branches:
      - staging

concurrency:
  group: staging-deployment
  cancel-in-progress: false

env:
  SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
  STAGING_SUPABASE_PROJECT_REF: ${{ secrets.STAGING_SUPABASE_PROJECT_REF }}

jobs:
  test:
    name: Run Tests
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version-file: ".nvmrc"
          cache: "pnpm"

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run tests
        run: pnpm test

      - name: Run linter
        run: pnpm lint

  push-migrations:
    name: Push Migrations to Staging
    runs-on: ubuntu-latest
    needs: test
    timeout-minutes: 15
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Supabase CLI
        uses: supabase/setup-cli@v1
        with:
          version: latest

      - name: Link to Staging Project
        run: supabase link --project-ref $STAGING_SUPABASE_PROJECT_REF
        working-directory: packages/infrastructure/supabase

      - name: Dry Run Migration
        run: supabase db push --dry-run
        working-directory: packages/infrastructure/supabase

      - name: Push Migrations
        run: supabase db push
        working-directory: packages/infrastructure/supabase
```

**Step 2: Verify YAML syntax**

Run: `cat .github/workflows/staging.yml | yq .`

Expected: Valid YAML output without errors.

**Step 3: Commit**

```bash
gt add .github/workflows/staging.yml
gt commit -m "ci: add staging deployment workflow"
```

---

## Task 6: Update CD Workflow for Production Promotion

**Files:**
- Modify: `.github/workflows/cd.yml`

**Step 1: Read the current CD workflow**

Review the existing workflow structure.

**Step 2: Update trigger to only run from staging merge**

Update the workflow to ensure migrations only deploy when staging is merged:

```yaml
name: CD

on:
  push:
    branches:
      - main

concurrency:
  group: cd-main
  cancel-in-progress: false

env:
  SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}

jobs:
  push-migrations:
    name: Push Migrations to Production
    runs-on: ubuntu-latest
    timeout-minutes: 15
    # Only run if migrations changed (from staging merge)
    if: |
      contains(github.event.head_commit.message, 'staging') ||
      contains(github.event.commits.*.message, 'Merge branch')
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 2

      - name: Check for Migration Changes
        uses: dorny/paths-filter@v3
        id: changes
        with:
          filters: |
            migrations:
              - 'packages/infrastructure/supabase/migrations/*.sql'

      - name: Setup Supabase CLI
        if: steps.changes.outputs.migrations == 'true'
        uses: supabase/setup-cli@v1
        with:
          version: latest

      - name: Link to Production Project
        if: steps.changes.outputs.migrations == 'true'
        run: supabase link --project-ref srfopnjnuypnsgvsuwfa
        working-directory: packages/infrastructure/supabase

      - name: Dry Run Migration
        if: steps.changes.outputs.migrations == 'true'
        run: supabase db push --dry-run
        working-directory: packages/infrastructure/supabase

      - name: Push Migrations to Production
        if: steps.changes.outputs.migrations == 'true'
        run: supabase db push
        working-directory: packages/infrastructure/supabase
```

**Step 3: Commit**

```bash
gt add .github/workflows/cd.yml
gt commit -m "ci: update CD workflow for staging-to-production promotion"
```

---

## Task 7: Update CI Workflow for PR Validation

**Files:**
- Modify: `.github/workflows/ci.yml`

**Step 1: Read the current CI workflow**

Review to understand current PR validation.

**Step 2: Update to validate against staging**

Ensure PR migrations are validated against staging (not production):

```yaml
  validate-migrations:
    name: Validate Migrations (Staging)
    runs-on: ubuntu-latest
    needs: test
    timeout-minutes: 10
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Check for Migration Changes
        uses: dorny/paths-filter@v3
        id: changes
        with:
          filters: |
            migrations:
              - 'packages/infrastructure/supabase/migrations/*.sql'

      - name: Setup Supabase CLI
        if: steps.changes.outputs.migrations == 'true'
        uses: supabase/setup-cli@v1
        with:
          version: latest

      - name: Link to Staging Project
        if: steps.changes.outputs.migrations == 'true'
        run: supabase link --project-ref ${{ secrets.STAGING_SUPABASE_PROJECT_REF }}
        working-directory: packages/infrastructure/supabase
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}

      - name: Dry Run Against Staging
        if: steps.changes.outputs.migrations == 'true'
        run: supabase db push --dry-run
        working-directory: packages/infrastructure/supabase
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
```

**Step 3: Commit**

```bash
gt add .github/workflows/ci.yml
gt commit -m "ci: validate PR migrations against staging database"
```

---

## Task 8: Configure Vercel Staging Environment

**Files:**
- None (Vercel UI configuration)

**Step 1: Add staging environment variables in Vercel**

For each app (landing, web, internal):

1. Go to Vercel project settings → Environment Variables
2. Add variables with "Preview" environment targeting `staging` branch:
   - `SUPABASE_URL` = `https://ukjiofxqcdhebwutbthz.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://ukjiofxqcdhebwutbthz.supabase.co`
   - `SUPABASE_PUBLISHABLE_KEY` = staging publishable key
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` = staging publishable key
   - `SUPABASE_SECRET_KEY` = staging secret key

**Step 2: Configure branch-specific deployments**

In Vercel project settings → Git:
- Production Branch: `main`
- Preview Branches: Enable for `staging`

**Step 3: Test configuration**

Push a test commit to staging branch and verify:
- Vercel creates preview deployment
- Environment variables point to staging Supabase

---

## Task 9: Update Branch Protection Rules

**Files:**
- None (GitHub UI configuration)

**Step 1: Configure staging branch protection**

Go to: Repository → Settings → Branches → Add rule

For `staging` branch:
- Require pull request reviews: 1 approval
- Require status checks: `test`, `validate-migrations`
- Require branches to be up to date before merging: Yes
- Include administrators: Yes

**Step 2: Update main branch protection**

Ensure main branch:
- Requires PR from staging (or allow direct from staging)
- Require status checks to pass

**Step 3: Document the workflow**

The flow should be:
```
feature-branch → PR → staging (migrations to staging DB)
staging → PR → main (migrations to production DB)
```

---

## Task 10: Create Documentation

**Files:**
- Create: `specs/STAGING_ENVIRONMENT.md`

**Step 1: Write the staging environment documentation**

```markdown
# Staging Environment Guide

## Overview

TrioSens uses a two-tier deployment strategy:
- **Staging**: Source of truth for development, integration testing
- **Production**: Live environment for end users

## Key Principle

**Local development syncs from staging, not production.**

```
Production (live users)
     ↑ (staging→main merge)
Staging (source of truth for dev)
     ↑ (feature→staging merge)
     ↓ (db:pull)
Local Development
```

## Database Projects

| Environment | Project ID | Purpose |
|-------------|-----------|---------|
| Production | `srfopnjnuypnsgvsuwfa` | Live users only |
| Staging | `ukjiofxqcdhebwutbthz` | Development source of truth |
| Local | N/A (localhost:54321) | Individual dev work |

## Development Workflow

### 1. Sync Local from Staging

```bash
pnpm --filter @infrastructure/supabase db:start   # Start local Supabase
pnpm --filter @infrastructure/supabase db:pull    # Pull schema from staging
```

### 2. Create Migration Locally

```bash
cd packages/infrastructure/supabase
pnpm db:diff      # Creates timestamped migration file
pnpm db:reset     # Test locally (destructive)
pnpm gencode:local # Update types from local
```

### 3. Push to Staging (via PR)

1. Commit migration + updated types
2. Create PR to `staging` branch
3. CI validates migration (dry-run against staging)
4. Merge PR → GitHub Action pushes to staging DB

### 4. Promote to Production (via PR)

1. Create PR from `staging` to `main`
2. Merge PR → GitHub Action pushes to production DB

## Commands Reference

| Command | Target | Purpose |
|---------|--------|---------|
| `db:link` | Staging | Link CLI to staging (default) |
| `db:pull` | Staging | Pull schema + migrate + gencode |
| `gencode` | Staging | Generate types from staging |
| `gencode:local` | Local | Generate types from local |
| `db:link:production` | Production | Link CLI to production (rare) |
| `gencode:production` | Production | Generate types from production (rare) |

## Vercel Environments

| Branch | Vercel Environment | Supabase |
|--------|-------------------|----------|
| `main` | Production | Production |
| `staging` | Preview | Staging |

## Troubleshooting

### Local schema out of sync

```bash
pnpm --filter @infrastructure/supabase db:pull  # Syncs from staging
```

### Migration failed on staging

1. Check Supabase Studio for staging project
2. Review migration SQL for errors
3. Fix migration and create new PR

### Need to access production (rare)

```bash
pnpm --filter @infrastructure/supabase db:link:production
# Do what you need, then re-link to staging:
pnpm --filter @infrastructure/supabase db:link
```
```

**Step 2: Commit**

```bash
gt add specs/STAGING_ENVIRONMENT.md
gt commit -m "docs: add staging environment guide"
```

---

## Task 11: Update CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

**Step 1: Add staging workflow to CLAUDE.md**

Add a section under Database Migrations:

```markdown
## Staging Environment

**Local development syncs from staging, not production.**

```
Production ← (staging→main merge, GitHub Action)
     ↑
Staging ← (feature→staging merge, GitHub Action)
     ↓
Local (db:pull syncs from staging)
```

**Workflow:**
1. `db:pull` - Sync local schema from staging
2. `db:diff` - Create migration locally
3. `db:reset` - Test locally
4. PR to `staging` - GitHub Action deploys to staging DB
5. PR to `main` - GitHub Action deploys to production DB

**Commands:**
- `db:link` / `db:pull` / `gencode` - All target **staging** by default
- `db:link:production` / `gencode:production` - For rare production access

See `specs/STAGING_ENVIRONMENT.md` for complete documentation.
```

**Step 2: Commit**

```bash
gt add CLAUDE.md
gt commit -m "docs: add staging environment workflow to CLAUDE.md"
```

---

## Task 12: End-to-End Verification

**Files:**
- None (manual testing)

**Step 1: Create test migration**

```bash
cd packages/infrastructure/supabase
echo "-- Test migration for staging verification
SELECT 1;" > migrations/$(date +%Y%m%d_%H%M%S)_staging_test.sql
```

**Step 2: Create feature branch and PR to staging**

```bash
gt create staging-test
gt add migrations/
gt commit -m "test: add staging verification migration"
gt submit --stack
```

**Step 3: Verify CI runs migration dry-run**

Check GitHub Actions:
- CI workflow triggers
- Migration validation step runs against staging
- Dry-run succeeds

**Step 4: Merge to staging**

Merge the PR. Verify:
- Staging workflow triggers
- Migrations pushed to staging DB

**Step 5: Verify staging database**

Open staging Supabase Studio. Check:
- Migration appears in `supabase_migrations` table
- Schema changes applied (if any)

**Step 6: Create PR from staging to main**

```bash
gt trunk
gt branch checkout staging
# Create PR to main via GitHub UI
```

**Step 7: Verify production promotion**

After merge to main:
- CD workflow triggers
- Migrations pushed to production

**Step 8: Clean up test migration**

Remove the test migration file and create a revert if needed.

**Step 9: Final commit**

```bash
gt commit -m "test: verify staging database workflow"
```

---

## Summary

After completing all tasks:

1. ✅ Staging Supabase project created
2. ✅ Database scripts updated (staging as default)
3. ✅ Staging database initialized with all migrations
4. ✅ GitHub secrets configured
5. ✅ Staging CI workflow created
6. ✅ CD workflow updated for production promotion
7. ✅ CI workflow validates against staging
8. ✅ Vercel staging environment configured
9. ✅ Branch protection rules set
10. ✅ Documentation written
11. ✅ CLAUDE.md updated
12. ✅ End-to-end verification complete

**Final workflow:**
```
LOCAL DEVELOPMENT:
  db:pull → syncs from staging
  db:diff → create migration
  db:reset → test locally

DEPLOYMENT (via GitHub Actions only):
  PR to staging → migrations to staging DB
  PR to main → migrations to production DB
```

**Key change:** Local development now syncs from staging (not production). Developers never manually push to remote databases.
