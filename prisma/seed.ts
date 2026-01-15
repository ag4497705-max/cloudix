/**
 * Run with: DATABASE_URL set and `npx ts-node prisma/seed.ts`
 * This script creates or updates the lifetime user requested:
 * nood2proinbloxfruit@gmail.com => isLifetime=true, isPro=true
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = "nood2proinbloxfruit@gmail.com";
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      isLifetime: true,
      isPro: true,
      credits: 999999,
    },
    create: {
      email,
      isLifetime: true,
      isPro: true,
      credits: 999999,
    },
  });
  console.log("Seeded lifetime user:", user.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
