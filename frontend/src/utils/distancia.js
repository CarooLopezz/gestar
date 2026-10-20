// Lógica de la lista de centros que no depende del mapa, para poder probarla
// sin navegador (ver distancia.test.js).

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

// Filtra por tipo ("todos" = sin filtro) y ordena: con ubicación, del más
// cercano al más lejano (agrega `distancia`); sin ella, por nombre.
export function ordenarCentros(centros, coords, tipo = "todos") {
  const filtrados = centros
    .filter((c) => tipo === "todos" || c.tipo === tipo)
    .map((c) => ({ ...c, distancia: coords ? distanciaKm(coords, [c.lat, c.lng]) : null }));
  return coords
    ? filtrados.sort((a, b) => a.distancia - b.distancia)
    : filtrados.sort((a, b) => a.nombre.localeCompare(b.nombre));
}
