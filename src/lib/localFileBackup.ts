const DB_NAME = "tenarch-local-file-backup";
const STORE_NAME = "handles";
const HANDLE_KEY = "client-files-directory";

type DirectoryHandle = any;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export function supportsLocalFolderBackup() {
  return typeof window !== "undefined" && "showDirectoryPicker" in window;
}

export async function selectLocalBackupDirectory(): Promise<DirectoryHandle> {
  if (!supportsLocalFolderBackup()) throw new Error("הדפדפן אינו תומך בגיבוי לתיקייה מקומית");
  const handle = await (window as any).showDirectoryPicker({ mode: "readwrite" });
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(handle, HANDLE_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  return handle;
}

export async function getSavedLocalBackupDirectory(): Promise<DirectoryHandle | null> {
  if (!supportsLocalFolderBackup()) return null;
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).get(HANDLE_KEY);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

export async function ensureDirectoryPermission(handle: DirectoryHandle, request = false) {
  if ((await handle.queryPermission({ mode: "readwrite" })) === "granted") return true;
  return request && (await handle.requestPermission({ mode: "readwrite" })) === "granted";
}

const safePart = (value: string) =>
  [...value]
    .map((character) => (character.charCodeAt(0) < 32 || /[<>:"/\\|?*]/.test(character) ? "_" : character))
    .join("")
    .trim() || "ללא שם";

export async function backupFileLocally(
  root: DirectoryHandle,
  clientName: string,
  relativePath: string,
  file: File,
) {
  if (!(await ensureDirectoryPermission(root))) throw new Error("נדרשת הרשאה לתיקיית הגיבוי המקומית");
  let directory = await root.getDirectoryHandle(safePart(clientName), { create: true });
  const parts = relativePath.replace(/\\/g, "/").split("/").filter(Boolean);
  for (const part of parts.slice(0, -1)) {
    directory = await directory.getDirectoryHandle(safePart(part), { create: true });
  }
  const fileHandle = await directory.getFileHandle(safePart(parts.at(-1) || file.name), { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(file);
  await writable.close();
}
