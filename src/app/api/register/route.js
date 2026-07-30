import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";
import bcrypt from "bcryptjs";

export async function POST(req) {
  try {
    const { name, email, password, role } = await req.json();
    
    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    
    const emailLower = email.toLowerCase().trim();
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Insert profile
    const { data, error } = await supabase
      .from("profiles")
      .insert([
        {
          name: name.trim(),
          email: emailLower,
          password: hashedPassword,
          role: role.toUpperCase() // 'PARTICIPANT' or 'ORGANIZER'
        }
      ])
      .select()
      .single();
      
    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    return NextResponse.json({ success: true, user: { id: data.id, name: data.name, email: data.email, role: data.role } }, { status: 201 });
  } catch (err) {
    console.error("Registration error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
