import type { NextConfig } from "next";

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).host
  : "supabase.co";

/**
 * Content Security Policy. The frame-ancestors and script-src rules are the
 * ones we care about most: Razorpay's Checkout.js is served from
 * checkout.razorpay.com and needs a frame + script allowance; map tiles come
 * from carto and openstreetmap; the Supabase host is whitelisted for images
 * and websocket / REST calls.
 *
 * `unsafe-inline` on styles is required by Next.js (styled-jsx) and Tailwind
 * JIT for now. Inline scripts are hashed by Next automatically; we allow
 * 'unsafe-inline' for scripts too because Next 16 still injects a boot
 * script inline for hydration. This is a conservative default; tighten with
 * a nonce once the boot script supports it in your Next version.
 */
const csp = [
  "default-src 'self'",
  `img-src 'self' data: blob: https://${supabaseHost} https://*.tile.openstreetmap.org https://*.basemaps.cartocdn.com`,
  `connect-src 'self' https://${supabaseHost} wss://${supabaseHost} https://api.razorpay.com https://challenges.cloudflare.com https://*.ingest.sentry.io https://*.i.posthog.com`,
  "font-src 'self' data: https://fonts.gstatic.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "script-src 'self' 'unsafe-inline' https://checkout.razorpay.com https://challenges.cloudflare.com",
  "frame-src https://checkout.razorpay.com https://api.razorpay.com https://challenges.cloudflare.com",
  "frame-ancestors 'none'",
  "form-action 'self' https://checkout.razorpay.com",
  "base-uri 'self'",
  "object-src 'none'",
].join("; ");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/**" },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value:
              "camera=(self), geolocation=(self), microphone=(), payment=(self), interest-cohort=()",
          },
          { key: "X-DNS-Prefetch-Control", value: "on" },
        ],
      },
    ];
  },
};

export default nextConfig;
