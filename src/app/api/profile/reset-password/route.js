import { NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase";
import bcrypt from "bcryptjs";

export async function POST(req) {
  try {
    const { userId, currentPassword, newPassword } = await req.json();
    
    if (!userId || !currentPassword || !newPassword) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    
    // Fetch profile
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
      
    if (error || !profile) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 });
    }
    
    // Check password
    const isValid = await bcrypt.compare(currentPassword, profile.password);
    if (!isValid) {
      return NextResponse.json({ error: "Incorrect current password" }, { status: 400 });
    }
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update password
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ password: hashedPassword })
      .eq("id", userId);
      
    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }
    
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
