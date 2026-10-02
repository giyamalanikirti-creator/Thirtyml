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
 * approximate; listings are unclaimed demo data. Images are nightlife
 * stock photos from Unsplash (hotlinkable under the Unsplash licence).
 */

export const demoCities: City[] = [
  { id: "c-mum", slug: "mumbai", name: "Mumbai", state: "Maharashtra", lat: 19.076, lng: 72.8777 },
  { id: "c-pun", slug: "pune", name: "Pune", state: "Maharashtra", lat: 18.5204, lng: 73.8567 },
  { id: "c-agr", slug: "agra", name: "Agra", state: "Uttar Pradesh", lat: 27.1767, lng: 78.0081 },
];

// Hand-picked Unsplash nightclub / bar / lounge photos. All public under the
// Unsplash licence. w=1200 keeps payloads modest; `auto=format` serves AVIF.
const U = (id: string, w = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

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
  image: string;
}

const seeds: DemoClubSeed[] = [
  // -------- Mumbai (6) --------
  {
    slug: "kitty-su", name: "Kitty Su", city: "mumbai", area: "Andheri East",
    lat: 19.1086, lng: 72.8665,
    desc: "The Lalit's flagship club — international DJs, a serious sound system and Mumbai's most eclectic crowd.",
    genres: ["Techno", "EDM", "House"], stag: 250000, couple: 350000, ladies: 50000,
    rating: 4.5, ratingCount: 132, hasTables: true,
    image: U("photo-1571266028243-d220c6a3ce84"),
  },
  {
    slug: "matahari", name: "Matahari", city: "mumbai", area: "Worli",
    lat: 18.9986, lng: 72.8166,
    desc: "Worli's big-room club at Atria Mall — commercial and Bollywood nights with a large dance floor.",
    genres: ["Bollywood", "Commercial"], stag: 200000, couple: 300000, ladies: 0,
    rating: 4.1, ratingCount: 89,
    image: U("photo-1566737236500-c8ac43014a67"),
  },
  {
    slug: "antisocial", name: "AntiSocial", city: "mumbai", area: "Khar West",
    lat: 19.07, lng: 72.836,
    desc: "Khar's underground favourite — hip-hop, techno and live acts in a raw basement space.",
    genres: ["Hip-hop", "Techno"], stag: 150000, couple: 250000, ladies: null,
    rating: 4.4, ratingCount: 210,
    image: U("photo-1572441713132-51c75654db73"),
  },
  {
    slug: "polly-esthers", name: "Polly Esther's", city: "mumbai", area: "Colaba",
    lat: 18.9225, lng: 72.8318,
    desc: "Retro-themed Colaba institution — disco balls, 80s and 90s classics.",
    genres: ["Commercial"], stag: 180000, couple: 280000, ladies: 0,
    rating: 3.9, ratingCount: 64,
    image: U("photo-1545128485-c400e7702796"),
  },
  {
    slug: "trilogy", name: "Trilogy", city: "mumbai", area: "Juhu",
    lat: 19.1075, lng: 72.8263,
    desc: "Beachside multi-level club at Hotel Sea Princess — three floors, three vibes.",
    genres: ["House", "Commercial", "Bollywood"], stag: 240000, couple: 360000, ladies: 60000,
    rating: 4.2, ratingCount: 148, hasTables: true,
    image: U("photo-1551024709-8f23befc6f87"),
  },
  {
    slug: "aer", name: "AER", city: "mumbai", area: "Lower Parel",
    lat: 18.9875, lng: 72.8148,
    desc: "Four Seasons' 34th-floor rooftop — skyline views, cocktails, deep house till late.",
    genres: ["House", "Deep house"], stag: 300000, couple: 450000, ladies: 100000,
    rating: 4.6, ratingCount: 203, hasTables: true,
    image: U("photo-1540039155733-5bb30b53aa14"),
  },

  // -------- Pune (5) --------
  {
    slug: "area-51", name: "Area 51", city: "pune", area: "Baner",
    lat: 18.564, lng: 73.787,
    desc: "Baner's warehouse-scale EDM and techno venue — big lineups, bigger drops.",
    genres: ["EDM", "Techno"], stag: 220000, couple: 320000, ladies: 60000,
    rating: 4.3, ratingCount: 156, hasTables: true,
    image: U("photo-1543007630-9710e4a00a20"),
  },
  {
    slug: "mi-a-mi", name: "Mi-A-Mi", city: "pune", area: "Senapati Bapat Road",
    lat: 18.5323, lng: 73.8298,
    desc: "JW Marriott's glossy rooftop club — house music, skyline views, dressed-up crowd.",
    genres: ["House", "Commercial"], stag: 280000, couple: 400000, ladies: 80000,
    rating: 4.2, ratingCount: 98, hasTables: true,
    image: U("photo-1516450360452-9312f5e86fc7"),
  },
  {
    slug: "mix-at-36", name: "Mix@36", city: "pune", area: "Koregaon Park",
    lat: 18.539, lng: 73.903,
    desc: "The Westin's late-night lounge in Koregaon Park — commercial hits and cocktails.",
    genres: ["Commercial", "Bollywood"], stag: 200000, couple: 300000, ladies: null,
    rating: 4.0, ratingCount: 47,
    image: U("photo-1587351021355-a479a299d2f9"),
  },
  {
    slug: "high-spirits", name: "High Spirits", city: "pune", area: "Koregaon Park",
    lat: 18.5456, lng: 73.8936,
    desc: "Pune's live-music hub — bands, DJ nights, open-air seating and a huge weekday crowd.",
    genres: ["Live music", "Rock", "Commercial"], stag: 100000, couple: 180000, ladies: 0,
    rating: 4.3, ratingCount: 312,
    image: U("photo-1514933651103-005eec06c04b"),
  },
  {
    slug: "penthouze", name: "Penthouze", city: "pune", area: "Baner",
    lat: 18.5612, lng: 73.7914,
    desc: "Rooftop night-life skydeck — commercial Bollywood and EDM every weekend.",
    genres: ["Bollywood", "EDM", "Commercial"], stag: 180000, couple: 280000, ladies: 50000,
    rating: 4.1, ratingCount: 189, hasTables: true,
    image: U("photo-1559329007-40df8a9345d8"),
  },

  // -------- Agra (5) --------
  {
    slug: "mansion-tapas-club", name: "Mansion Tapas & Club", city: "agra", area: "Baluganj",
    lat: 27.172, lng: 78.012,
    desc: "Agra's club-and-kitchen hybrid on Gwalior Road — tapas till late, Bollywood after dark.",
    genres: ["Bollywood", "Commercial"], stag: 100000, couple: 150000, ladies: 0,
    rating: 4.0, ratingCount: 38,
    image: U("photo-1559526324-c1f275fbfa32"),
  },
  {
    slug: "beep", name: "Beep", city: "agra", area: "Agra Central",
    lat: 27.1767, lng: 78.0081,
    desc: "High-energy commercial nights in central Agra.",
    genres: ["Commercial"], stag: 80000, couple: 120000, ladies: null,
    rating: 3.8, ratingCount: 22,
    image: U("photo-1574391884720-bbc3740c59d1"),
  },
  {
    slug: "molecule", name: "Molecule", city: "agra", area: "Agra Central",
    lat: 27.1767, lng: 78.0081,
    desc: "Brewpub-style venue with weekend DJ nights.",
    genres: ["Commercial", "EDM"], stag: 90000, couple: 140000, ladies: null,
    rating: 4.1, ratingCount: 31,
    image: U("photo-1575444758702-4a6b9222336e"),
  },
  {
    slug: "mocambo", name: "Mocambo", city: "agra", area: "Taj Nagri",
    lat: 27.1591, lng: 78.0421,
    desc: "Classic Taj Nagri lounge — long cocktail list, slow-burn house, candle-lit tables.",
    genres: ["Lounge", "House"], stag: 90000, couple: 150000, ladies: 50000,
    rating: 4.0, ratingCount: 54,
    image: U("photo-1470337458703-46ad1756a187"),
  },
  {
    slug: "cafe-coffee-club", name: "Cafe & Coffee Club", city: "agra", area: "Sadar Bazaar",
    lat: 27.1667, lng: 78.015,
    desc: "Weekend-only club atop a cafe — Bollywood, hip-hop and the city's youngest crowd.",
    genres: ["Bollywood", "Hip-hop"], stag: 70000, couple: 110000, ladies: 0,
    rating: 3.9, ratingCount: 41,
    image: U("photo-1527224538127-2104bb71c51b"),
  },
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
    imageUrl: s.image,
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
    amenities: ["Smoking area", "Couples friendly", "Valet parking"],
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
      { id: `demo-r1-${s.slug}`, rating: 5, body: "Sound system is unreal. Service quick even at peak.", authorName: "Rohan M", createdAt: new Date(Date.now() - 6 * 86400000).toISOString(), reply: null },
      { id: `demo-r2-${s.slug}`, rating: 4, body: "Great crowd. Gets packed after 11, go early.", authorName: "Ria K", createdAt: new Date(Date.now() - 2 * 86400000).toISOString(), reply: null },
    ],
    priceHistory: history,
  };
}

