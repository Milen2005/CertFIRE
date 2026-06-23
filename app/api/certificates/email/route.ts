import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendCertificateEmail } from "@/lib/sendEmail";

export async function POST(req: Request) {
  const session = await auth();
  const user = session?.user as any;

  if (!user || (user.role !== "ORGANIZER" && user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { festId } = await req.json();

  if (!festId) {
    return NextResponse.json({ error: "festId is required" }, { status: 400 });
  }

  const registrations = await prisma.registration.findMany({
    where: { festId, status: "APPROVED" },
    include: {
      user: true,
      fest: true,
      certificate: true,
    },
  });

  const results = [];

  for (const reg of registrations) {
    if (!reg.certificate || !reg.certificate.certUrl) {
      results.push({ email: reg.user.email, status: "no certificate" });
      continue;
    }

    try {
      await sendCertificateEmail({
        toEmail: reg.user.email,
        toName: reg.user.name,
        festName: reg.fest.title,
        certUrl: reg.certificate.certUrl,
        certId: reg.certificate.id,
      });

      // Log the action
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: "SEND_CERTIFICATE_EMAIL",
          details: `Sent certificate email to ${reg.user.email} for fest ${reg.fest.title}`,
        },
      });

      results.push({ email: reg.user.email, status: "sent" });
    } catch (err) {
      results.push({ email: reg.user.email, status: "failed" });
    }
  }

  return NextResponse.json({ processed: results.length, results });
}