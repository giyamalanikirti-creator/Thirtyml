import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://thirtyml.in";
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/account", "/bookings", "/cart", "/checkout", "/orders", "/partner", "/admin", "/api"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
