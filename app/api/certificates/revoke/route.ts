import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  const user = session?.user as any;

  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { certId } = await req.json();

  if (!certId) {
    return NextResponse.json({ error: "certId is required" }, { status: 400 });
  }

  const certificate = await prisma.certificate.findUnique({
    where: { id: certId },
  });

  if (!certificate) {
    return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
  }

  await prisma.certificate.update({
    where: { id: certId },
    data: { revoked: true },
  });

  // Log the action
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "REVOKE_CERTIFICATE",
      details: `Revoked certificate ${certId}`,
    },
  });

  return NextResponse.json({ message: "Certificate revoked successfully" });
}