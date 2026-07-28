import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { BACKUP_TABLE_NAMES, BACKUP_TABLE_REGISTRY } from "./backupRegistry";

describe("backup table registry", () => {
  it("contains unique table names", () => {
    expect(new Set(BACKUP_TABLE_NAMES).size).toBe(BACKUP_TABLE_NAMES.length);
  });

  it("backs up inspection forms and their task relationship", () => {
    expect(BACKUP_TABLE_NAMES).toEqual(
      expect.arrayContaining([
        "inspection_form_folders",
        "inspection_form_templates",
        "inspection_form_template_steps",
        "inspection_form_runs",
        "inspection_form_run_steps",
        "tasks",
      ]),
    );
    expect(BACKUP_TABLE_NAMES.indexOf("inspection_form_runs")).toBeLessThan(
      BACKUP_TABLE_NAMES.indexOf("tasks"),
    );
    expect(BACKUP_TABLE_NAMES.indexOf("tasks")).toBeLessThan(
      BACKUP_TABLE_NAMES.indexOf("client_payment_stages"),
    );
  });

  it("backs up quote, stage and payment relationships", () => {
    expect(BACKUP_TABLE_NAMES).toEqual(
      expect.arrayContaining([
        "quote_template_folders",
        "quote_templates",
        "quote_template_versions",
        "quotes",
        "quote_items",
        "quote_payments",
        "stage_templates",
        "stage_template_stages",
        "stage_template_tasks",
        "client_stages",
        "client_stage_tasks",
        "payments",
        "payment_schedules",
        "client_payment_stages",
        "client_additional_payments",
      ]),
    );
    expect(BACKUP_TABLE_NAMES.indexOf("saved_quotes")).toBeLessThan(
      BACKUP_TABLE_NAMES.indexOf("client_stage_tasks"),
    );
  });

  it("provides a visible label for every selectable table", () => {
    expect(
      BACKUP_TABLE_REGISTRY.every(({ label }) => label.trim().length > 0),
    ).toBe(true);
  });

  it("keeps automatic backup and restore functions in sync", () => {
    const autoBackupSource = readFileSync(
      resolve("supabase/functions/auto-backup/index.ts"),
      "utf8",
    );
    const restoreSource = readFileSync(
      resolve("supabase/functions/import-backup/index.ts"),
      "utf8",
    );
    const smartBackupSource = readFileSync(
      resolve("src/lib/smartBackup.ts"),
      "utf8",
    );

    for (const table of BACKUP_TABLE_NAMES) {
      expect(
        autoBackupSource,
        `${table} missing from automatic backup`,
      ).toContain(`"${table}"`);
      expect(restoreSource, `${table} missing from restore order`).toContain(
        `"${table}"`,
      );
      expect(smartBackupSource, `${table} missing from smart backup`).toContain(
        `"${table}"`,
      );
    }
  });
});
