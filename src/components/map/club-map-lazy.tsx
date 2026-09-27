"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

/** Leaflet touches `window`, so the map only loads client-side, lazily. */
export const ClubMapLazy = dynamic(() => import("./club-map"), {
  ssr: false,
  loading: () => <Skeleton className="h-[420px] w-full" />,
});
