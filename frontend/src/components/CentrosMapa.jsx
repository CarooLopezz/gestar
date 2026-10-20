import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer } from "react-leaflet";

// Centro del Gran Mendoza (Ciudad de Mendoza).
const MENDOZA = [-32.8895, -68.8458];

export default function CentrosMapa() {
  return (
    <div className="fade-in w-full max-w-3xl space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-gray-800">Centros de salud</h2>
        <p className="text-sm text-gray-500 mt-1">
          Encontrá hospitales y centros de salud cerca tuyo en el Gran Mendoza.
        </p>
      </div>

      {/* z-0 crea un contexto propio: sin esto las capas de Leaflet (z-index 400)
          quedan por encima del menú lateral en el celular. */}
      <div className="relative z-0 h-[60vh] min-h-[320px] rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
        <MapContainer center={MENDOZA} zoom={13} scrollWheelZoom className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        </MapContainer>
      </div>
    </div>
  );
}
