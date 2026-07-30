import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    
    if (!userId) {
      return NextResponse.json({ error: "Missing user ID" }, { status: 400 });
    }
    
    const { data, error } = await supabase
      .from("registrations")
      .select(`
        *,
        fests ( * )
      `)
      .eq("user_id", userId);
      
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { userId, festId } = await req.json();
    
    if (!userId || !festId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    
    // Fetch profile details to denormalize name and email
    const { data: profile } = await supabase
      .from("profiles")
      .select("name, email")
      .eq("id", userId)
      .single();
    
    const { data, error } = await supabase
      .from("registrations")
      .insert([
        {
          user_id: userId,
          fest_id: festId,
          status: "PENDING",
          cert_issued: false,
          participant_name: profile?.name || "",
          participant_email: profile?.email || ""
        }
      ])
      .select()
      .single();
      
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
