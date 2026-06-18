import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const password = await bcrypt.hash("password123", 10);

  const organizer = await prisma.user.upsert({
  where: { email: "organizer@certfire.com" },
  update: {},
  create: {
    name: "Org Admin",
    email: "organizer@certfire.com",
    password,
    role: "ORGANIZER",
  },
});

  await prisma.fest.createMany({
    data: [
      { title: "Hacktrack", description: "Hackathon event", category: "Technical", organizerId: organizer.id, date: new Date("2026-09-15") },
      { title: "Code Zenia", description: "Coding competition", category: "Technical", organizerId: organizer.id, date: new Date("2026-09-15") },
      { title: "Syntaxia", description: "Coding precision challenge", category: "Technical", organizerId: organizer.id, date: new Date("2026-09-16") },
      { title: "Cultural Night", description: "Music and dance performances", category: "Cultural", organizerId: organizer.id, date: new Date("2026-09-17") },
    ],
  });

  console.log("Seeded successfully:", organizer.email);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());