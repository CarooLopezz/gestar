// Horario de atención de enfermería que informa el asistente. Si cambia,
// actualizarlo también en backend/chatbot.py (lo usa la IA para responder).
export const HORARIO_ATENCION = {
  texto: "lunes a viernes de 8 a 20 h",
  dias: [1, 2, 3, 4, 5], // getDay(): 0 = domingo
  desde: 8,
  hasta: 20,
};

export function estaEnHorario(fecha = new Date()) {
  const h = fecha.getHours();
  return HORARIO_ATENCION.dias.includes(fecha.getDay()) && h >= HORARIO_ATENCION.desde && h < HORARIO_ATENCION.hasta;
}

// La conversación se guarda en sessionStorage: dura mientras la pestaña esté
// abierta (aunque se recargue), y se borra al salir. Así la bienvenida se
// muestra una sola vez por sesión. Si el navegador no deja guardar, la
// conversación vive solo en memoria.
const clave = (dni) => `gestar.chat.${dni}`;

function almacenamiento() {
  try {
    return typeof sessionStorage === "undefined" ? null : sessionStorage;
  } catch {
    return null;
  }
}

export function cargarConversacion(dni, storage = almacenamiento()) {
  try {
    const guardada = JSON.parse(storage?.getItem(clave(dni)));
    return Array.isArray(guardada) ? guardada : null;
  } catch {
    return null;
  }
}

export function guardarConversacion(dni, mensajes, storage = almacenamiento()) {
  try {
    storage?.setItem(clave(dni), JSON.stringify(mensajes));
  } catch {
    // sin almacenamiento disponible: se pierde al recargar, nada más
  }
}

export function borrarConversacion(dni, storage = almacenamiento()) {
  try {
    storage?.removeItem(clave(dni));
  } catch {
    // idem
  }
}

// Conversación con la que arranca el chat: la guardada en esta sesión, o la
// bienvenida si es la primera vez.
export function conversacionInicial(dni, nombre, storage = almacenamiento(), fecha = new Date()) {
  const guardada = cargarConversacion(dni, storage);
  return guardada?.length ? guardada : [{ rol: "asistente", texto: mensajeBienvenida(nombre, fecha) }];
}

export function mensajeBienvenida(nombre, fecha = new Date()) {
  const ahora = estaEnHorario(fecha)
    ? "Ahora enfermería está atendiendo."
    : "Ahora estamos fuera de ese horario: tus mensajes a enfermería se responden el siguiente día hábil.";
  return [
    `¡Hola, ${nombre}! 👋 Soy el asistente de GESTAR+. Te puedo ayudar con dudas sobre la app, tus turnos, tus controles y el embarazo en general.`,
    `🕐 Horario de atención de enfermería: ${HORARIO_ATENCION.texto}. ${ahora}`,
    "🚨 Si tenés sangrado, pérdida de líquido, dolor fuerte, dolor de cabeza intenso o no sentís moverse al bebé, no esperes: llamá al 107 o andá a la guardia más cercana.",
  ].join("\n\n");
}
