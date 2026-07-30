import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const festId = searchParams.get("festId");
    
    if (!festId) {
      return NextResponse.json({ error: "Missing fest ID" }, { status: 400 });
    }
    
    const { data, error } = await supabase
      .from("templates")
      .select("*")
      .eq("fest_id", festId);
      
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
    const formData = await req.formData();
    const file = formData.get("file");
    const festId = formData.get("festId");
    const name = formData.get("name") || "default_template";
    
    if (!file || !festId) {
      return NextResponse.json({ error: "Missing file or fest ID" }, { status: 400 });
    }
    
    // Upload file to Supabase Storage bucket 'templates'
    const fileExt = file.name ? file.name.split(".").pop() : "png";
    const fileName = `${festId}_${Date.now()}.${fileExt}`;
    const fileBuffer = await file.arrayBuffer();
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("templates")
      .upload(fileName, fileBuffer, {
        contentType: file.type || "image/png",
        cacheControl: "3600"
      });
      
    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 400 });
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from("templates")
      .getPublicUrl(fileName);
      
    // Insert record in templates table
    const { data: templateRecord, error: dbError } = await supabase
      .from("templates")
      .insert([
        {
          fest_id: festId,
          name,
          url: publicUrl
        }
      ])
      .select()
      .single();
      
    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 400 });
    }
    
    return NextResponse.json(templateRecord, { status: 201 });
  } catch (err) {
    console.error("Template upload error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
