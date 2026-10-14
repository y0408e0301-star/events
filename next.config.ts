import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // 公開環境（EC2）では、動かすのに必要なファイルだけを .next/standalone にまとめて送る（deploy/deploy.sh）
  output: "standalone",
};

export default nextConfig;
