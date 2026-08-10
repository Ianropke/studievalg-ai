import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { webpack }) => {
    // The education catalogue is intentionally served from /public at runtime,
    // but the current client pages still import it as JSON. Next.js does not
    // resolve imports from public consistently during production builds.
    // Replace any import of this specific catalogue with the real file so the
    // existing application code remains unchanged.
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(
        /all_programs_catalog\.json$/,
        path.resolve(__dirname, "public/data/all_programs_catalog.json")
      )
    );

    return config;
  },
};

export default nextConfig;
