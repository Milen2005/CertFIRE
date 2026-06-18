import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  const user = session?.user as any;

  if (!user || (user.role !== "ORGANIZER" && user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const fests = await prisma.fest.findMany({
    where: user.role === "ADMIN" ? {} : { organizerId: user.id },
    include: {
      _count: { select: { registrations: true } },
    },
  });

  return NextResponse.json(fests);
}