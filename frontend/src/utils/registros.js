// Ayudas para los registros de presión, peso y síntomas, que guardan la fecha
// como texto "dd/mm/aaaa" y la hora como "HH:MM".

export function aDate(fecha) {
  const [d, m, a] = (fecha || "").split("/").map(Number);
  return a ? new Date(a, m - 1, d) : null;
}

// Del más nuevo al más viejo según fecha y hora (no según el orden de carga).
export function masNuevoPrimero(registros) {
  const clave = (r) => {
    const f = aDate(r.fecha);
    const [h, m] = (r.hora || "00:00").split(":").map(Number);
    return f ? f.getTime() + (h * 60 + m) * 60000 : 0;
  };
  return [...registros].sort((a, b) => clave(b) - clave(a));
}

export function diasDesde(fecha) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  return Math.round((hoy - fecha) / 86400000);
}
