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
