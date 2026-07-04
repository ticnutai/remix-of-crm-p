import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ONLYOFFICE_DOCUMENT_SERVER_URL =
  Deno.env.get("ONLYOFFICE_DOCUMENT_SERVER_URL") ||
  Deno.env.get("ONLYOFFICE_DOC_SERVER_URL") ||
  "";
const ONLYOFFICE_JWT_SECRET = Deno.env.get("ONLYOFFICE_JWT_SECRET") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
};

type OfficeFileType = "docx" | "doc" | "xlsx" | "xls" | "pptx" | "ppt" | "pdf";

interface ConfigRequest {
  documentId: string;
}

function documentTypeFor(fileType: string) {
  if (["xlsx", "xls", "ods", "csv"].includes(fileType)) return "cell";
  if (["pptx", "ppt", "odp"].includes(fileType)) return "slide";
  return "word";
}

function base64Url(input: ArrayBuffer | string) {
  const bytes =
    typeof input === "string" ? new TextEncoder().encode(input) : new Uint8Array(input);
  let binary = "";
  bytes.forEach((byte) => (binary += String.fromCharCode(byte)));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function signJwt(payload: Record<string, unknown>, secret: string) {
  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = base64Url(JSON.stringify(header));
  const encodedPayload = base64Url(JSON.stringify(payload));
  const data = `${encodedHeader}.${encodedPayload}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return `${data}.${base64Url(signature)}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!ONLYOFFICE_DOCUMENT_SERVER_URL) {
      return new Response(
        JSON.stringify({
          error:
            "ONLYOFFICE_DOCUMENT_SERVER_URL is not configured in Supabase Edge Function secrets.",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid user token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { documentId }: ConfigRequest = await req.json();
    if (!documentId) {
      return new Response(JSON.stringify({ error: "documentId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: document, error: documentError } = await adminClient
      .from("onlyoffice_documents")
      .select("*")
      .eq("id", documentId)
      .eq("created_by", user.id)
      .single();

    if (documentError || !document) {
      return new Response(JSON.stringify({ error: "Document not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: signedUrl, error: signedUrlError } = await adminClient.storage
      .from("onlyoffice-documents")
      .createSignedUrl(document.storage_path, 60 * 60);

    if (signedUrlError || !signedUrl?.signedUrl) {
      throw new Error(signedUrlError?.message || "Could not create signed document URL");
    }

    const callbackUrl = `${SUPABASE_URL}/functions/v1/onlyoffice-callback?documentId=${document.id}`;
    const fileType = (document.file_type || "docx").toLowerCase() as OfficeFileType;

    const config: Record<string, unknown> = {
      document: {
        fileType,
        key: document.document_key,
        title: document.title || document.file_name,
        url: signedUrl.signedUrl,
        permissions: {
          comment: true,
          copy: true,
          download: true,
          edit: fileType !== "pdf",
          fillForms: true,
          print: true,
          review: true,
        },
      },
      documentType: documentTypeFor(fileType),
      editorConfig: {
        callbackUrl,
        lang: "he",
        mode: fileType === "pdf" ? "view" : "edit",
        user: {
          id: user.id,
          name: user.email || "NCRM user",
        },
        customization: {
          autosave: true,
          compactToolbar: false,
          forcesave: true,
          help: true,
          hideRightMenu: false,
        },
      },
      type: "desktop",
    };

    if (ONLYOFFICE_JWT_SECRET) {
      config.token = await signJwt(config, ONLYOFFICE_JWT_SECRET);
    }

    await adminClient
      .from("onlyoffice_documents")
      .update({ last_opened_at: new Date().toISOString(), status: "editing" })
      .eq("id", document.id);

    return new Response(
      JSON.stringify({
        documentServerUrl: ONLYOFFICE_DOCUMENT_SERVER_URL.replace(/\/$/, ""),
        config,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    console.error("onlyoffice-config error:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
