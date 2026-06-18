import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

// GET all fests (with optional category filter & search)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const search = searchParams.get("search");

  const fests = await prisma.fest.findMany({
    where: {
      ...(category ? { category } : {}),
      ...(search ? { title: { contains: search, mode: "insensitive" } } : {}),
    },
    orderBy: { date: "asc" },
  });

  return NextResponse.json(fests);
}

// POST create a new fest (organizer/admin only)
export async function POST(req: Request) {
  const session = await auth();
  const user = session?.user as any;
  
  const body = await req.json();
  const { title, description, date, category, organizerId } = body;

  let finalOrganizerId = user?.id;

  // Development Fallback Bypass for Postman Testing
  if (!user || (user.role !== "ORGANIZER" && user.role !== "ADMIN")) {
    if (process.env.NODE_ENV === "development" && organizerId) {
      finalOrganizerId = organizerId;
    } else {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  if (!finalOrganizerId) {
    return NextResponse.json({ error: "Organizer ID is required" }, { status: 400 });
  }

  const fest = await prisma.fest.create({
    data: {
      title,
      description,
      date: date ? new Date(date) : null,
      category,
      organizerId: finalOrganizerId,
    },
  });

  return NextResponse.json(fest, { status: 201 });
}