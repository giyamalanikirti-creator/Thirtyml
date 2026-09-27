import "server-only";

import { supabaseServer, isSupabaseConfigured } from "@/lib/supabase/server";
import type {
  City,
  ClubDetail,
  ClubFilters,
  ClubSummary,
  EventDetail,
  EventSummary,
  PriceBoardRow,
  ProductInfo,
} from "./types";
import {
  demoCities,
  demoClubs,
  demoClubDetail,
  demoEvents,
  demoEventDetail,
  demoPriceBoard,
} from "./demo";

/**
 * Server-side catalogue reads. Every function falls back to the demo
 * fixtures when Supabase isn't configured so the app runs with zero keys.
 * All queries run under RLS as the anonymous/current user.
 */

export function todayIst(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
  }).format(new Date());
}

export async function getCities(): Promise<City[]> {
  if (!isSupabaseConfigured()) return demoCities;
  const supabase = await supabaseServer();
  const { data } = await supabase
    .from("cities")
    .select("id, slug, name, state, lat, lng")
    .eq("is_active", true)
    .order("sort_order");
  if (!data || data.length === 0) return demoCities;
  return data;
}

export async function getPriceBoard(
  citySlug: string,
  date?: string
): Promise<PriceBoardRow[]> {
  if (!isSupabaseConfigured()) return demoPriceBoard(citySlug);
  const supabase = await supabaseServer();
  const { data, error } = await supabase.rpc("city_price_board", {
    p_city_slug: citySlug,
    p_date: date ?? todayIst(),
  });
  if (error || !data) return demoPriceBoard(citySlug);
  return data.map((r) => ({
    clubId: r.club_id,
    clubSlug: r.club_slug,
    clubName: r.club_name,
    areaName: r.area_name,
    lat: r.lat,
    lng: r.lng,
    minPrice: r.min_price,
    priceUpdatedAt: r.price_updated_at,
    isOpen: r.is_open,
  }));
}

export async function listClubs(filters: ClubFilters): Promise<ClubSummary[]> {
  if (!isSupabaseConfigured()) {
    let clubs = demoClubs.filter((c) => c.citySlug === filters.city);
    if (filters.q) {
      const q = filters.q.toLowerCase();
      clubs = clubs.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.areaName ?? "").toLowerCase().includes(q)
      );
    }
    if (filters.genre) {
      clubs = clubs.filter((c) =>
        c.genres.some((g) => g.toLowerCase() === filters.genre!.toLowerCase())
      );
    }
    if (filters.maxPrice) {
      clubs = clubs.filter((c) => (c.minPrice ?? 0) <= filters.maxPrice!);
    }
    if (filters.openTonight) clubs = clubs.filter((c) => c.openTonight);
    return sortClubs(clubs, filters.sort);
  }

  const supabase = await supabaseServer();
  let query = supabase
    .from("clubs")
    .select(
      `id, slug, name, min_age, is_claimed, lat, lng, avg_rating, rating_count,
       cities!inner(slug), areas(name), club_genres(genres(name))`
    )
    .eq("status", "approved")
    .eq("cities.slug", filters.city);
  if (filters.q) query = query.ilike("name", `%${filters.q}%`);
  const { data } = await query;
  if (!data) return [];

  const board = await getPriceBoard(filters.city);
  const byClub = new Map(board.map((b) => [b.clubId, b]));

  let clubs: ClubSummary[] = data.map((c) => {
    const b = byClub.get(c.id);
    return {
      id: c.id,
      slug: c.slug,
      name: c.name,
      citySlug: filters.city,
      areaName: c.areas?.name ?? null,
      avgRating: c.avg_rating === null ? null : Number(c.avg_rating),
      ratingCount: c.rating_count,
      minAge: c.min_age,
      isClaimed: c.is_claimed,
      lat: c.lat,
      lng: c.lng,
      genres: (c.club_genres ?? [])
        .map((g) => g.genres?.name)
        .filter((g): g is string => Boolean(g)),
      minPrice: b?.minPrice ?? null,
      priceUpdatedAt: b?.priceUpdatedAt ?? null,
      openTonight: b?.isOpen ?? true,
    };
  });

  if (filters.genre) {
    clubs = clubs.filter((c) =>
      c.genres.some((g) => g.toLowerCase() === filters.genre!.toLowerCase())
    );
  }
  if (filters.maxPrice) {
    clubs = clubs.filter((c) => (c.minPrice ?? 0) <= filters.maxPrice!);
  }
  if (filters.openTonight) clubs = clubs.filter((c) => c.openTonight);
  return sortClubs(clubs, filters.sort);
}

