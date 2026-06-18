import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function POST(request: Request) {
  try {
    const session = await auth();

    const body = await request.json();
    const { userId, festId } = body;

    if (!session && process.env.NODE_ENV !== "development") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!userId || !festId) {
      return NextResponse.json({ error: "User ID and Fest ID are required" }, { status: 400 });
    }

    const registration = await prisma.registration.create({
      data: {
        userId,
        festId,
        status: "PENDING",
      },
    });

    return NextResponse.json(registration, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Registration mapping failed" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await auth();
    const user = session?.user as any;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const registrations = await prisma.registration.findMany({
      where: { userId: user.id },
      include: { fest: true, certificate: true },
    });

    return NextResponse.json(registrations);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch registrations" }, { status: 500 });
  }
}