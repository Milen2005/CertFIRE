import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    
    let query = supabase.from("fests").select("*");
    
    if (search) {
      query = query.ilike("title", `%${search}%`);
    }
    
    if (category) {
      query = query.eq("category", category);
    }
    
    const { data, error } = await query;
    
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
    const { title, description, date, category, venue, capacity, image, isDraft, organiserId } = await req.json();
    
    if (!title || !description || !date || !category) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    
    const { data, error } = await supabase
      .from("fests")
      .insert([
        {
          title,
          description,
          date,
          category,
          venue: venue || "",
          capacity: capacity || 100,
          image: image || "",
          is_draft: !!isDraft,
          organiser_id: organiserId || null
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
