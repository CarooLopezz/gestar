// Búsqueda de personas en las tablas de Usuarios: sin importar acentos ni
// mayúsculas ("maria" encuentra "María"), y con nombre y apellido juntos en
// cualquier orden ("ana martinez" o "martinez ana").

function normalizar(texto) {
  return (texto || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export function coincideBusqueda(persona, busqueda) {
  const palabras = normalizar(busqueda).split(/\s+/).filter(Boolean);
  if (palabras.length === 0) return true;
  const datos = normalizar([persona.nombre, persona.apellido, persona.dni, persona.email].join(" "));
  return palabras.every((p) => datos.includes(p));
}
