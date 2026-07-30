import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const email = searchParams.get("email");
    
    if (!userId && !email) {
      return NextResponse.json({ error: "Missing user ID or email" }, { status: 400 });
    }
    
    let query = supabase.from("profiles").select("id, name, email, role, created_at");
    
    if (userId) {
      query = query.eq("id", userId);
    } else {
      query = query.eq("email", email.toLowerCase().trim());
    }
    
    const { data: profile, error } = await query.single();
      
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    
    return NextResponse.json(profile);
  } catch (err) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const { userId, name, email } = await req.json();
    
    if (!userId) {
      return NextResponse.json({ error: "Missing user ID" }, { status: 400 });
    }
    
    const updates = {};
    if (name) updates.name = name.trim();
    if (email) updates.email = email.toLowerCase().trim();
    
    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", userId)
      .select("id, name, email, role, created_at")
      .single();
      
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
