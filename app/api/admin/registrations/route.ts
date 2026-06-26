import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET: all registrations (admin only)
export async function GET() {
  const session = await auth();
  const user = session?.user as any;

  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const registrations = await prisma.registration.findMany({
    include: {
      user: { select: { name: true, email: true } },
      fest: { select: { title: true } },
      certificate: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(registrations);
}

// PATCH: approve or deny a registration
export async function PATCH(req: Request) {
  const session = await auth();
  const user = session?.user as any;

  if (!user || (user.role !== "ADMIN" && user.role !== "ORGANIZER")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { registrationId, status } = await req.json();

  if (!registrationId || !status) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  if (!["APPROVED", "DENIED", "PENDING"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const updated = await prisma.registration.update({
    where: { id: registrationId },
    data: { status },
  });

  // Log the action
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: `REGISTRATION_${status}`,
      details: `Registration ${registrationId} marked as ${status}`,
    },
  });

  return NextResponse.json(updated);
}