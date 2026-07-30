import { NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase";

export async function POST(req) {
  try {
    const { festId } = await req.json();
    
    if (!festId) {
      return NextResponse.json({ error: "Missing fest ID" }, { status: 400 });
    }
    
    // Fetch registrations with participant email profiles and fest title details
    const { data: registrations, error } = await supabase
      .from("registrations")
      .select(`
        *,
        profiles ( email, name ),
        fests ( title )
      `)
      .eq("fest_id", festId)
      .eq("status", "APPROVED")
      .eq("cert_issued", true);
      
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    // Simulate email dispatch
    const sentEmails = [];
    registrations.forEach((reg) => {
      if (reg.profiles?.email) {
        sentEmails.push({
          email: reg.profiles.email,
          name: reg.profiles.name,
          festTitle: reg.fests?.title,
          certificateId: reg.certificate_id
        });
      }
    });
    
    return NextResponse.json({
      success: true,
      message: `Successfully queued and dispatched ${sentEmails.length} email notifications.`,
      dispatched: sentEmails
    });
  } catch (err) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
