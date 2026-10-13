import { afterAll, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";

beforeEach(async () => {
  await prisma.$executeRaw`TRUNCATE TABLE events`;
});

afterAll(async () => {
  await prisma.$disconnect();
});
