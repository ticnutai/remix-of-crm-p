# Project instructions

## Database migrations

- For any migration-status or migration-execution request, use the personal `run-crm-migrations` skill when available.
- Read `MIGRATION_RUNNER_GUIDE.md` completely before running migrations.
- Run project migrations from this repository root through `node scripts/direct-run.mjs`; do not substitute another migration path without explaining why.
- Inspect `public/pending-migrations.json` first. Do not rerun entries already marked `completed`.
- Never print credentials embedded in scripts or environment files.
- Treat timeouts and connection failures as failures, not as successful migrations.