const day = 86400000;
const inDays = (n: number, h: number) =>
  new Date(new Date().setHours(h, 0, 0, 0) + n * day).toISOString();

export const demoEvents: EventSummary[] = [
  { id: "demo-e1", slug: "warehouse-techno-night", name: "Warehouse Techno Night", clubSlug: "kitty-su", clubName: "Kitty Su", citySlug: "mumbai", startsAt: inDays(9, 21), posterPath: U("photo-1574434532902-4c3b61bb0bf4"), minPrice: 99900 },
  { id: "demo-e2", slug: "hip-hop-cypher", name: "Hip-Hop Cypher", clubSlug: "antisocial", clubName: "AntiSocial", citySlug: "mumbai", startsAt: inDays(5, 21), posterPath: U("photo-1511671782779-c97d3d27a1d4"), minPrice: 79900 },
  { id: "demo-e3", slug: "bass-drop-festival", name: "Bass Drop Festival", clubSlug: "area-51", clubName: "Area 51", citySlug: "pune", startsAt: inDays(11, 20), posterPath: U("photo-1459749411175-04bf5292ceea"), minPrice: 129900 },
  { id: "demo-e4", slug: "bollywood-blockbuster-night", name: "Bollywood Blockbuster Night", clubSlug: "mansion-tapas-club", clubName: "Mansion Tapas & Club", citySlug: "agra", startsAt: inDays(7, 21), posterPath: U("photo-1517457373958-b7bdd4587205"), minPrice: 49900 },
  { id: "demo-e5", slug: "sunset-sessions", name: "Sunset Sessions · Rooftop", clubSlug: "aer", clubName: "AER", citySlug: "mumbai", startsAt: inDays(3, 18), posterPath: U("photo-1470225620780-dba8ba36b745"), minPrice: 149900 },
  { id: "demo-e6", slug: "live-indie-friday", name: "Live Indie Friday", clubSlug: "high-spirits", clubName: "High Spirits", citySlug: "pune", startsAt: inDays(4, 20), posterPath: U("photo-1501386761578-eac5c94b800a"), minPrice: 49900 },
];

