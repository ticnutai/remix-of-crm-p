import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { refresh_token, client_id } = await req.json();

    if (!refresh_token) {
      return new Response(
        JSON.stringify({ error: 'refresh_token is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get client secret from environment (if configured)
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
    
    // If no client secret, we can't refresh - return error
    if (!clientSecret) {
      console.log('GOOGLE_CLIENT_SECRET not configured - cannot refresh token');
      return new Response(
        JSON.stringify({ 
          error: 'Token refresh not available',
          message: 'Server not configured for token refresh. Please re-authenticate.',
          needs_reauth: true
        }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Call Google's token endpoint
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: client_id || Deno.env.get('GOOGLE_CLIENT_ID') || '',
        client_secret: clientSecret,
        refresh_token: refresh_token,
        grant_type: 'refresh_token',
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error('Google token refresh failed:', tokenData);
      return new Response(
        JSON.stringify({ 
          error: 'Token refresh failed',
          details: tokenData.error_description || tokenData.error,
          needs_reauth: tokenData.error === 'invalid_grant'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Token refreshed successfully');

    return new Response(
      JSON.stringify({
        access_token: tokenData.access_token,
        expires_in: tokenData.expires_in,
        token_type: tokenData.token_type,
        scope: tokenData.scope,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error refreshing token:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
