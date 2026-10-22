import { useEffect, useRef, useState } from "react";
import { api } from "../api/client";
import { OPCIONES_ANIMO, cargarConversacion, conversacionInicial, guardarConversacion } from "../utils/chatbot";

// Preguntas sugeridas después de que responde sobre su ánimo.
const SUGERENCIAS = [
  "¿Cuál es el horario de atención?",
  "¿Cuándo es mi próximo turno?",
  "¿Qué estudios me tocan ahora?",
  "¿Cómo cargo mi presión?",
];

const CHIP =
  "text-xs font-medium text-pink-700 bg-white border border-pink-200 hover:bg-pink-50 rounded-full px-3 py-1.5";

// Asistente de la embarazada: botón flotante que abre una ventana de chat.
// mensajes: [{ rol: "usuaria" | "asistente", texto }]
export default function ChatbotWidget({ patient }) {
  const [abierto, setAbierto] = useState(false);
  // Si ya hubo conversación en esta sesión, se retoma; si no, vacía hasta abrir.
  const [mensajes, setMensajes] = useState(() => cargarConversacion(patient.dni) || []);
  const [borrador, setBorrador] = useState("");
  const [esperando, setEsperando] = useState(false);
  const [error, setError] = useState(null);
  const finRef = useRef(null);

  // Baja hasta el último mensaje cada vez que llega uno nuevo.
  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes, abierto, esperando]);

  // Cada cambio de la conversación queda guardado para esta sesión.
  useEffect(() => {
    if (mensajes.length) guardarConversacion(patient.dni, mensajes);
  }, [mensajes, patient.dni]);

  // La primera vez en la sesión, el asistente saluda con los horarios de
  // atención; después se retoma la conversación guardada sin repetirlo.
  const abrir = () => {
    setAbierto(true);
    setMensajes((prev) => (prev.length ? prev : conversacionInicial(patient.dni, patient.nombre)));
  };

  const enviar = async (textoEnviado) => {
    const texto = textoEnviado.trim();
    if (!texto || esperando) return;
    const conversacion = [...mensajes, { rol: "usuaria", texto }];
    setMensajes(conversacion);
    setBorrador("");
    setError(null);
    setEsperando(true);
    try {
      const { respuesta, modo } = await api.conversarConAsistente(patient.dni, conversacion);
      setMensajes((prev) => [...prev, { rol: "asistente", texto: respuesta, modo }]);
    } catch (err) {
      // El mensaje de la usuaria queda en la conversación; puede reintentar.
      setError(err.message || "No pudimos enviar tu mensaje. Revisá tu conexión.");
    } finally {
      setEsperando(false);
    }
  };

  const cantidadUsuaria = mensajes.filter((m) => m.rol === "usuaria").length;

  if (!abierto) {
    return (
      <button
        onClick={abrir}
        aria-label="Abrir el asistente"
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 bg-pink-600 hover:bg-pink-700 text-white font-medium pl-4 pr-5 py-3 rounded-full shadow-lg"
      >
        <span className="text-xl">💬</span>
        Asistente
      </button>
    );
  }

  return (
    <div
      role="dialog"
      aria-label="Asistente de GESTAR+"
      className="fixed z-50 inset-0 sm:inset-auto sm:bottom-5 sm:right-5 sm:w-[380px] sm:h-[560px] bg-white sm:rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden"
    >
      <header className="flex items-center justify-between gap-3 px-4 py-3 bg-pink-600 text-white">
        <div className="flex items-center gap-2">
          <span className="text-xl">🤰</span>
          <div>
            <p className="font-semibold leading-tight">Asistente GESTAR+</p>
            <p className="text-xs text-pink-100">Hola, {patient.nombre}</p>
          </div>
        </div>
        <button
          onClick={() => setAbierto(false)}
          aria-label="Cerrar el asistente"
          className="w-8 h-8 rounded-full hover:bg-pink-700 text-lg"
        >
          ✕
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-pink-50/40">
        {mensajes.length === 0 && (
          <p className="text-center text-sm text-gray-400 mt-8">Escribí tu consulta para empezar.</p>
        )}
        {mensajes.map((m, i) => (
          <div key={i} className={`flex flex-col ${m.rol === "usuaria" ? "items-end" : "items-start"}`}>
            <p
              className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm ${
                m.rol === "usuaria"
                  ? "bg-pink-600 text-white rounded-br-sm"
                  : "bg-white text-gray-800 border border-gray-100 rounded-bl-sm shadow-sm"
              }`}
            >
              {m.texto}
            </p>
            {m.modo === "basico" && (
              <span className="text-[10px] text-gray-400 mt-0.5 ml-1">Respuesta automática, sin IA</span>
            )}
          </div>
        ))}
        {!esperando && (
          <div className="flex flex-wrap gap-2 justify-end">
            {/* Primero, cómo se siente; después de esa respuesta, preguntas sugeridas. */}
            {cantidadUsuaria === 0 &&
              OPCIONES_ANIMO.map((o) => (
                <button key={o.texto} onClick={() => enviar(o.texto)} className={CHIP}>
                  {o.etiqueta}
                </button>
              ))}
            {cantidadUsuaria === 1 &&
              SUGERENCIAS.map((s) => (
                <button key={s} onClick={() => enviar(s)} className={CHIP}>
                  {s}
                </button>
              ))}
          </div>
        )}
        {esperando && (
          <div className="flex justify-start" aria-live="polite">
            <p className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm shadow-sm px-3.5 py-2 text-sm text-gray-400">
              Escribiendo...
            </p>
          </div>
        )}
        {error && (
          <p role="alert" className="text-center text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
        <div ref={finRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          enviar(borrador);
        }}
        className="border-t border-gray-100 p-3 flex gap-2 bg-white"
      >
        <label htmlFor="chatbot-mensaje" className="sr-only">
          Tu mensaje
        </label>
        <input
          id="chatbot-mensaje"
          value={borrador}
          onChange={(e) => setBorrador(e.target.value)}
          maxLength={500}
          placeholder="Escribí tu consulta..."
          className="flex-1 border border-gray-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
        />
        <button
          type="submit"
          disabled={!borrador.trim() || esperando}
          className="bg-pink-600 hover:bg-pink-700 disabled:opacity-50 text-white text-sm font-medium px-4 rounded-full"
        >
          Enviar
        </button>
      </form>
    </div>
  );
}
