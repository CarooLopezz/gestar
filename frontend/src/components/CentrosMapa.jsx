import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";
import { CircleMarker, MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import { api } from "../api/client";
import useUbicacion from "../hooks/useUbicacion";
import { TIPOS_CENTRO, iconoCentro } from "../utils/centros";

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
  const [centros, setCentros] = useState([]);

  useEffect(() => {
    api.getCentros().then(setCentros).catch(() => setCentros([]));
  }, []);

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
          {centros.map((c) => (
            <Marker key={c.id} position={[c.lat, c.lng]} icon={iconoCentro(c.tipo)}>
              <Popup>
                <strong>{c.nombre}</strong>
                <br />
                {TIPOS_CENTRO[c.tipo]?.nombre}
              </Popup>
            </Marker>
          ))}
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

      <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-600">
        {Object.entries(TIPOS_CENTRO).map(([tipo, t]) => (
          <span key={tipo} className="flex items-center gap-1.5">
            <span
              className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-xs"
              style={{ border: `2px solid ${t.color}` }}
            >
              {t.icono}
            </span>
            {t.nombre}
          </span>
        ))}
        <span className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-full bg-blue-600 ring-2 ring-white shadow" />
          Tu ubicación
        </span>
      </div>
    </div>
  );
}
