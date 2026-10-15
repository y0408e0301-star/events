// Prisma Client を 1 つだけ作って使い回す。
// 開発中はホットリロードのたびに接続が増えないよう、globalThis に保持する
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@/generated/prisma/client";
import { withPoolDefaults } from "@/lib/db-url";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL が設定されていません（.env.example を参照）");
  }
  return new PrismaClient({ adapter: new PrismaMariaDb(withPoolDefaults(url)) });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