function sortClubs(
  clubs: ClubSummary[],
  sort: ClubFilters["sort"]
): ClubSummary[] {
  const sorted = [...clubs];
  switch (sort) {
    case "price_asc":
      sorted.sort((a, b) => (a.minPrice ?? 1e15) - (b.minPrice ?? 1e15));
      break;
    case "price_desc":
      sorted.sort((a, b) => (b.minPrice ?? -1) - (a.minPrice ?? -1));
      break;
    case "rating":
      sorted.sort((a, b) => (b.avgRating ?? 0) - (a.avgRating ?? 0));
      break;
    default:
      sorted.sort((a, b) => b.ratingCount - a.ratingCount);
  }
  return sorted;
}

export async function getClubDetail(
  citySlug: string,
  slug: string,
  date?: string
): Promise<ClubDetail | null> {
  if (!isSupabaseConfigured()) return demoClubDetail(citySlug, slug);
  const onDate = date ?? todayIst();
  const supabase = await supabaseServer();

  const { data: c } = await supabase
    .from("clubs")
    .select(
      `id, slug, name, description, address, website_url, instagram_url, phone,
       dress_code, house_rules, min_age, is_claimed, lat, lng, avg_rating,
       rating_count,
       cities!inner(slug), areas(name),
       club_genres(genres(name)), club_amenities(amenities(name)),
       club_hours(day_of_week, opens_at, closes_at, is_closed)`
    )
    .eq("status", "approved")
    .eq("cities.slug", citySlug)
    .eq("slug", slug)
    .maybeSingle();
  if (!c) return null;

  const [{ data: products }, { data: events }, { data: reviews }, { data: night }, { data: floorPlans }] =
    await Promise.all([
      supabase
        .from("products")
        .select(
          "id, type, name, description, max_per_order, min_age, cover_redeemable, sort_order"
        )
        .eq("club_id", c.id)
        .eq("type", "entry")
        .eq("is_active", true)
        .order("sort_order"),
      supabase
        .from("events")
        .select("id, slug, name, poster_path, starts_at")
        .eq("club_id", c.id)
        .eq("status", "published")
        .gte("starts_at", new Date().toISOString())
        .order("starts_at")
        .limit(6),
      supabase
        .from("reviews")
        .select("id, rating, body, created_at, review_replies(body)")
        .eq("club_id", c.id)
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("nights")
        .select("is_open")
        .eq("club_id", c.id)
        .eq("on_date", onDate)
        .maybeSingle(),
      supabase.from("floor_plans").select("id").eq("club_id", c.id).limit(1),
    ]);

  const productIds = (products ?? []).map((p) => p.id);
  const { data: prices } = productIds.length
    ? await supabase.rpc("catalog_prices", {
        p_product_ids: productIds,
        p_date: onDate,
      })
    : { data: [] as never[] };
  const priceMap = new Map(
    (prices ?? []).map((p) => [p.product_id, p])
  );

  // 7-day sparkline for the headline (first) entry product
  const { data: history } = productIds.length
    ? await supabase
        .from("price_history")
        .select("changed_at, new_price")
        .eq("product_id", productIds[0])
        .gte(
          "changed_at",
          new Date(Date.now() - 7 * 86400000).toISOString()
        )
        .order("changed_at")
    : { data: [] as never[] };

  const entryProducts: ProductInfo[] = (products ?? []).map((p) => {
    const live = priceMap.get(p.id);
    return {
      id: p.id,
      type: p.type as ProductInfo["type"],
      name: p.name,
      description: p.description,
      price: live?.price ?? 0,
      priceUpdatedAt: live?.price_updated_at ?? null,
      available: live?.available ?? 0,
      maxPerOrder: p.max_per_order,
      minAge: p.min_age,
      coverRedeemable: p.cover_redeemable,
    };
  });

  return {
    id: c.id,
    slug: c.slug,
    name: c.name,
    citySlug,
    areaName: c.areas?.name ?? null,
    avgRating: c.avg_rating === null ? null : Number(c.avg_rating),
    ratingCount: c.rating_count,
    minAge: c.min_age,
    isClaimed: c.is_claimed,
    lat: c.lat,
    lng: c.lng,
    genres: (c.club_genres ?? [])
      .map((g) => g.genres?.name)
      .filter((g): g is string => Boolean(g)),
    minPrice: entryProducts.length
      ? Math.min(...entryProducts.map((p) => p.price))
      : null,
    priceUpdatedAt: entryProducts[0]?.priceUpdatedAt ?? null,
    openTonight: night?.is_open ?? true,
    description: c.description,
    address: c.address,
    websiteUrl: c.website_url,
    instagramUrl: c.instagram_url,
    phone: c.phone,
    dressCode: c.dress_code,
    houseRules: c.house_rules,
    amenities: (c.club_amenities ?? [])
      .map((a) => a.amenities?.name)
      .filter((a): a is string => Boolean(a)),
    hours: (c.club_hours ?? []).map((h) => ({
      dayOfWeek: h.day_of_week,
      opens: h.opens_at,
      closes: h.closes_at,
      closed: h.is_closed,
    })),
    entryProducts,
    hasTables: (floorPlans ?? []).length > 0,
    events: (events ?? []).map((e) => ({
      id: e.id,
      slug: e.slug,
      name: e.name,
      clubSlug: c.slug,
      clubName: c.name,
      citySlug,
      startsAt: e.starts_at,
      posterPath: e.poster_path,
      minPrice: null,
    })),
    reviews: (reviews ?? []).map((r) => ({
      id: r.id,
      rating: r.rating,
      body: r.body,
      authorName: "ThirtyML guest",
      createdAt: r.created_at,
      reply: r.review_replies?.body ?? null,
    })),
    priceHistory: (history ?? []).map((h) => ({
      at: h.changed_at,
      price: h.new_price,
    })),
  };
}

