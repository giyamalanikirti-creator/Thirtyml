"use client";

import * as React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Link from "next/link";
import { formatPaise } from "@/lib/utils";

export interface MapPin {
  id: string;
  slug: string;
  name: string;
  citySlug: string;
  lat: number;
  lng: number;
  minPrice: number | null;
}

function pinIcon(minPrice: number | null) {
  const label = minPrice === null ? "—" : minPrice === 0 ? "Free" : formatPaise(minPrice);
  return L.divIcon({
    className: "",
    html: `<span style="
      display:inline-block;background:#f7a521;color:#0d1120;font-weight:600;
      font-size:12px;padding:2px 8px;border-radius:999px;white-space:nowrap;
      box-shadow:0 1px 4px rgba(0,0,0,.5);font-variant-numeric:tabular-nums;
    ">${label}</span>`,
    iconAnchor: [24, 12],
  });
}

export default function ClubMap({
  pins,
  center,
  zoom = 12,
  height = "420px",
}: {
  pins: MapPin[];
  center: [number, number];
  zoom?: number;
  height?: string;
}) {
  return (
    <div
      style={{ height }}
      className="overflow-hidden rounded-md border border-line"
      aria-label="Map of clubs"
    >
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: "100%", width: "100%", background: "#0d1120" }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        {pins.map((pin) => (
          <Marker
            key={pin.id}
            position={[pin.lat, pin.lng]}
            icon={pinIcon(pin.minPrice)}
          >
            <Popup>
              <div style={{ minWidth: 160 }}>
                <strong>{pin.name}</strong>
                <br />
                {pin.minPrice !== null && (
                  <>entry from {formatPaise(pin.minPrice)}<br /></>
                )}
                <Link href={`/${pin.citySlug}/clubs/${pin.slug}`}>
                  View club
                </Link>
                {" · "}
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${pin.lat},${pin.lng}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Directions
                </a>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
