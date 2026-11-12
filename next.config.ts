import type { NextConfig } from "next";

// GITHUB_PAGES=true switches to a fully static export served from a sub-path.
// On a Node host (Vercel) the site runs normally, with the proxy and API route.
const pages = process.env.GITHUB_PAGES === "true";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const common: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
};

const nextConfig: NextConfig = pages
  ? {
      ...common,
      output: "export",
      basePath,
      images: { unoptimized: true },
    }
  : {
      ...common,
      async headers() {
        return [
          {
            source: "/models/:path*",
            headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
          },
          {
            source: "/:path*",
            headers: [
              { key: "X-Content-Type-Options", value: "nosniff" },
              { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
              { key: "X-Frame-Options", value: "SAMEORIGIN" },
            ],
          },
        ];
      },
    };

export default nextConfig;
