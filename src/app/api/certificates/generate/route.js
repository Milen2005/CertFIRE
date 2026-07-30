import { NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase";

export async function POST(req) {
  try {
    const { festId, templateUrl } = await req.json();
    
    if (!festId) {
      return NextResponse.json({ error: "Missing fest ID" }, { status: 400 });
    }
    
    // Fetch all approved registrations for this fest that don't have certificates issued yet
    const { data: registrations, error: fetchError } = await supabase
      .from("registrations")
      .select("*")
      .eq("fest_id", festId)
      .eq("status", "APPROVED")
      .eq("cert_issued", false);
      
    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 400 });
    }
    
    const results = [];
    
    for (const reg of registrations) {
      // Generate a unique certificate ID
      const certId = `CERT-${festId.substring(0, 4).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      
      const { data: updated, error: updateError } = await supabase
        .from("registrations")
        .update({
          cert_issued: true,
          certificate_id: certId,
          template_url: templateUrl || ""
        })
        .eq("id", reg.id)
        .select()
        .single();
        
      if (updateError) {
        console.error("Generate cert update error:", updateError);
        continue;
      }
      results.push(updated);
    }
    
    return NextResponse.json({ success: true, count: results.length });
  } catch (err) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
