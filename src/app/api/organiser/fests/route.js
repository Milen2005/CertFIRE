import { NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const organiserId = searchParams.get("organiserId");
    
    if (!organiserId) {
      return NextResponse.json({ error: "Missing organiser ID" }, { status: 400 });
    }
    
    // Fetch organizer fests
    const { data: fests, error } = await supabase
      .from("fests")
      .select("*")
      .eq("organiser_id", organiserId);
      
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    // For each fest, fetch the registration count
    const festsWithCount = await Promise.all(
      fests.map(async (fest) => {
        const { count, error: countError } = await supabase
          .from("registrations")
          .select("*", { count: "exact", head: true })
          .eq("fest_id", fest.id);
          
        return {
          ...fest,
          registrationCount: count || 0
        };
      })
    );
    
    return NextResponse.json(festsWithCount);
  } catch (err) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
