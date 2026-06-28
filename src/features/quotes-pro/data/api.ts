// Quotes Pro — שכבת נתונים (Supabase CRUD)
// הטבלאות qp_* עדיין לא בטיפוסים המחוללים → שימוש ב-(supabase as any).
import { supabase } from "@/integrations/supabase/client";
import {
  DEFAULT_QP_PAGE,
  DEFAULT_QP_PRICING,
  DEFAULT_QP_STRIPS,
  DEFAULT_QP_THEME,
} from "../model/defaults";
import type {
  QPDocument,
  QPFolder,
  QPThemePreset,
  QPVersion,
} from "../model/types";

const db = () => supabase as any;

// ----------------------------------------------------------------
// נירמול שורת DB → QPDocument (השלמת ברירות מחדל)
// ----------------------------------------------------------------
function normalizeDocument(row: any): QPDocument {
  return {
    id: row.id,
    name: row.name ?? "",
    description: row.description ?? "",
    category: row.category ?? "construction",
    folder_id: row.folder_id ?? null,
    blocks: Array.isArray(row.blocks) ? row.blocks : [],
    theme: { ...DEFAULT_QP_THEME, ...(row.theme || {}) },
    theme_id: row.theme_id ?? null,
    page: { ...DEFAULT_QP_PAGE, ...(row.page || {}) },
    strips: {
      header: { ...DEFAULT_QP_STRIPS.header, ...(row.strips?.header || {}) },
      footer: { ...DEFAULT_QP_STRIPS.footer, ...(row.strips?.footer || {}) },
    },
    pricing: { ...DEFAULT_QP_PRICING, ...(row.pricing || {}) },
    meta: row.meta || {},
    validity_days: row.validity_days ?? 30,
    is_active: row.is_active ?? true,
    is_public: row.is_public ?? false,
    share_token: row.share_token ?? undefined,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

// המרת QPDocument → payload לכתיבה
function toPayload(doc: Partial<QPDocument>) {
  const payload: Record<string, unknown> = {};
  if (doc.name !== undefined) payload.name = doc.name;
  if (doc.description !== undefined) payload.description = doc.description;
  if (doc.category !== undefined) payload.category = doc.category;
  if (doc.folder_id !== undefined) payload.folder_id = doc.folder_id;
  if (doc.blocks !== undefined) payload.blocks = doc.blocks;
  if (doc.theme !== undefined) payload.theme = doc.theme;
  if (doc.theme_id !== undefined) payload.theme_id = doc.theme_id;
  if (doc.page !== undefined) payload.page = doc.page;
  if (doc.strips !== undefined) payload.strips = doc.strips;
  if (doc.pricing !== undefined) payload.pricing = doc.pricing;
  if (doc.meta !== undefined) payload.meta = doc.meta;
  if (doc.validity_days !== undefined) payload.validity_days = doc.validity_days;
  if (doc.is_active !== undefined) payload.is_active = doc.is_active;
  return payload;
}

// ----------------------------------------------------------------
// Documents
// ----------------------------------------------------------------
export async function listDocuments(): Promise<QPDocument[]> {
  const { data, error } = await db()
    .from("qp_documents")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(normalizeDocument);
}

export async function getDocument(id: string): Promise<QPDocument | null> {
  const { data, error } = await db()
    .from("qp_documents")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? normalizeDocument(data) : null;
}

export async function createDocument(
  doc: Partial<QPDocument>,
): Promise<QPDocument> {
  const { data, error } = await db()
    .from("qp_documents")
    .insert([toPayload(doc)])
    .select("*")
    .single();
  if (error) throw error;
  return normalizeDocument(data);
}

export async function updateDocument(
  id: string,
  doc: Partial<QPDocument>,
): Promise<void> {
  const { error } = await db()
    .from("qp_documents")
    .update({ ...toPayload(doc), updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteDocument(id: string): Promise<void> {
  const { error } = await db().from("qp_documents").delete().eq("id", id);
  if (error) throw error;
}

export async function duplicateDocument(doc: QPDocument): Promise<QPDocument> {
  const { id, created_at, updated_at, is_public, share_token, ...rest } = doc;
  return createDocument({ ...rest, name: `${doc.name} (העתק)` });
}

// ----------------------------------------------------------------
// Sharing — קישור ציבורי ללקוח
// ----------------------------------------------------------------
/** מפעיל שיתוף ומחזיר את ה-share_token */
export async function enableSharing(id: string): Promise<string> {
  const { data, error } = await db()
    .from("qp_documents")
    .update({ is_public: true })
    .eq("id", id)
    .select("share_token")
    .single();
  if (error) throw error;
  return data.share_token as string;
}

export async function disableSharing(id: string): Promise<void> {
  const { error } = await db()
    .from("qp_documents")
    .update({ is_public: false })
    .eq("id", id);
  if (error) throw error;
}

/** קריאה ציבורית (anon) — מצליחה רק אם המסמך is_public */
export async function getPublicDocument(id: string): Promise<QPDocument | null> {
  const { data, error } = await db()
    .from("qp_documents")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? normalizeDocument(data) : null;
}

// ----------------------------------------------------------------
// Folders
// ----------------------------------------------------------------
export async function listFolders(): Promise<QPFolder[]> {
  const { data, error } = await db()
    .from("qp_folders")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data || []) as QPFolder[];
}

export async function saveFolder(folder: Partial<QPFolder>): Promise<void> {
  if (folder.id) {
    const { error } = await db()
      .from("qp_folders")
      .update({
        name: folder.name,
        color: folder.color,
        icon: folder.icon,
        parent_id: folder.parent_id ?? null,
      })
      .eq("id", folder.id);
    if (error) throw error;
  } else {
    const { error } = await db()
      .from("qp_folders")
      .insert([
        {
          name: folder.name,
          color: folder.color || "#d8ac27",
          parent_id: folder.parent_id ?? null,
          sort_order: folder.sort_order ?? 0,
        },
      ]);
    if (error) throw error;
  }
}

export async function deleteFolder(id: string): Promise<void> {
  // העברת מסמכים מהתיקייה החוצה ואז מחיקה
  await db().from("qp_documents").update({ folder_id: null }).eq("folder_id", id);
  const { error } = await db().from("qp_folders").delete().eq("id", id);
  if (error) throw error;
}

export async function moveDocumentToFolder(
  documentId: string,
  folderId: string | null,
): Promise<void> {
  const { error } = await db()
    .from("qp_documents")
    .update({ folder_id: folderId })
    .eq("id", documentId);
  if (error) throw error;
}

// ----------------------------------------------------------------
// Themes
// ----------------------------------------------------------------
export async function listThemes(): Promise<QPThemePreset[]> {
  const { data, error } = await db()
    .from("qp_themes")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []) as QPThemePreset[];
}

export async function saveThemePreset(
  preset: Pick<QPThemePreset, "name" | "theme">,
): Promise<void> {
  const { error } = await db().from("qp_themes").insert([preset]);
  if (error) throw error;
}

// ----------------------------------------------------------------
// Versions
// ----------------------------------------------------------------
export async function listVersions(documentId: string): Promise<QPVersion[]> {
  const { data, error } = await db()
    .from("qp_versions")
    .select("*")
    .eq("document_id", documentId)
    .order("version_number", { ascending: false });
  if (error) throw error;
  return (data || []) as QPVersion[];
}

export async function saveVersion(
  documentId: string,
  snapshot: Partial<QPDocument>,
  label = "גרסה",
): Promise<void> {
  const { data: nextNum } = await db().rpc("qp_next_version_number", {
    p_document_id: documentId,
  });
  const { error } = await db().from("qp_versions").insert([
    {
      document_id: documentId,
      version_number: nextNum ?? 1,
      label,
      snapshot,
    },
  ]);
  if (error) throw error;
}
