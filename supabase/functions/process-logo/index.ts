import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { image_base64, layer, color } = await req.json();

    if (!image_base64) {
      return new Response(JSON.stringify({ error: "image_base64 is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Define prompts for each layer type
    const layerPrompts: Record<string, string> = {
      lines: `Edit this architectural logo image. Keep ONLY the building outlines, skyline lines, and structural lines. Remove the small window squares from the tall building. Remove ALL text completely. Color the remaining lines/outlines in ${color || "#000000"}. Make everything else completely transparent with a clean transparent background.`,
      windows: `Edit this architectural logo image. Keep ONLY the small square/rectangular window shapes inside the tall building. Remove all building outlines, skyline lines, and text. Color the remaining window squares in ${color || "#000000"}. Make everything else completely transparent with a clean transparent background.`,
      text: `Edit this architectural logo image. Keep ONLY the text "MALI TENENBAUM" and "Architecture & Design" (or any text present). Remove all building graphics, lines, and shapes completely. Color the remaining text in ${color || "#000000"}. Make everything else completely transparent with a clean transparent background.`,
      all: `Edit this architectural logo image. Remove the white/light background completely, making it transparent. Keep all elements (lines, buildings, windows, text) but color them all in ${color || "#000000"}. The result should have a transparent background with all logo elements visible in the specified color.`,
    };

    const prompt = layerPrompts[layer] || layerPrompts.all;

    // Ensure the image URL has the proper data URI prefix
    const imageUrl = image_base64.startsWith("data:") 
      ? image_base64 
      : `data:image/png;base64,${image_base64}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: { url: imageUrl },
              },
            ],
          },
        ],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please wait a moment and try again." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: `AI processing failed: ${response.status}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const resultImage = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    const resultText = data.choices?.[0]?.message?.content || "";

    if (!resultImage) {
      return new Response(JSON.stringify({ 
        error: "AI did not return an image", 
        debug: resultText 
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      image: resultImage,
      layer,
      color,
      message: resultText,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("process-logo error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
