import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  // Caps static-generation build workers to 2, regardless of what the host
  // reports as available CPUs -- Render's Starter plan's actual RAM budget
  // doesn't support the worker count Next.js otherwise spawns (47, matching
  // the container's reported CPU count), causing an OOM-killed worker
  // during the 124-page static generation pass. That surfaced as an opaque,
  // message-less digest error on whatever page's render task was in flight
  // (consistently /contact, by position in the generation order -- not
  // because /contact itself was ever the actual problem).
  experimental: {
    workerThreads: false,
    cpus: 2,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
  async headers() {
    return [
      {
        // CORS for mobile app API endpoints
        source: "/api/app/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,POST,PATCH,DELETE,OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Authorization,Content-Type" },
        ],
      },
    ];
  },
};

export default withSentryConfig(withNextIntl(nextConfig), {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: true,
  widenClientFileUpload: true,
  disableLogger: true,
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
  },
});
