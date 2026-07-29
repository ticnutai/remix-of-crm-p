import { describe, expect, it } from "vitest";
import {
  BackupData,
  fitBackupsForLocalStorage,
} from "./useBackupRestore";

const makeBackup = (
  id: string,
  createdAt: string,
  payloadSize: number,
): BackupData => ({
  metadata: {
    id,
    name: id,
    createdAt: new Date(createdAt),
    size: payloadSize,
    version: "1.0.0",
  },
  data: { payload: "x".repeat(payloadSize) },
});

describe("fitBackupsForLocalStorage", () => {
  it("keeps at most the newest two backups", () => {
    const result = fitBackupsForLocalStorage(
      [
        makeBackup("old", "2026-01-01", 10),
        makeBackup("new", "2026-03-01", 10),
        makeBackup("middle", "2026-02-01", 10),
      ],
      10_000,
    );
    expect(result.map((backup) => backup.metadata.id)).toEqual([
      "new",
      "middle",
    ]);
  });

  it("does not attempt to persist an oversized full backup", () => {
    expect(
      fitBackupsForLocalStorage(
        [makeBackup("huge", "2026-03-01", 2_000)],
        500,
      ),
    ).toEqual([]);
  });
});
