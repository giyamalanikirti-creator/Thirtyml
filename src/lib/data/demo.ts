import type {
  City,
  ClubDetail,
  ClubSummary,
  EventDetail,
  EventSummary,
  PriceBoardRow,
  ProductInfo,
} from "./types";

/**
 * Demo catalogue used when Supabase is not configured, mirroring
 * supabase/seed.sql so local dev works with zero keys. Coordinates are
 * approximate; listings are unclaimed demo data.
 */

export const demoCities: City[] = [
  { id: "c-mum", slug: "mumbai", name: "Mumbai", state: "Maharashtra", lat: 19.076, lng: 72.8777 },
  { id: "c-pun", slug: "pune", name: "Pune", state: "Maharashtra", lat: 18.5204, lng: 73.8567 },
  { id: "c-agr", slug: "agra", name: "Agra", state: "Uttar Pradesh", lat: 27.1767, lng: 78.0081 },
];

interface DemoClubSeed {
  slug: string;
  name: string;
  city: string;
  area: string;
  lat: number;
  lng: number;
  desc: string;
  genres: string[];
  stag: number; // paise
  couple: number;
  ladies: number | null;
  rating: number | null;
  ratingCount: number;
  hasTables?: boolean;
}

const seeds: DemoClubSeed[] = [
  { slug: "kitty-su", name: "Kitty Su", city: "mumbai", area: "Andheri East", lat: 19.1086, lng: 72.8665, desc: "The Lalit's flagship club — international DJs, a serious sound system and Mumbai's most eclectic crowd.", genres: ["Techno", "EDM", "House"], stag: 250000, couple: 350000, ladies: 50000, rating: 4.5, ratingCount: 132, hasTables: true },
  { slug: "matahari", name: "Matahari", city: "mumbai", area: "Worli", lat: 18.9986, lng: 72.8166, desc: "Worli's big-room club at Atria Mall — commercial and Bollywood nights with a large dance floor.", genres: ["Bollywood", "Commercial"], stag: 200000, couple: 300000, ladies: 0, rating: 4.1, ratingCount: 89 },
  { slug: "antisocial", name: "AntiSocial", city: "mumbai", area: "Khar West", lat: 19.07, lng: 72.836, desc: "Khar's underground favourite — hip-hop, techno and live acts in a raw basement space.", genres: ["Hip-hop", "Techno"], stag: 150000, couple: 250000, ladies: null, rating: 4.4, ratingCount: 210 },
  { slug: "polly-esthers", name: "Polly Esther's", city: "mumbai", area: "Colaba", lat: 18.9225, lng: 72.8318, desc: "Retro-themed Colaba institution — disco balls, 80s and 90s classics.", genres: ["Commercial"], stag: 180000, couple: 280000, ladies: 0, rating: 3.9, ratingCount: 64 },
  { slug: "area-51", name: "Area 51", city: "pune", area: "Baner", lat: 18.564, lng: 73.787, desc: "Baner's warehouse-scale EDM and techno venue — big lineups, bigger drops.", genres: ["EDM", "Techno"], stag: 220000, couple: 320000, ladies: 60000, rating: 4.3, ratingCount: 156, hasTables: true },
  { slug: "mi-a-mi", name: "Mi-A-Mi", city: "pune", area: "Senapati Bapat Road", lat: 18.5323, lng: 73.8298, desc: "JW Marriott's glossy rooftop club — house music, skyline views, dressed-up crowd.", genres: ["House", "Commercial"], stag: 280000, couple: 400000, ladies: 80000, rating: 4.2, ratingCount: 98, hasTables: true },
  { slug: "mix-at-36", name: "Mix@36", city: "pune", area: "Koregaon Park", lat: 18.539, lng: 73.903, desc: "The Westin's late-night lounge in Koregaon Park — commercial hits and cocktails.", genres: ["Commercial", "Bollywood"], stag: 200000, couple: 300000, ladies: null, rating: 4.0, ratingCount: 47 },
  { slug: "mansion-tapas-club", name: "Mansion Tapas & Club", city: "agra", area: "Baluganj", lat: 27.172, lng: 78.012, desc: "Agra's club-and-kitchen hybrid on Gwalior Road — tapas till late, Bollywood after dark.", genres: ["Bollywood", "Commercial"], stag: 100000, couple: 150000, ladies: 0, rating: 4.0, ratingCount: 38 },
  { slug: "beep", name: "Beep", city: "agra", area: "Agra Central", lat: 27.1767, lng: 78.0081, desc: "High-energy commercial nights in central Agra.", genres: ["Commercial"], stag: 80000, couple: 120000, ladies: null, rating: 3.8, ratingCount: 22 },
  { slug: "molecule", name: "Molecule", city: "agra", area: "Agra Central", lat: 27.1767, lng: 78.0081, desc: "Brewpub-style venue with weekend DJ nights.", genres: ["Commercial", "EDM"], stag: 90000, couple: 140000, ladies: null, rating: 4.1, ratingCount: 31 },
];

