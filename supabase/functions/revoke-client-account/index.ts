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
  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const admin = createClient(url, serviceKey);
    const callerClient = createClient(url, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) return json({ error: "Unauthorized" }, 401);
    const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", caller.id);
    if (!(roles || []).some(({ role }) => ["admin", "super_manager", "manager"].includes(role))) {
      return json({ error: "Management access required" }, 403);
    }

    const { clientId } = await req.json();
    const { data: client, error } = await admin
      .from("clients").select("user_id").eq("id", clientId).single();
    if (error || !client?.user_id) return json({ error: "Portal account not found" }, 404);

    const userId = client.user_id;
    const { data: linkedClients, error: linkedError } = await admin
      .from("clients")
      .select("id")
      .eq("user_id", userId);
    if (linkedError) throw linkedError;

    const { error: unlinkError } = await admin.from("clients").update({ user_id: null }).eq("id", clientId);
    if (unlinkError) throw unlinkError;

    // Some historical data may link one login to more than one client record.
    // In that case only unlink this record; deleting the auth user would revoke
    // access to the other records as well.
    const canDeleteAuthUser = (linkedClients || []).length <= 1;
    if (canDeleteAuthUser) {
      const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
      if (deleteError) {
        await admin.from("clients").update({ user_id: userId }).eq("id", clientId);
        throw deleteError;
      }
    }
    return json({ success: true, authUserDeleted: canDeleteAuthUser });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Internal server error" }, 500);
  }
});
