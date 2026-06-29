import { supabase } from "@/integrations/supabase/client";

export type BrandAssetKind = "logo" | "strip" | "bundle";
export type BrandAssetSource = "local" | "cloud" | "synced";

export interface FlowBrandAsset {
  id: string;
  name: string;
  kind: BrandAssetKind;
  logoDataUrl?: string;
  stripDataUrl?: string;
  logoUrl?: string;
  stripUrl?: string;
  designState?: any;
  createdAt: string;
  updatedAt: string;
  source?: BrandAssetSource;
}

const DB_NAME = "flow_brand_assets";
const STORE_NAME = "assets";
const DB_VERSION = 1;
const CLOUD_BUCKET = "logo-layers";
const CLOUD_FOLDER = "brand-assets";

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `asset-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function canUseIndexedDb() {
  return typeof indexedDB !== "undefined";
}

function openDb() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    if (!canUseIndexedDb()) {
      reject(new Error("IndexedDB unavailable"));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("updatedAt", "updatedAt");
        store.createIndex("kind", "kind");
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("IndexedDB open failed"));
  });
}

async function withStore<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T> | void) {
  const db = await openDb();
  return new Promise<T | void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, mode);
    const store = tx.objectStore(STORE_NAME);
    const request = run(store);
    tx.oncomplete = () => {
      db.close();
      resolve(request ? request.result : undefined);
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error || new Error("IndexedDB transaction failed"));
    };
  });
}

export async function listLocalBrandAssets(): Promise<FlowBrandAsset[]> {
  try {
    const db = await openDb();
    return await new Promise<FlowBrandAsset[]>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const request = tx.objectStore(STORE_NAME).getAll();
      request.onsuccess = () => resolve((request.result || []).map((asset) => ({ ...asset, source: "local" })));
      request.onerror = () => reject(request.error || new Error("IndexedDB read failed"));
      tx.oncomplete = () => db.close();
      tx.onerror = () => db.close();
    });
  } catch {
    return [];
  }
}

export async function saveLocalBrandAsset(asset: FlowBrandAsset) {
  await withStore("readwrite", (store) => store.put(asset));
}

export async function deleteLocalBrandAsset(id: string) {
  await withStore("readwrite", (store) => store.delete(id));
}

function dataUrlToBlob(dataUrl: string) {
  const [header, payload] = dataUrl.split(",");
  const mime = header.match(/data:([^;]+)/)?.[1] || "image/png";
  const binary = /;base64/i.test(header) ? atob(payload || "") : decodeURIComponent(payload || "");
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

function extensionForDataUrl(dataUrl: string) {
  if (dataUrl.startsWith("data:image/svg")) return "svg";
  if (dataUrl.startsWith("data:image/webp")) return "webp";
  if (dataUrl.startsWith("data:image/jpeg") || dataUrl.startsWith("data:image/jpg")) return "jpg";
  return "png";
}

async function uploadDataUrl(dataUrl: string | undefined, id: string, slot: "logo" | "strip") {
  if (!dataUrl || !dataUrl.startsWith("data:")) return dataUrl;
  const { data: userData } = await supabase.auth.getUser();
  const owner = userData.user?.id || "system";
  const ext = extensionForDataUrl(dataUrl);
  const path = `${CLOUD_FOLDER}/${owner}/${id}-${slot}.${ext}`;
  const blob = dataUrlToBlob(dataUrl);

  const { error } = await supabase.storage.from(CLOUD_BUCKET).upload(path, blob, {
    cacheControl: "31536000",
    contentType: blob.type,
    upsert: true,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(CLOUD_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function listCloudBrandAssets(): Promise<FlowBrandAsset[]> {
  const { data, error } = await (supabase as any)
    .from("brand_assets")
    .select("id,name,kind,logo_url,strip_url,design_state,created_at,updated_at")
    .order("updated_at", { ascending: false });

  if (error || !Array.isArray(data)) return [];

  return data.map((row: any) => ({
    id: row.id,
    name: row.name || "ללא שם",
    kind: row.kind || "bundle",
    logoUrl: row.logo_url || undefined,
    stripUrl: row.strip_url || undefined,
    designState: row.design_state || undefined,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
    source: "cloud",
  }));
}

export async function saveCloudBrandAsset(asset: FlowBrandAsset) {
  const logoUrl = await uploadDataUrl(asset.logoDataUrl || asset.logoUrl, asset.id, "logo");
  const stripUrl = await uploadDataUrl(asset.stripDataUrl || asset.stripUrl, asset.id, "strip");
  const { data: userData } = await supabase.auth.getUser();

  const { error } = await (supabase as any).from("brand_assets").upsert(
    {
      id: asset.id,
      name: asset.name,
      kind: asset.kind,
      logo_url: logoUrl || null,
      strip_url: stripUrl || null,
      design_state: asset.designState || null,
      created_by: userData.user?.id || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );
  if (error) throw error;

  return { ...asset, logoUrl, stripUrl, source: "synced" as const };
}

export async function deleteCloudBrandAsset(id: string) {
  await (supabase as any).from("brand_assets").delete().eq("id", id);
}

export async function listBrandAssets() {
  const [localAssets, cloudAssets] = await Promise.all([listLocalBrandAssets(), listCloudBrandAssets()]);
  const merged = new Map<string, FlowBrandAsset>();

  for (const asset of cloudAssets) merged.set(asset.id, asset);
  for (const asset of localAssets) {
    const cloud = merged.get(asset.id);
    merged.set(asset.id, cloud ? { ...asset, logoUrl: cloud.logoUrl, stripUrl: cloud.stripUrl, source: "synced" } : asset);
  }

  return Array.from(merged.values()).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function makeBrandAsset(input: {
  name: string;
  kind: BrandAssetKind;
  logoDataUrl?: string;
  stripDataUrl?: string;
  designState?: any;
}) {
  const now = new Date().toISOString();
  return {
    id: createId(),
    name: input.name.trim() || "נכס מותג חדש",
    kind: input.kind,
    logoDataUrl: input.logoDataUrl,
    stripDataUrl: input.stripDataUrl,
    designState: input.designState,
    createdAt: now,
    updatedAt: now,
    source: "local" as const,
  };
}
