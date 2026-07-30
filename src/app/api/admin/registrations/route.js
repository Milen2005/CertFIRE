import { NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase";

export async function GET(req) {
  try {
    const { data, error } = await supabase
      .from("registrations")
      .select(`
        *,
        profiles ( name, email ),
        fests ( title )
      `);
      
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const { registrationId, status } = await req.json();
    
    if (!registrationId || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    
    const { data, error } = await supabase
      .from("registrations")
      .update({ status: status.toUpperCase() })
      .eq("id", registrationId)
      .select()
      .single();
      
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    // Log action to audit_logs
    await supabase.from("audit_logs").insert([
      {
        action: "REGISTRATION_STATUS_UPDATE",
        details: `Registration ${registrationId} status set to ${status}`
      }
    ]);
    
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
