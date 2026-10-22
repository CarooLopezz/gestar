import { useEffect, useRef, useState } from "react";
import { mensajeBienvenida } from "../utils/chatbot";

// Asistente de la embarazada: botón flotante que abre una ventana de chat.
// mensajes: [{ rol: "usuaria" | "asistente", texto }]
export default function ChatbotWidget({ patient }) {
  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState([]);
  const [borrador, setBorrador] = useState("");
  const finRef = useRef(null);

  // Baja hasta el último mensaje cada vez que llega uno nuevo.
  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes, abierto]);

  // Al abrir por primera vez, el asistente saluda con los horarios de atención.
  const abrir = () => {
    setAbierto(true);
    setMensajes((prev) => (prev.length ? prev : [{ rol: "asistente", texto: mensajeBienvenida(patient.nombre) }]));
  };

  const enviar = (e) => {
    e.preventDefault();
    const texto = borrador.trim();
    if (!texto) return;
    setMensajes((prev) => [...prev, { rol: "usuaria", texto }]);
    setBorrador("");
  };

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
          <div key={i} className={`flex ${m.rol === "usuaria" ? "justify-end" : "justify-start"}`}>
            <p
              className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm ${
                m.rol === "usuaria"
                  ? "bg-pink-600 text-white rounded-br-sm"
                  : "bg-white text-gray-800 border border-gray-100 rounded-bl-sm shadow-sm"
              }`}
            >
              {m.texto}
            </p>
          </div>
        ))}
        <div ref={finRef} />
      </div>

      <form onSubmit={enviar} className="border-t border-gray-100 p-3 flex gap-2 bg-white">
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
          disabled={!borrador.trim()}
          className="bg-pink-600 hover:bg-pink-700 disabled:opacity-50 text-white text-sm font-medium px-4 rounded-full"
        >
          Enviar
        </button>
      </form>
    </div>
  );
}
