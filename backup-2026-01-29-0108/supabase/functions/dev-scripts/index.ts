import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Script types
type ScriptType = 'sql' | 'diagnostic' | 'cleanup' | 'stats' | 'check' | 'custom';

interface DevScriptRequest {
  type: ScriptType;
  script?: string;
  options?: {
    dryRun?: boolean;
    verbose?: boolean;
    timeout?: number;
    targetTables?: string[];
  };
}

interface DevScriptResponse {
  success: boolean;
  type: ScriptType;
  message?: string;
  error?: string;
  data?: any;
  execution_time_ms?: number;
  dry_run?: boolean;
}

// Built-in scripts
const builtInScripts: Record<string, string> = {
  stats: `
    SELECT 
      'profiles' as table_name, COUNT(*) as count FROM profiles
    UNION ALL SELECT 'clients', COUNT(*) FROM clients
    UNION ALL SELECT 'projects', COUNT(*) FROM projects
    UNION ALL SELECT 'invoices', COUNT(*) FROM invoices
    UNION ALL SELECT 'quotes', COUNT(*) FROM quotes
    UNION ALL SELECT 'time_entries', COUNT(*) FROM time_entries
    UNION ALL SELECT 'tasks', COUNT(*) FROM tasks
    UNION ALL SELECT 'employees', COUNT(*) FROM employees
    ORDER BY table_name;
  `,
  
  recent_activity: `
    SELECT action, entity_type, entity_id, created_at 
    FROM activity_log 
    ORDER BY created_at DESC 
    LIMIT 20;
  `,
  
  check_rls: `
    SELECT schemaname, tablename 
    FROM pg_tables 
    WHERE schemaname = 'public' 
      AND tablename NOT IN (
        SELECT tablename FROM pg_policies WHERE schemaname = 'public'
      )
    ORDER BY tablename;
  `,
  
  orphan_files: `
    SELECT cf.id, cf.file_name, cf.created_at
    FROM client_files cf
    LEFT JOIN clients c ON cf.client_id = c.id
    WHERE c.id IS NULL
    LIMIT 50;
  `,
  
  large_tables: `
    SELECT 
      relname as table_name,
      pg_size_pretty(pg_total_relation_size(relid)) as total_size,
      pg_size_pretty(pg_relation_size(relid)) as data_size,
      n_live_tup as row_count
    FROM pg_stat_user_tables
    WHERE schemaname = 'public'
    ORDER BY pg_total_relation_size(relid) DESC
    LIMIT 20;
  `,
  
  index_usage: `
    SELECT 
      schemaname, tablename, indexname,
      idx_scan as times_used,
      pg_size_pretty(pg_relation_size(indexrelid)) as index_size
    FROM pg_stat_user_indexes
    WHERE schemaname = 'public'
    ORDER BY idx_scan DESC
    LIMIT 20;
  `,
  
  slow_queries: `
    SELECT 
      calls,
      round(total_exec_time::numeric, 2) as total_time_ms,
      round(mean_exec_time::numeric, 2) as avg_time_ms,
      left(query, 100) as query_preview
    FROM pg_stat_statements
    WHERE userid = (SELECT usesysid FROM pg_user WHERE usename = current_user)
    ORDER BY mean_exec_time DESC
    LIMIT 10;
  `,
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized - No token provided" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create client with user's token to verify they're admin
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify user and check admin status
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized - Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user is admin using RPC
    const { data: isAdmin, error: roleError } = await userClient.rpc("is_admin", {
      _user_id: user.id,
    });

    if (roleError || !isAdmin) {
      return new Response(
        JSON.stringify({ success: false, error: "Forbidden - Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const { type, script, options = {} }: DevScriptRequest = await req.json();

    if (!type) {
      return new Response(
        JSON.stringify({ success: false, error: "Script type is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { dryRun = false, verbose = false } = options;

    // Handle diagnostic type - use RPC function
    if (type === 'diagnostic') {
      const { data, error } = await userClient.rpc('run_system_diagnostic');
      
      if (error) {
        return new Response(
          JSON.stringify({
            success: false,
            type: 'diagnostic',
            error: error.message,
            execution_time_ms: Date.now() - startTime,
          } as DevScriptResponse),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          type: 'diagnostic',
          message: 'System diagnostic completed',
          data,
          execution_time_ms: Date.now() - startTime,
        } as DevScriptResponse),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Determine SQL to execute
    let sqlToExecute: string;

    if (type === 'custom' && script) {
      sqlToExecute = script;
    } else if (builtInScripts[type]) {
      sqlToExecute = builtInScripts[type];
    } else if (script) {
      sqlToExecute = script;
    } else {
      return new Response(
        JSON.stringify({ success: false, error: `Unknown script type: ${type}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get database URL
    const dbUrl = Deno.env.get("SUPABASE_DB_URL");
    
    if (!dbUrl) {
      return new Response(
        JSON.stringify({ success: false, error: "Database URL not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Execute SQL
    const { Client } = await import("https://deno.land/x/postgres@v0.17.0/mod.ts");
    
    const client = new Client(dbUrl);
    await client.connect();

    try {
      if (dryRun) {
        // Dry run - execute within transaction then rollback
        await client.queryArray("BEGIN");
        
        try {
          const result = await client.queryObject(sqlToExecute);
          await client.queryArray("ROLLBACK");
          
          return new Response(
            JSON.stringify({
              success: true,
              type,
              message: 'Dry run completed - no changes were made',
              data: result.rows,
              execution_time_ms: Date.now() - startTime,
              dry_run: true,
            } as DevScriptResponse),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        } catch (err) {
          await client.queryArray("ROLLBACK");
          throw err;
        }
      }

      // Normal execution
      const result = await client.queryObject(sqlToExecute);

      return new Response(
        JSON.stringify({
          success: true,
          type,
          message: 'Script executed successfully',
          data: result.rows,
          execution_time_ms: Date.now() - startTime,
        } as DevScriptResponse),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (sqlError: any) {
      return new Response(
        JSON.stringify({
          success: false,
          type,
          error: sqlError.message || 'SQL execution failed',
          execution_time_ms: Date.now() - startTime,
        } as DevScriptResponse),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } finally {
      await client.end();
    }
  } catch (error: any) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Internal server error",
        execution_time_ms: Date.now() - startTime,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
