import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ certId: string }> }
) {
  const { certId } = await params;

  const certificate = await prisma.certificate.findUnique({
    where: { id: certId },
    include: {
      registration: {
        include: {
          user: { select: { name: true, email: true } },
          fest: { select: { title: true, date: true } },
        },
      },
    },
  });

  if (!certificate) {
    return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
  }

  if (certificate.revoked) {
    return NextResponse.json({ error: "Certificate has been revoked" }, { status: 410 });
  }

  return NextResponse.json({
    valid: true,
    certId: certificate.id,
    participantName: certificate.registration.user.name,
    festName: certificate.registration.fest.title,
    festDate: certificate.registration.fest.date,
    issuedAt: certificate.issuedAt,
    certUrl: certificate.certUrl,
  });
}