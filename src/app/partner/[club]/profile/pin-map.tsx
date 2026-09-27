"use client";

import * as React from "react";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import type { LeafletEvent } from "leaflet";
import "leaflet/dist/leaflet.css";

export default function PinMap({
  lat,
  lng,
  onChange,
}: {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
}) {
  return (
    <div className="h-72 overflow-hidden rounded-md border border-line">
      <MapContainer
        center={[lat, lng]}
        zoom={15}
        style={{ height: "100%", width: "100%", background: "#0d1120" }}
      >
        <TileLayer
          attribution='&copy; OSM'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <Marker
          position={[lat, lng]}
          draggable
          eventHandlers={{
            dragend: (event: LeafletEvent) => {
              const marker = event.target as { getLatLng(): { lat: number; lng: number } };
              const p = marker.getLatLng();
              onChange(p.lat, p.lng);
            },
          }}
        />
      </MapContainer>
    </div>
  );
}
