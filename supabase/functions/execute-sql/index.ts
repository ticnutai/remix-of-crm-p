import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Execution modes
type ExecutionMode = 'execute' | 'dry_run' | 'explain' | 'validate';

interface ExecuteRequest {
  sql: string;
  migration_name?: string;
  mode?: ExecutionMode;
}

interface ExecuteResponse {
  success: boolean;
  message?: string;
  error?: string;
  error_code?: string;
  error_position?: number;
  error_hint?: string;
  migration_name?: string | null;
  rows_affected?: number;
  data?: any[];
  execution_time_ms?: number;
  mode?: ExecutionMode;
  dry_run?: boolean;
  explain_plan?: any;
  warnings?: string[];
  affected_tables?: string[];
  statement_count?: number;
}

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

    const userId = user.id;

    // Check if user is admin using RPC
    const { data: isAdmin, error: roleError } = await userClient.rpc("is_admin", {
      _user_id: userId,
    });

    if (roleError || !isAdmin) {
      return new Response(
        JSON.stringify({ success: false, error: "Forbidden - Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const { sql, migration_name, mode = 'execute' }: ExecuteRequest = await req.json();

    if (!sql || typeof sql !== "string") {
      return new Response(
        JSON.stringify({ success: false, error: "SQL query is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create admin client with service role key
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Get database URL
    const dbUrl = Deno.env.get("SUPABASE_DB_URL");
    
    if (!dbUrl) {
      return new Response(
        JSON.stringify({ success: false, error: "Database URL not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use postgres connection to execute raw SQL
    const { Client } = await import("https://deno.land/x/postgres@v0.17.0/mod.ts");
    
    const client = new Client(dbUrl);
    await client.connect();

    const warnings: string[] = [];
    let affectedTables: string[] = [];

    try {
      // Extract affected tables from SQL
      const tableMatches = sql.match(/(?:FROM|INTO|UPDATE|TABLE|ON)\s+(?:public\.)?(\w+)/gi) || [];
      affectedTables = [...new Set(tableMatches.map(m => {
        const parts = m.split(/\s+/);
        return parts[parts.length - 1].replace('public.', '').toLowerCase();
      }))].filter(t => !['table', 'from', 'into', 'update', 'on'].includes(t));

      // Count statements (approximate)
      const statementCount = (sql.match(/;/g) || []).length || 1;

      // Handle different execution modes
      if (mode === 'validate') {
        // Syntax validation only - use EXPLAIN with no execution
        try {
          // Try to parse SQL syntax using EXPLAIN
          await client.queryArray(`EXPLAIN ${sql.split(';')[0]}`);
          
          const executionTime = Date.now() - startTime;
          
          return new Response(
            JSON.stringify({
              success: true,
              message: "SQL syntax is valid",
              mode: 'validate',
              execution_time_ms: executionTime,
              statement_count: statementCount,
              affected_tables: affectedTables,
            } as ExecuteResponse),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        } catch (syntaxError: any) {
          return new Response(
            JSON.stringify({
              success: false,
              error: syntaxError.message || "Syntax error in SQL",
              mode: 'validate',
              execution_time_ms: Date.now() - startTime,
            } as ExecuteResponse),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      if (mode === 'explain') {
        // Return execution plan
        try {
          const explainResult = await client.queryObject(`EXPLAIN (ANALYZE false, FORMAT JSON) ${sql.split(';')[0]}`);
          
          const executionTime = Date.now() - startTime;
          
          return new Response(
            JSON.stringify({
              success: true,
              message: "Execution plan generated",
              mode: 'explain',
              explain_plan: explainResult.rows,
              execution_time_ms: executionTime,
              statement_count: statementCount,
              affected_tables: affectedTables,
            } as ExecuteResponse),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        } catch (explainError: any) {
          return new Response(
            JSON.stringify({
              success: false,
              error: explainError.message || "Could not generate execution plan",
              mode: 'explain',
              execution_time_ms: Date.now() - startTime,
            } as ExecuteResponse),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      if (mode === 'dry_run') {
        // Dry run - execute within a transaction then rollback
        await client.queryArray("BEGIN");
        
        try {
          const result = await client.queryObject(sql);
          
          // Rollback to undo changes
          await client.queryArray("ROLLBACK");
          
          const executionTime = Date.now() - startTime;
          
          // Log dry run
          if (migration_name) {
            await adminClient
              .from("migration_logs")
              .insert({
                name: `[DRY RUN] ${migration_name}`,
                sql_content: sql,
                executed_at: new Date().toISOString(),
                success: true,
                executed_by: userId,
                mode: 'dry_run',
                execution_time_ms: executionTime,
                metadata: { affected_tables: affectedTables, statement_count: statementCount },
              });
          }

          return new Response(
            JSON.stringify({
              success: true,
              message: "Dry run completed - no changes were made",
              mode: 'dry_run',
              dry_run: true,
              rows_affected: result.rowCount || 0,
              data: result.rows || [],
              execution_time_ms: executionTime,
              statement_count: statementCount,
              affected_tables: affectedTables,
              warnings: ["Changes were NOT saved - this was a dry run"],
            } as ExecuteResponse),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        } catch (dryRunError: any) {
          // Make sure to rollback on error too
          try {
            await client.queryArray("ROLLBACK");
          } catch (_) {}
          
          const executionTime = Date.now() - startTime;
          
          // Parse error details
          const errorResponse = parsePostgresError(dryRunError);
          
          return new Response(
            JSON.stringify({
              success: false,
              error: errorResponse.message,
              error_code: errorResponse.code,
              error_position: errorResponse.position,
              error_hint: errorResponse.hint,
              mode: 'dry_run',
              execution_time_ms: executionTime,
            } as ExecuteResponse),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      // Normal execution mode
      const result = await client.queryObject(sql);
      
      const executionTime = Date.now() - startTime;

      // Log successful migration if name provided
      if (migration_name) {
        await adminClient
          .from("migration_logs")
          .insert({
            name: migration_name,
            sql_content: sql,
            executed_at: new Date().toISOString(),
            success: true,
            executed_by: userId,
            mode: 'execute',
            execution_time_ms: executionTime,
            status: 'completed',
            metadata: { affected_tables: affectedTables, statement_count: statementCount },
          });
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "SQL executed successfully",
          mode: 'execute',
          migration_name: migration_name || null,
          rows_affected: result.rowCount || 0,
          data: result.rows || [],
          execution_time_ms: executionTime,
          statement_count: statementCount,
          affected_tables: affectedTables,
          warnings,
        } as ExecuteResponse),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (sqlError: any) {
      const executionTime = Date.now() - startTime;
      
      // Parse error details
      const errorResponse = parsePostgresError(sqlError);

      // Log failed migration if name provided
      if (migration_name) {
        await adminClient
          .from("migration_logs")
          .insert({
            name: migration_name,
            sql_content: sql,
            executed_at: new Date().toISOString(),
            success: false,
            error: errorResponse.message,
            executed_by: userId,
            mode: mode,
            execution_time_ms: executionTime,
            status: 'failed',
            metadata: { 
              error_code: errorResponse.code,
              error_position: errorResponse.position,
              affected_tables: affectedTables,
            },
          });
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: errorResponse.message,
          error_code: errorResponse.code,
          error_position: errorResponse.position,
          error_hint: errorResponse.hint,
          mode: mode,
          migration_name: migration_name || null,
          execution_time_ms: executionTime,
        } as ExecuteResponse),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } finally {
      await client.end();
    }
  } catch (error: any) {
    const errorMessage = error.message || "Internal server error";
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage,
        execution_time_ms: Date.now() - startTime,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Parse PostgreSQL error to extract useful information
function parsePostgresError(error: any): { message: string; code?: string; position?: number; hint?: string } {
  const message = error.message || String(error);
  
  // Extract error code (e.g., 42P01)
  const codeMatch = message.match(/(?:ERROR|error):\s*(\d{5})/);
  const code = codeMatch?.[1];
  
  // Extract position
  const positionMatch = message.match(/(?:position|Position)\s*[:"]\s*(\d+)/i);
  const position = positionMatch ? parseInt(positionMatch[1], 10) : undefined;
  
  // Generate hint based on error code
  let hint: string | undefined;
  
  if (code === '42P01') {
    hint = 'הטבלה לא קיימת - בדוק את שם הטבלה';
  } else if (code === '42P07') {
    hint = 'השתמש ב-IF NOT EXISTS כדי למנוע שגיאה זו';
  } else if (code === '42701') {
    hint = 'העמודה כבר קיימת - השתמש ב-IF NOT EXISTS';
  } else if (code === '42601') {
    hint = 'בדוק את תחביר ה-SQL';
  } else if (code === '23505') {
    hint = 'ערך כפול - בדוק אילוצי ייחודיות';
  } else if (code === '23503') {
    hint = 'הפרת מפתח זר - בדוק קשרים בין טבלאות';
  }
  
  return { message, code, position, hint };
}
