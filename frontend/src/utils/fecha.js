// El backend manda las fechas en formato ISO ("2027-03-12"); en pantalla
// las mostramos como dd/mm/aaaa. Se arma a mano en vez de usar new Date()
// para que la zona horaria no corra la fecha un día para atrás.
export function formatFecha(iso) {
  if (!iso) return null;
  const [anio, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${anio}`;
}
