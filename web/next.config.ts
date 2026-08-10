import path from "node:path";
import type { NextConfig } from "next";

const cataloguePath = path.resolve(process.cwd(), "public/data/all_programs_catalog.json");

const nextConfig: NextConfig = {
  webpack: (config, { webpack }) => {
    // The catalogue is a static public asset at runtime, but legacy client
    // code imports it as JSON. Resolve both the @public alias and relative
    // catalogue requests to the real file during the webpack build.
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      "@public": path.resolve(process.cwd(), "public"),
    };

    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(
        /all_programs_catalog\.json$/,
        cataloguePath
      )
    );

    return config;
  },
};

export default nextConfig;
