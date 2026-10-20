import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from "react-leaflet";
import useUbicacion from "../hooks/useUbicacion";

// Centro del Gran Mendoza (Ciudad de Mendoza).
const MENDOZA = [-32.8895, -68.8458];

// Mueve el mapa cuando cambia el punto a mostrar.
function Recentrar({ punto, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (punto) map.setView(punto, zoom);
  }, [punto, zoom, map]);
  return null;
}

export default function CentrosMapa() {
  const { estado, coords, pedir } = useUbicacion();

  return (
    <div className="fade-in w-full max-w-3xl space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Centros de salud</h2>
          <p className="text-sm text-gray-500 mt-1">
            Encontrá hospitales y centros de salud cerca tuyo en el Gran Mendoza.
          </p>
        </div>
        <button
          onClick={pedir}
          disabled={estado === "pidiendo"}
          className="text-sm font-medium text-pink-600 hover:text-pink-800 disabled:opacity-50"
        >
          📍 {estado === "pidiendo" ? "Buscando tu ubicación..." : "Usar mi ubicación"}
        </button>
      </div>

      {/* z-0 crea un contexto propio: sin esto las capas de Leaflet (z-index 400)
          quedan por encima del menú lateral en el celular. */}
      <div className="relative z-0 h-[60vh] min-h-[320px] rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
        <MapContainer center={MENDOZA} zoom={13} scrollWheelZoom className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Recentrar punto={coords} zoom={15} />
          {coords && (
            <CircleMarker
              center={coords}
              radius={9}
              pathOptions={{ color: "#ffffff", weight: 3, fillColor: "#2563eb", fillOpacity: 1 }}
            >
              <Popup>Estás acá</Popup>
            </CircleMarker>
          )}
        </MapContainer>
      </div>
    </div>
  );
}
