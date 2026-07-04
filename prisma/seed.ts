import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.DEMO_USER_EMAIL ?? "demo@taskcanvas.dev";
  const password = process.env.DEMO_USER_PASSWORD ?? "Demo1234!";
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash },
    create: { email, name: "Demo User", passwordHash },
  });

  console.log(`Seeded demo user: ${user.email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
