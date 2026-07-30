import { NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase";

export async function POST(req) {
  try {
    const { certId } = await req.json();
    
    if (!certId) {
      return NextResponse.json({ error: "Missing certificate ID" }, { status: 400 });
    }
    
    // Revoke registration/certificate
    const { data, error } = await supabase
      .from("registrations")
      .update({ status: "REVOKED" })
      .eq("certificate_id", certId)
      .select()
      .single();
      
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    // Log action to audit_logs
    await supabase.from("audit_logs").insert([
      {
        action: "CERTIFICATE_REVOCATION",
        details: `Certificate ID ${certId} status set to REVOKED`
      }
    ]);
    
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
