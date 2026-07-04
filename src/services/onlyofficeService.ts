import JSZip from "jszip";
import { supabase } from "@/integrations/supabase/client";

export type OnlyOfficeDocument = {
  id: string;
  title: string;
  file_name: string;
  file_type: string;
  mime_type: string;
  storage_path: string;
  document_key: string;
  status: string;
  version: number;
  size_bytes: number;
  client_id?: string | null;
  created_by: string;
  last_opened_at?: string | null;
  saved_at?: string | null;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type OnlyOfficeEditorPayload = {
  documentServerUrl: string;
  config: Record<string, unknown>;
};

const BUCKET = "onlyoffice-documents";

const MIME_BY_EXTENSION: Record<string, string> = {
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  doc: "application/msword",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  xls: "application/vnd.ms-excel",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ppt: "application/vnd.ms-powerpoint",
  pdf: "application/pdf",
};

const SUPPORTED_EXTENSIONS = Object.keys(MIME_BY_EXTENSION);

function safeFileName(name: string) {
  return name
    .trim()
    .replace(/[\\/:*?"<>|#%{}~&]/g, "-")
    .replace(/\s+/g, " ")
    .slice(0, 140);
}

function getExtension(fileName: string) {
  return fileName.split(".").pop()?.toLowerCase() || "docx";
}

export function isOnlyOfficeSupported(fileName: string) {
  return SUPPORTED_EXTENSIONS.includes(getExtension(fileName));
}

export function formatOfficeFileSize(bytes?: number) {
  if (!bytes) return "0 KB";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / Math.pow(1024, index)).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function fileToBase64(file: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      resolve(result.includes(",") ? result.split(",")[1] : result);
    };
    reader.onerror = () => reject(reader.error || new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}

async function createBlankDocxBlob() {
  const zip = new JSZip();

  zip.file(
    "[Content_Types].xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>`,
  );

  zip.file(
    "_rels/.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`,
  );

  zip.file(
    "word/document.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p><w:r><w:t>מסמך חדש</w:t></w:r></w:p>
    <w:p/>
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="708" w:footer="708" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>`,
  );

  zip.file(
    "docProps/core.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <dc:title>מסמך חדש</dc:title>
  <dc:creator>NCRM</dc:creator>
</cp:coreProperties>`,
  );

  zip.file(
    "docProps/app.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties">
  <Application>NCRM</Application>
</Properties>`,
  );

  return zip.generateAsync({
    type: "blob",
    mimeType: MIME_BY_EXTENSION.docx,
    compression: "DEFLATE",
  });
}

export async function createBlankOnlyOfficeDocument(title = "מסמך חדש") {
  const blob = await createBlankDocxBlob();
  const file = new File([blob], `${title || "מסמך חדש"}.docx`, {
    type: MIME_BY_EXTENSION.docx,
  });
  return uploadOnlyOfficeDocument(file, title);
}

export async function uploadOnlyOfficeDocument(file: File, title?: string) {
  const extension = getExtension(file.name);
  if (!SUPPORTED_EXTENSIONS.includes(extension)) {
    throw new Error("סוג הקובץ לא נתמך על ידי עורך OnlyOffice");
  }

  const fileName = safeFileName(file.name || `${title || "document"}.${extension}`);
  const documentTitle = title?.trim() || fileName.replace(/\.[^.]+$/, "") || "מסמך חדש";
  const base64 = await fileToBase64(file);

  const { data, error } = await supabase.functions.invoke("onlyoffice-upload", {
    body: {
      title: documentTitle,
      fileName,
      mimeType: file.type || MIME_BY_EXTENSION[extension],
      originalName: file.name,
      base64,
    },
  });

  if (error) throw error;
  return data.document as OnlyOfficeDocument;
}

export async function listOnlyOfficeDocuments() {
  const { data, error } = await (supabase as any)
    .from("onlyoffice_documents")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return (data || []) as OnlyOfficeDocument[];
}

export async function deleteOnlyOfficeDocument(document: OnlyOfficeDocument) {
  const { error } = await supabase.functions.invoke("onlyoffice-file", {
    body: { action: "delete", documentId: document.id },
  });
  if (error) throw error;
}

export async function getOnlyOfficeEditorConfig(documentId: string) {
  const { data, error } = await supabase.functions.invoke("onlyoffice-config", {
    body: { documentId },
  });
  if (error) throw new Error(error.message);
  return data as OnlyOfficeEditorPayload;
}

export async function createOnlyOfficeDownloadUrl(document: OnlyOfficeDocument) {
  const { data, error } = await supabase.functions.invoke("onlyoffice-file", {
    body: { action: "download-url", documentId: document.id },
  });
  if (error) throw error;
  return data.url as string;
}
