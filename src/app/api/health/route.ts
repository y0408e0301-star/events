import { connection } from "next/server";
import { prisma } from "@/lib/prisma";

// サーバーと DB が動いているかの確認（要件定義書 6. API）
export async function GET() {
  // ビルド時の事前描画で DB に接続しないよう、リクエストが来てから実行する
  await connection();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({ status: "ok" });
  } catch (error) {
    console.error("DB への接続確認に失敗しました", error);
    return Response.json(
      { status: "error", message: "データベースに接続できません" },
      { status: 503 },
    );
  }
}