export async function listEvents(citySlug?: string): Promise<EventSummary[]> {
  if (!isSupabaseConfigured()) {
    return citySlug
      ? demoEvents.filter((e) => e.citySlug === citySlug)
      : demoEvents;
  }
  const supabase = await supabaseServer();
  let query = supabase
    .from("events")
    .select(
      `id, slug, name, poster_path, starts_at,
       clubs!inner(slug, name, cities!inner(slug))`
    )
    .eq("status", "published")
    .gte("starts_at", new Date().toISOString())
    .order("starts_at")
    .limit(50);
  if (citySlug) query = query.eq("clubs.cities.slug", citySlug);
  const { data } = await query;
  return (data ?? []).map((e) => ({
    id: e.id,
    slug: e.slug,
    name: e.name,
    clubSlug: e.clubs.slug,
    clubName: e.clubs.name,
    citySlug: e.clubs.cities.slug,
    startsAt: e.starts_at,
    posterPath: e.poster_path,
    minPrice: null,
  }));
}

export async function getEventDetail(
  citySlug: string,
  slug: string
): Promise<EventDetail | null> {
  if (!isSupabaseConfigured()) return demoEventDetail(citySlug, slug);
  const supabase = await supabaseServer();
  const { data: e } = await supabase
    .from("events")
    .select(
      `id, slug, name, description, poster_path, starts_at, ends_at, terms,
       clubs!inner(id, slug, name, address, lat, lng, cities!inner(slug)),
       event_lineup(artist_name, genre, sort_order)`
    )
    .eq("status", "published")
    .eq("slug", slug)
    .eq("clubs.cities.slug", citySlug)
    .maybeSingle();
  if (!e) return null;

  const eventDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
  }).format(new Date(e.starts_at));

  const { data: tiers } = await supabase
    .from("products")
    .select(
      "id, type, name, description, max_per_order, min_age, cover_redeemable, sales_start_at, sales_end_at, sort_order"
    )
    .eq("event_id", e.id)
    .eq("is_active", true)
    .order("sort_order");

  const tierIds = (tiers ?? []).map((t) => t.id);
  const { data: prices } = tierIds.length
    ? await supabase.rpc("catalog_prices", {
        p_product_ids: tierIds,
        p_date: eventDate,
      })
    : { data: [] as never[] };
  const priceMap = new Map((prices ?? []).map((p) => [p.product_id, p]));

  const tierInfos = (tiers ?? []).map((t) => {
    const live = priceMap.get(t.id);
    return {
      id: t.id,
      type: t.type as ProductInfo["type"],
      name: t.name,
      description: t.description,
      price: live?.price ?? 0,
      priceUpdatedAt: live?.price_updated_at ?? null,
      available: live?.available ?? 0,
      maxPerOrder: t.max_per_order,
      minAge: t.min_age,
      coverRedeemable: t.cover_redeemable,
      salesStartAt: t.sales_start_at,
      salesEndAt: t.sales_end_at,
    };
  });

  return {
    id: e.id,
    slug: e.slug,
    name: e.name,
    clubSlug: e.clubs.slug,
    clubName: e.clubs.name,
    citySlug,
    startsAt: e.starts_at,
    posterPath: e.poster_path,
    minPrice: tierInfos.length
      ? Math.min(...tierInfos.map((t) => t.price))
      : null,
    description: e.description,
    endsAt: e.ends_at,
    terms: e.terms,
    lineup: (e.event_lineup ?? [])
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((l) => ({ artist: l.artist_name, genre: l.genre })),
    venueAddress: e.clubs.address,
    lat: e.clubs.lat,
    lng: e.clubs.lng,
    tiers: tierInfos,
  };
}
