import { NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase";

export async function GET(req, { params }) {
  try {
    const { certId } = params;
    
    // Query registration table for this certificate ID
    const { data: registration, error } = await supabase
      .from("registrations")
      .select(`
        id,
        status,
        certificate_id,
        created_at,
        profiles ( name ),
        fests ( title )
      `)
      .eq("certificate_id", certId)
      .single();
      
    if (error || !registration) {
      return NextResponse.json({ error: "Certificate invalid or not found" }, { status: 404 });
    }
    
    if (registration.status === "REVOKED") {
      return NextResponse.json({ error: "Certificate has been revoked by the administrator" }, { status: 410 });
    }
    
    return NextResponse.json({
      participantName: registration.profiles?.name || "Participant",
      festTitle: registration.fests?.title || "Festival",
      issueDate: registration.created_at || new Date().toISOString()
    });
  } catch (err) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
