import { NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase";

export async function GET(req, { params }) {
  try {
    const { id } = params;
    const { data, error } = await supabase
      .from("fests")
      .select("*")
      .eq("id", id)
      .single();
      
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req, { params }) {
  try {
    const { id } = params;
    const body = await req.json();
    
    const { data, error } = await supabase
      .from("fests")
      .update(body)
      .eq("id", id)
      .select()
      .single();
      
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
