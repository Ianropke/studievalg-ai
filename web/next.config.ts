import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: {
    // @ts-ignore - Valid in Next.js 15+ runtime but types might be lagging
    appIsrStatus: false,
    // @ts-ignore
    buildActivity: false,
  },
};

export default nextConfig;
