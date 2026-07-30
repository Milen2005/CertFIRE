import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";
import * as XLSX from "xlsx";
import bcrypt from "bcryptjs";

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const festId = formData.get("festId");
    
    if (!file || !festId) {
      return NextResponse.json({ error: "Missing file or fest ID" }, { status: 400 });
    }
    
    const fileBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(fileBuffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    
    const defaultPassword = "Password123!";
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(defaultPassword, salt);
    
    const results = [];
    
    for (const row of jsonData) {
      const name = row.Name || row.name || row["Full Name"] || "";
      const email = row.Email || row.email || "";
      const phone = row.Phone || row.phone || row["Phone Number"] || "";
      
      if (!email) continue;
      
      const emailLower = email.toLowerCase().trim();
      
      // 1. Check if user already exists in profiles
      let { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", emailLower)
        .single();
        
      if (!profile) {
        // Create a new participant profile
        const { data: newProfile, error: createError } = await supabase
          .from("profiles")
          .insert([
            {
              name: name || emailLower.split("@")[0],
              email: emailLower,
              password: hashedPassword,
              role: "PARTICIPANT"
            }
          ])
          .select("id")
          .single();
          
        if (createError) {
          console.error("Bulk create profile error:", createError);
          continue;
        }
        profile = newProfile;
      }
      
      // 2. Register for fest
      const { data: reg, error: regError } = await supabase
        .from("registrations")
        .insert([
          {
            user_id: profile.id,
            fest_id: festId,
            status: "APPROVED", // Organizer bulk-uploaded participants are approved
            cert_issued: false,
            participant_name: name || "",
            participant_email: emailLower || ""
          }
        ])
        .select()
        .single();
        
      if (regError) {
        console.error("Bulk register error:", regError);
        continue;
      }
      
      results.push(reg);
    }
    
    return NextResponse.json({ success: true, count: results.length });
  } catch (err) {
    console.error("Bulk register error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
