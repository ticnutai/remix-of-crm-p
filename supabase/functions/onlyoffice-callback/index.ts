import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
};

const contentTypes: Record<string, string> = {
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  doc: "application/msword",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  xls: "application/vnd.ms-excel",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ppt: "application/vnd.ms-powerpoint",
  pdf: "application/pdf",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const url = new URL(req.url);
    const documentId = url.searchParams.get("documentId");
    const payload = await req.json();

    if (!documentId) {
      return new Response(JSON.stringify({ error: 1 }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: document, error: documentError } = await adminClient
      .from("onlyoffice_documents")
      .select("*")
      .eq("id", documentId)
      .single();

    if (documentError || !document) {
      console.error("ONLYOFFICE callback document not found:", documentError);
      return new Response(JSON.stringify({ error: 1 }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const status = Number(payload.status);

    // 2 = ready for saving, 6 = force save. Other statuses are acknowledged.
    if ((status === 2 || status === 6) && payload.url) {
      const fileResponse = await fetch(payload.url);
      if (!fileResponse.ok) {
        throw new Error(`Could not download saved document: HTTP ${fileResponse.status}`);
      }

      const bytes = new Uint8Array(await fileResponse.arrayBuffer());
      const nextVersion = Number(document.version || 1) + 1;
      const fileType = String(document.file_type || "docx").toLowerCase();

      const { error: uploadError } = await adminClient.storage
        .from("onlyoffice-documents")
        .upload(document.storage_path, bytes, {
          upsert: true,
          contentType: contentTypes[fileType] || "application/octet-stream",
        });

      if (uploadError) throw uploadError;

      const { error: versionError } = await adminClient
        .from("onlyoffice_document_versions")
        .insert({
          document_id: document.id,
          version: nextVersion,
          storage_path: document.storage_path,
          size_bytes: bytes.byteLength,
          saved_by: Array.isArray(payload.users) && payload.users.length ? payload.users[0] : null,
          callback_payload: payload,
        });

      if (versionError && !String(versionError.message).includes("duplicate")) {
        throw versionError;
      }

      const nextKey = `${document.id}-${nextVersion}-${Date.now()}`;
      await adminClient
        .from("onlyoffice_documents")
        .update({
          version: nextVersion,
          size_bytes: bytes.byteLength,
          saved_at: new Date().toISOString(),
          status: "saved",
          document_key: nextKey,
        })
        .eq("id", document.id);
    } else if (status === 1) {
      await adminClient
        .from("onlyoffice_documents")
        .update({ status: "opened", last_opened_at: new Date().toISOString() })
        .eq("id", document.id);
    } else if (status === 4) {
      await adminClient
        .from("onlyoffice_documents")
        .update({ status: "closed" })
        .eq("id", document.id);
    }

    return new Response(JSON.stringify({ error: 0 }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("ONLYOFFICE callback error:", error);
    return new Response(JSON.stringify({ error: 1, message: error.message }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
