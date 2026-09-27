import type { MetadataRoute } from "next";
import { getCities, listClubs, listEvents } from "@/lib/data/catalog";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://thirtyml.in";
  const cities = await getCities();
  const clubs = (
    await Promise.all(cities.map((c) => listClubs({ city: c.slug })))
  ).flat();
  const events = await listEvents();

  const staticPaths = [
    "",
    "/clubs",
    "/events",
    "/map",
    "/offers",
    "/for-clubs",
    "/help",
    "/about",
    "/contact",
    "/legal/terms",
    "/legal/privacy",
    "/legal/refunds",
    "/legal/cookies",
    "/legal/partner-terms",
    "/legal/grievance",
  ];

  return [
    ...staticPaths.map((path) => ({
      url: `${base}${path}`,
      changeFrequency: "weekly" as const,
      priority: path === "" ? 1 : 0.7,
    })),
    ...cities.map((c) => ({
      url: `${base}/${c.slug}`,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    ...clubs.map((c) => ({
      url: `${base}/${c.citySlug}/clubs/${c.slug}`,
      changeFrequency: "daily" as const,
      priority: 0.9,
    })),
    ...events.map((e) => ({
      url: `${base}/${e.citySlug}/events/${e.slug}`,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
  ];
}
