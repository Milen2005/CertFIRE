import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { supabase } from "@/lib/supabase";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  const user = session?.user as any;

  if (!user || (user.role !== "ORGANIZER" && user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File;
  const festId = formData.get("festId") as string;
  const name = formData.get("name") as string;

  if (!file || !festId || !name) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const fileName = `${festId}/${Date.now()}_${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from("templates")
    .upload(fileName, buffer, { contentType: file.type });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: urlData } = supabase.storage
    .from("templates")
    .getPublicUrl(fileName);

  const template = await prisma.template.create({
    data: {
      festId,
      name,
      fileUrl: urlData.publicUrl,
    },
  });

  return NextResponse.json(template, { status: 201 });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const festId = searchParams.get("festId");

  const templates = await prisma.template.findMany({
    where: festId ? { festId } : {},
  });

  return NextResponse.json(templates);
}