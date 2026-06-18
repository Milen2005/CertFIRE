import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { supabase } from "@/lib/supabase";
import { generateCertificate, generateCertId } from "@/lib/generateCertificate";

export async function POST(req: Request) {
  const session = await auth();
  const user = session?.user as any;

  if (!user || (user.role !== "ORGANIZER" && user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { festId, templateUrl } = await req.json();

  if (!festId) {
    return NextResponse.json({ error: "festId is required" }, { status: 400 });
  }

  // Get all approved registrations for this fest
  const registrations = await prisma.registration.findMany({
    where: { festId, status: "APPROVED" },
    include: { user: true, fest: true, certificate: true },
  });

  if (registrations.length === 0) {
    return NextResponse.json({ error: "No approved registrations found" }, { status: 404 });
  }

  const results = [];
  let processed = 0;

  for (const reg of registrations) {
    try {
      // Skip if certificate already exists
      if (reg.certificate) {
        results.push({ email: reg.user.email, status: "already exists" });
        continue;
      }

      const certId = generateCertId();

      // Generate PDF
      const pdfBuffer = await generateCertificate({
        participantName: reg.user.name,
        festName: reg.fest.title,
        certId,
        templateUrl,
      });

      // Upload to Supabase Storage
      const fileName = `${festId}/${certId}.pdf`;
      const { error: uploadError } = await supabase.storage
        .from("certificates")
        .upload(fileName, pdfBuffer, { contentType: "application/pdf" });

      if (uploadError) {
        results.push({ email: reg.user.email, status: "upload failed" });
        continue;
      }

      const { data: urlData } = supabase.storage
        .from("certificates")
        .getPublicUrl(fileName);

      // Save certificate to DB
      await prisma.certificate.create({
        data: {
          registrationId: reg.id,
          certUrl: urlData.publicUrl,
          qrCode: `${process.env.NEXT_PUBLIC_APP_URL}/verify/${certId}`,
          issuedAt: new Date(),
          id: certId,
        },
      });

      results.push({ email: reg.user.email, status: "generated", certUrl: urlData.publicUrl });
      processed++;
    } catch (err) {
      console.error(err);
      results.push({ email: reg.user.email, status: "failed" });
    }
  }

  return NextResponse.json({ total: registrations.length, processed, results });
}