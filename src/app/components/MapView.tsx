import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { Link } from "react-router";
import "leaflet/dist/leaflet.css";
import type { Listing } from "../lib/types";
import { listingImage } from "../lib/images";

// Approximate centres for the Valencia neighborhoods we list in.
const NEIGHBORHOOD_COORDS: Record<string, [number, number]> = {
  Ruzafa: [39.4561, -0.3739],
  "El Carmen": [39.4775, -0.38],
  Benimaclet: [39.4869, -0.356],
  Cabanyal: [39.466, -0.329],
  Malvarrosa: [39.472, -0.325],
};
const CENTER: [number, number] = [39.4699, -0.36];

// Deterministic small offset so multiple items in one neighborhood spread out.
function jitter(id: string): [number, number] {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  const dx = ((Math.abs(h) % 1000) / 1000 - 0.5) * 0.006;
  const dy = (((Math.abs(h) >> 10) % 1000) / 1000 - 0.5) * 0.006;
  return [dx, dy];
}

function pinIcon(imageUrl: string) {
  return L.divIcon({
    className: "",
    html: `<div style="width:38px;height:38px;border-radius:50%;border:2px solid #fff;box-shadow:0 1px 5px rgba(0,0,0,.35);background-image:url('${imageUrl}');background-size:cover;background-position:center"></div>`,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
    popupAnchor: [0, -20],
  });
}

export default function MapView({ listings }: { listings: Listing[] }) {
  return (
    <div className="h-full w-full rounded-3xl overflow-hidden shadow-sm isolate">
      <MapContainer
        center={CENTER}
        zoom={13}
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {listings.map((l) => {
          const base = NEIGHBORHOOD_COORDS[l.neighborhood ?? ""] ?? CENTER;
          const [dx, dy] = jitter(l.id);
          return (
            <Marker
              key={l.id}
              position={[base[0] + dx, base[1] + dy]}
              icon={pinIcon(listingImage(l.image_url))}
            >
              <Popup>
                <Link to={`/item/${l.id}`} style={{ textDecoration: "none" }}>
                  <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <img
                      src={listingImage(l.image_url)}
                      alt=""
                      style={{ width: 42, height: 42, borderRadius: 8, objectFit: "cover" }}
                    />
                    <span>
                      <span style={{ display: "block", fontWeight: 600, color: "#3D3530" }}>
                        {l.name}
                      </span>
                      <span style={{ fontSize: 12, color: "#6B7A5C" }}>{l.neighborhood}</span>
                    </span>
                  </span>
                </Link>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
