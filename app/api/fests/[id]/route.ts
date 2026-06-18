import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

// GET single fest
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const fest = await prisma.fest.findUnique({ where: { id } });
  if (!fest) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(fest);
}

// PATCH update fest (only owning organizer or admin)
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const user = session?.user as any;
  const { id } = await params;

  const fest = await prisma.fest.findUnique({ where: { id } });
  if (!fest) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!user || (user.id !== fest.organizerId && user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const updated = await prisma.fest.update({
    where: { id },
    data: {
      title: body.title ?? fest.title,
      description: body.description ?? fest.description,
      date: body.date ? new Date(body.date) : fest.date,
      category: body.category ?? fest.category,
    },
  });

  return NextResponse.json(updated);
}