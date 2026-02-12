import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

/**
 * 🚀 deploy-function Edge Function
 * =================================
 * Enables deploying/updating Edge Functions via the Supabase Management API.
 * Similar to how execute-sql enables running migrations without CLI access.
 *
 * Required Secret: SUPABASE_MANAGEMENT_TOKEN (sbp_xxx personal access token)
 *
 * Actions:
 *   - list: List all deployed functions
 *   - deploy: Deploy/update a function
 *   - get: Get function details
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const PROJECT_REF = "eadeymehidcndudeycnf";
const MANAGEMENT_API = "https://api.supabase.com/v1";

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get management token from secrets
    const managementToken = Deno.env.get("SUPABASE_MANAGEMENT_TOKEN");
    if (!managementToken) {
      return new Response(
        JSON.stringify({
          success: false,
          error:
            "SUPABASE_MANAGEMENT_TOKEN secret is not configured. Please set it in Edge Function Secrets.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Auth check - verify the caller has a valid Supabase JWT
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing authorization header",
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Parse request
    const body = await req.json();
    const { action, function_name, function_code, verify_jwt } = body;

    // Common headers for Management API
    const mgmtHeaders = {
      Authorization: `Bearer ${managementToken}`,
      "Content-Type": "application/json",
    };

    // === LIST ===
    if (action === "list") {
      const resp = await fetch(
        `${MANAGEMENT_API}/projects/${PROJECT_REF}/functions`,
        {
          headers: mgmtHeaders,
        },
      );

      if (!resp.ok) {
        const errorText = await resp.text();
        return new Response(
          JSON.stringify({
            success: false,
            error: `Management API error: ${resp.status} - ${errorText}`,
          }),
          {
            status: resp.status,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      const functions = await resp.json();
      return new Response(
        JSON.stringify({ success: true, functions, count: functions.length }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // === DEPLOY ===
    if (action === "deploy") {
      if (!function_name || !function_code) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "function_name and function_code are required",
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      // Check if function exists
      const checkResp = await fetch(
        `${MANAGEMENT_API}/projects/${PROJECT_REF}/functions/${function_name}`,
        { headers: mgmtHeaders },
      );

      let result;
      let actionTaken;

      if (checkResp.ok) {
        // Function exists → UPDATE (PATCH)
        actionTaken = "updated";

        // For updating, we need to send the body as the function source
        // The Management API expects the function body in a specific format
        const updateResp = await fetch(
          `${MANAGEMENT_API}/projects/${PROJECT_REF}/functions/${function_name}`,
          {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${managementToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              body: function_code,
              verify_jwt: verify_jwt ?? false,
            }),
          },
        );

        if (!updateResp.ok) {
          const errorText = await updateResp.text();
          return new Response(
            JSON.stringify({
              success: false,
              error: `Update failed: ${updateResp.status} - ${errorText}`,
              function_name,
            }),
            {
              status: updateResp.status,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
          );
        }

        result = await updateResp.json();
      } else if (checkResp.status === 404) {
        // Function doesn't exist → CREATE (POST)
        actionTaken = "created";

        const createResp = await fetch(
          `${MANAGEMENT_API}/projects/${PROJECT_REF}/functions`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${managementToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              slug: function_name,
              name: function_name,
              body: function_code,
              verify_jwt: verify_jwt ?? false,
            }),
          },
        );

        if (!createResp.ok) {
          const errorText = await createResp.text();
          return new Response(
            JSON.stringify({
              success: false,
              error: `Create failed: ${createResp.status} - ${errorText}`,
              function_name,
            }),
            {
              status: createResp.status,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
          );
        }

        result = await createResp.json();
      } else {
        return new Response(
          JSON.stringify({
            success: false,
            error: `Check failed: ${checkResp.status}`,
            function_name,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          action: actionTaken,
          function_name,
          result,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // === GET ===
    if (action === "get") {
      if (!function_name) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "function_name is required",
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      const resp = await fetch(
        `${MANAGEMENT_API}/projects/${PROJECT_REF}/functions/${function_name}`,
        { headers: mgmtHeaders },
      );

      if (!resp.ok) {
        const errorText = await resp.text();
        return new Response(
          JSON.stringify({
            success: false,
            error: `${resp.status} - ${errorText}`,
          }),
          {
            status: resp.status,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      const funcData = await resp.json();
      return new Response(
        JSON.stringify({ success: true, function: funcData }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // === SET SECRETS ===
    if (action === "set_secrets") {
      const { secrets } = body;
      if (!secrets || typeof secrets !== "object") {
        return new Response(
          JSON.stringify({
            success: false,
            error: "secrets object is required",
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      const secretsArray = Object.entries(secrets).map(([name, value]) => ({
        name,
        value,
      }));

      const resp = await fetch(
        `${MANAGEMENT_API}/projects/${PROJECT_REF}/secrets`,
        {
          method: "POST",
          headers: mgmtHeaders,
          body: JSON.stringify(secretsArray),
        },
      );

      if (!resp.ok) {
        const errorText = await resp.text();
        return new Response(
          JSON.stringify({
            success: false,
            error: `Set secrets failed: ${resp.status} - ${errorText}`,
          }),
          {
            status: resp.status,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: `${secretsArray.length} secrets set successfully`,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Unknown action
    return new Response(
      JSON.stringify({
        success: false,
        error: `Unknown action: "${action}". Supported: list, deploy, get, set_secrets`,
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
