import React from "react";
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from "react-leaflet";
import { divIcon, latLngBounds, type LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";

function pinSvg(color: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" stroke="white" stroke-width="1.5" width="24" height="24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"/></svg>`;
}

function pinIcon(color: string) {
  return divIcon({
    html: pinSvg(color),
    className: "bg-transparent",
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -24],
  });
}

function BoundsFitter({ positions }: { positions: LatLngExpression[] }) {
  const map = useMap();
  React.useEffect(() => {
    if (positions.length < 2) return;
    const bounds = latLngBounds(positions);
    map.fitBounds(bounds, { padding: [20, 20], maxZoom: 18 });
  }, [map, positions]);
  return null;
}

interface WalkMapProps {
  points: { lat: number; lng: number; ts?: number }[];
  className?: string;
  height?: string;
}

export function WalkMap({ points, className = "", height = "180px" }: WalkMapProps) {
  if (points.length < 2) {
    return (
      <div className={`bg-muted/40 rounded-xl border border-border flex items-center justify-center text-sm text-muted-foreground ${className}`} style={{ height }}>
        Not enough GPS points to draw a route.
      </div>
    );
  }

  const positions: LatLngExpression[] = points.map(p => [p.lat, p.lng]);
  const start = positions[0];
  const end = positions[positions.length - 1];
  const center = start;

  return (
    <div className={`rounded-xl overflow-hidden border border-border ${className}`} style={{ height }}>
      <MapContainer
        center={center}
        zoom={16}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Polyline positions={positions} color="#10b981" weight={4} opacity={0.85} />
        <Marker position={start} icon={pinIcon("#3b82f6")}>
          <Popup>Start</Popup>
        </Marker>
        <Marker position={end} icon={pinIcon("#ef4444")}>
          <Popup>End</Popup>
        </Marker>
        <BoundsFitter positions={positions} />
      </MapContainer>
    </div>
  );
}
