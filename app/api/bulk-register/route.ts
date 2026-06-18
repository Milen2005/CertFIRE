import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { parseExcel } from "@/lib/parseExcel";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const session = await auth();
  const user = session?.user as any;

  if (!user || (user.role !== "ORGANIZER" && user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File;
  const festId = formData.get("festId") as string;

  if (!file || !festId) {
    return NextResponse.json({ error: "Missing file or festId" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const rows = parseExcel(buffer);

  const results = [];

  for (const row of rows) {
    const name = row["Name"] || row["name"];
    const email = row["Email"] || row["email"];

    if (!name || !email) continue;

    try {
      let participant = await prisma.user.findUnique({ where: { email } });

      if (!participant) {
        const password = await bcrypt.hash("certfire123", 10);
        participant = await prisma.user.create({
          data: { name, email, password, role: "PARTICIPANT" },
        });
      }

      const registration = await prisma.registration.upsert({
        where: { userId_festId: { userId: participant.id, festId } },
        update: {},
        create: { userId: participant.id, festId, status: "PENDING" },
      });

      results.push({ email, status: "registered", registrationId: registration.id });
    } catch (err) {
      results.push({ email, status: "failed" });
    }
  }

  return NextResponse.json({ processed: results.length, results });
}