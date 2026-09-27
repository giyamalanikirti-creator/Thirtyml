/**
 * UI-facing catalogue types. The data layer (`catalog.ts`) fills these from
 * Supabase when configured, or from the demo fixtures so the whole app runs
 * with zero keys.
 */

export interface City {
  id: string;
  slug: string;
  name: string;
  state: string;
  lat: number;
  lng: number;
}

export interface ClubSummary {
  id: string;
  slug: string;
  name: string;
  citySlug: string;
  areaName: string | null;
  avgRating: number | null;
  ratingCount: number;
  minAge: number;
  isClaimed: boolean;
  lat: number | null;
  lng: number | null;
  genres: string[];
  /** Lowest live entry price tonight, paise; null when nothing is on sale */
  minPrice: number | null;
  priceUpdatedAt: string | null;
  openTonight: boolean;
}

export interface ProductInfo {
  id: string;
  type: "entry" | "table" | "event_ticket";
  name: string;
  description: string | null;
  price: number;
  priceUpdatedAt: string | null;
  available: number;
  maxPerOrder: number;
  minAge: number | null;
  coverRedeemable: boolean;
}

export interface ClubDetail extends ClubSummary {
  description: string | null;
  address: string | null;
  websiteUrl: string | null;
  instagramUrl: string | null;
  phone: string | null;
  dressCode: string | null;
  houseRules: string | null;
  amenities: string[];
  hours: { dayOfWeek: number; opens: string | null; closes: string | null; closed: boolean }[];
  entryProducts: ProductInfo[];
  hasTables: boolean;
  events: EventSummary[];
  reviews: ReviewInfo[];
  priceHistory: { at: string; price: number }[];
}

export interface ReviewInfo {
  id: string;
  rating: number;
  body: string | null;
  authorName: string;
  createdAt: string;
  reply: string | null;
}

export interface EventSummary {
  id: string;
  slug: string;
  name: string;
  clubSlug: string;
  clubName: string;
  citySlug: string;
  startsAt: string;
  posterPath: string | null;
  minPrice: number | null;
}

export interface EventDetail extends EventSummary {
  description: string | null;
  endsAt: string | null;
  terms: string | null;
  lineup: { artist: string; genre: string | null }[];
  venueAddress: string | null;
  lat: number | null;
  lng: number | null;
  tiers: (ProductInfo & { salesStartAt: string | null; salesEndAt: string | null })[];
}

export interface PriceBoardRow {
  clubId: string;
  clubSlug: string;
  clubName: string;
  areaName: string | null;
  lat: number | null;
  lng: number | null;
  minPrice: number | null;
  priceUpdatedAt: string | null;
  isOpen: boolean;
}

export interface ClubFilters {
  city: string;
  q?: string;
  genre?: string;
  maxPrice?: number;
  openTonight?: boolean;
  sort?: "popularity" | "price_asc" | "price_desc" | "rating";
}
