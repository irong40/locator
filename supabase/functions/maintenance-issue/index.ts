import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    console.log("Received issue report:", body.ticketNumber);

    const { error } = await supabase.from("maintenance_tickets").insert({
      ticket_number: body.ticketNumber,
      type: "issue",
      title: body.title,
      description: body.description,
      priority: body.priority,
      category: body.category,
      user_id: body.userId || null,
      user_email: body.userEmail,
      page_url: body.pageUrl,
      browser_info: body.browserInfo,
    });

    if (error) {
      console.error("Database insert error:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Issue saved successfully:", body.ticketNumber);
    return new Response(
      JSON.stringify({ success: true, ticketNumber: body.ticketNumber }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
