import L from "leaflet";

// Cómo se muestra cada tipo de centro: en el mapa, en la leyenda y en la lista.
export const TIPOS_CENTRO = {
  hospital: { nombre: "Hospital", icono: "🏥", color: "#dc2626", chip: "bg-red-50 text-red-700" },
  centro_salud: { nombre: "Centro de salud", icono: "🩺", color: "#16a34a", chip: "bg-green-50 text-green-700" },
  clinica: { nombre: "Clínica o sanatorio", icono: "🏨", color: "#7c3aed", chip: "bg-violet-50 text-violet-700" },
};

// Distancia en línea recta, en km (fórmula de Haversine).
export function distanciaKm([lat1, lng1], [lat2, lng2]) {
  const rad = (g) => (g * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLng = rad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatDistancia(km) {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1).replace(".", ",")} km`;
}

// Abre el recorrido en Google Maps (en el celular abre la app).
export function linkComoLlegar(centro) {
  return `https://www.google.com/maps/dir/?api=1&destination=${centro.lat},${centro.lng}`;
}

// Marcador redondo con el ícono del tipo y su color de borde. Se usa divIcon
// para no depender de las imágenes de marcador de Leaflet (que el build no
// encuentra sin configuración extra).
const cache = {};
export function iconoCentro(tipo) {
  if (!cache[tipo]) {
    const t = TIPOS_CENTRO[tipo] || TIPOS_CENTRO.clinica;
    cache[tipo] = L.divIcon({
      className: "",
      html: `<div style="width:34px;height:34px;border-radius:50%;background:#fff;border:3px solid ${t.color};display:flex;align-items:center;justify-content:center;font-size:17px;box-shadow:0 1px 4px rgba(0,0,0,.3)">${t.icono}</div>`,
      iconSize: [34, 34],
      iconAnchor: [17, 17],
      popupAnchor: [0, -18],
    });
  }
  return cache[tipo];
}