const updatedAt = new Date(Date.now() - 7 * 60000).toISOString();

function toSummary(s: DemoClubSeed): ClubSummary {
  return {
    id: `demo-${s.slug}`,
    slug: s.slug,
    name: s.name,
    citySlug: s.city,
    areaName: s.area,
    avgRating: s.rating,
    ratingCount: s.ratingCount,
    minAge: 21,
    isClaimed: false,
    lat: s.lat,
    lng: s.lng,
    genres: s.genres,
    minPrice: Math.min(s.stag, s.couple, ...(s.ladies !== null ? [s.ladies] : [])),
    priceUpdatedAt: updatedAt,
    openTonight: ![1, 2].includes(new Date().getDay()),
  };
}

function entryProducts(s: DemoClubSeed): ProductInfo[] {
  const products: ProductInfo[] = [
    { id: `demo-${s.slug}-stag`, type: "entry", name: "Stag entry", description: "Cover redeemable against food & drinks", price: s.stag, priceUpdatedAt: updatedAt, available: 80, maxPerOrder: 6, minAge: 21, coverRedeemable: true },
    { id: `demo-${s.slug}-couple`, type: "entry", name: "Couple entry", description: null, price: s.couple, priceUpdatedAt: updatedAt, available: 40, maxPerOrder: 4, minAge: 21, coverRedeemable: true },
  ];
  if (s.ladies !== null) {
    products.push({ id: `demo-${s.slug}-ladies`, type: "entry", name: "Ladies entry", description: null, price: s.ladies, priceUpdatedAt: updatedAt, available: 60, maxPerOrder: 6, minAge: 21, coverRedeemable: false });
  }
  return products;
}

export const demoClubs: ClubSummary[] = seeds.map(toSummary);

export function demoClubDetail(citySlug: string, slug: string): ClubDetail | null {
  const s = seeds.find((x) => x.slug === slug && x.city === citySlug);
  if (!s) return null;
  const base = toSummary(s);
  const history = Array.from({ length: 7 }, (_, i) => ({
    at: new Date(Date.now() - (6 - i) * 86400000).toISOString(),
    price: s.stag + (((i * 37) % 5) - 2) * 10000,
  }));
  return {
    ...base,
    description: s.desc,
    address: `${s.area}, ${demoCities.find((c) => c.slug === s.city)?.name}`,
    websiteUrl: null,
    instagramUrl: null,
    phone: null,
    dressCode: "Smart casual",
    houseRules: "Carry a valid photo ID — age is checked at the door. Rights of admission reserved.",
    amenities: ["Smoking area", "Couples friendly"],
    hours: Array.from({ length: 7 }, (_, d) => ({
      dayOfWeek: d,
      opens: [1, 2].includes(d) ? null : "21:00",
      closes: [1, 2].includes(d) ? null : "01:30",
      closed: [1, 2].includes(d),
    })),
    entryProducts: entryProducts(s),
    hasTables: Boolean(s.hasTables),
    events: demoEvents.filter((e) => e.clubSlug === s.slug),
    reviews: [
      { id: `demo-r1-${s.slug}`, rating: 5, body: "Sound system is unreal. Service quick even at peak.", authorName: "Demo Customer", createdAt: new Date(Date.now() - 6 * 86400000).toISOString(), reply: null },
      { id: `demo-r2-${s.slug}`, rating: 4, body: "Great crowd. Gets packed after 11, go early.", authorName: "Ria K", createdAt: new Date(Date.now() - 2 * 86400000).toISOString(), reply: null },
    ],
    priceHistory: history,
  };
}