export function demoEventDetail(citySlug: string, slug: string): EventDetail | null {
  const e = demoEvents.find((x) => x.slug === slug && x.citySlug === citySlug);
  if (!e) return null;
  const club = seeds.find((s) => s.slug === e.clubSlug)!;
  return {
    ...e,
    description: "Doors at 9pm. ID required. Dress to impress.",
    endsAt: null,
    terms: "Entry with a valid ID only. No refunds within 24 hours of the event.",
    lineup: [{ artist: "DJ Aurora", genre: "Techno" }, { artist: "Zeph B2B Karan", genre: "Techno" }],
    venueAddress: `${club.area}`,
    lat: club.lat,
    lng: club.lng,
    tiers: [
      { id: `${e.id}-t1`, type: "event_ticket", name: "Early bird", description: null, price: e.minPrice ?? 99900, priceUpdatedAt: updatedAt, available: 40, maxPerOrder: 6, minAge: 21, coverRedeemable: false, salesStartAt: null, salesEndAt: inDays(4, 22) },
      { id: `${e.id}-t2`, type: "event_ticket", name: "Phase 1", description: null, price: (e.minPrice ?? 99900) + 50000, priceUpdatedAt: updatedAt, available: 120, maxPerOrder: 6, minAge: 21, coverRedeemable: false, salesStartAt: inDays(4, 22), salesEndAt: inDays(8, 22) },
      { id: `${e.id}-t3`, type: "event_ticket", name: "VIP table", description: "Reserved table for 4 with bottle service", price: (e.minPrice ?? 99900) + 250000, priceUpdatedAt: updatedAt, available: 10, maxPerOrder: 2, minAge: 21, coverRedeemable: false, salesStartAt: null, salesEndAt: inDays(10, 22) },
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
