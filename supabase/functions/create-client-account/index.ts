import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !serviceRoleKey || !anonKey) {
    return json({ error: "Missing Supabase configuration" }, 500);
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) return json({ error: "Unauthorized" }, 401);

    const { data: roles, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id);
    if (roleError) throw roleError;
    const allowed = (roles || []).some(({ role }) =>
      ["admin", "super_manager", "manager"].includes(role)
    );
    if (!allowed) return json({ error: "Management access required" }, 403);

    const { clientId, email, password, clientName, phone, accessMethod = "secure_link" } =
      await req.json();
    if (!clientId || !email || !password) {
      return json({ error: "clientId, email, and password are required" }, 400);
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const { data: existingClient, error: clientError } = await supabaseAdmin
      .from("clients")
      .select("id, name, phone, user_id")
      .eq("id", clientId)
      .single();
    if (clientError || !existingClient) return json({ error: "Client not found" }, 404);
    if (existingClient.user_id) {
      return json({ error: "ללקוח זה כבר יש חשבון כניסה" }, 400);
    }

    const { data: userData, error: createError } =
      await supabaseAdmin.auth.admin.createUser({
        email: normalizedEmail,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: clientName || existingClient.name || normalizedEmail,
          must_change_password: accessMethod === "phone_password",
        },
      });
    if (createError || !userData.user) {
      return json({ error: createError?.message || "Failed to create user" }, 400);
    }

    const userId = userData.user.id;
    try {
      const { error: roleInsertError } = await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: userId, role: "client" }, { onConflict: "user_id,role" });
      if (roleInsertError) throw roleInsertError;

      const { error: linkError } = await supabaseAdmin
        .from("clients")
        .update({
          user_id: userId,
          email: normalizedEmail,
          ...(phone ? { phone: String(phone).replace(/\D/g, "") } : {}),
        })
        .eq("id", clientId);
      if (linkError) throw linkError;

      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .update({
          full_name: clientName || existingClient.name || normalizedEmail,
          approval_status: "approved",
          is_active: true,
          approved_at: new Date().toISOString(),
          approved_by: caller.id,
        })
        .eq("id", userId);
      if (profileError) throw profileError;
    } catch (setupError) {
      await supabaseAdmin.from("clients").update({ user_id: null }).eq("id", clientId);
      await supabaseAdmin.auth.admin.deleteUser(userId);
      throw setupError;
    }

    return json({
      success: true,
      message: `חשבון נוצר בהצלחה עבור ${clientName || normalizedEmail}`,
      user_id: userId,
      email: normalizedEmail,
    });
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      500,
    );
  }
});