const day = 86400000;
const inDays = (n: number, h: number) =>
  new Date(new Date().setHours(h, 0, 0, 0) + n * day).toISOString();

export const demoEvents: EventSummary[] = [
  { id: "demo-e1", slug: "warehouse-techno-night", name: "Warehouse Techno Night", clubSlug: "kitty-su", clubName: "Kitty Su", citySlug: "mumbai", startsAt: inDays(9, 21), posterPath: null, minPrice: 99900 },
  { id: "demo-e2", slug: "hip-hop-cypher", name: "Hip-Hop Cypher", clubSlug: "antisocial", clubName: "AntiSocial", citySlug: "mumbai", startsAt: inDays(5, 21), posterPath: null, minPrice: 79900 },
  { id: "demo-e3", slug: "bass-drop-festival", name: "Bass Drop Festival", clubSlug: "area-51", clubName: "Area 51", citySlug: "pune", startsAt: inDays(11, 20), posterPath: null, minPrice: 129900 },
  { id: "demo-e4", slug: "bollywood-blockbuster-night", name: "Bollywood Blockbuster Night", clubSlug: "mansion-tapas-club", clubName: "Mansion Tapas & Club", citySlug: "agra", startsAt: inDays(7, 21), posterPath: null, minPrice: 49900 },
];

export function demoEventDetail(citySlug: string, slug: string): EventDetail | null {
  const e = demoEvents.find((x) => x.slug === slug && x.citySlug === citySlug);
  if (!e) return null;
  const club = seeds.find((s) => s.slug === e.clubSlug)!;
  return {
    ...e,
    description: "Demo event from seed data.",
    endsAt: null,
    terms: "Entry with a valid ID only. No refunds within 24 hours of the event.",
    lineup: [{ artist: "DJ Aurora", genre: "Techno" }],
    venueAddress: `${club.area}`,
    lat: club.lat,
    lng: club.lng,
    tiers: [
      { id: `${e.id}-t1`, type: "event_ticket", name: "Early bird", description: null, price: e.minPrice ?? 99900, priceUpdatedAt: updatedAt, available: 40, maxPerOrder: 6, minAge: 21, coverRedeemable: false, salesStartAt: null, salesEndAt: inDays(4, 22) },
      { id: `${e.id}-t2`, type: "event_ticket", name: "Phase 1", description: null, price: (e.minPrice ?? 99900) + 50000, priceUpdatedAt: updatedAt, available: 120, maxPerOrder: 6, minAge: 21, coverRedeemable: false, salesStartAt: inDays(4, 22), salesEndAt: inDays(8, 22) },
    ],
  };
}

export function demoPriceBoard(citySlug: string): PriceBoardRow[] {
  return demoClubs
    .filter((c) => c.citySlug === citySlug)
    .map((c) => ({
      clubId: c.id,
      clubSlug: c.slug,
      clubName: c.name,
      areaName: c.areaName,
      lat: c.lat,
      lng: c.lng,
      minPrice: c.minPrice,
      priceUpdatedAt: c.priceUpdatedAt,
      isOpen: c.openTonight,
    }))
    .sort((a, b) => (a.minPrice ?? 0) - (b.minPrice ?? 0));
}
