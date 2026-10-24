import { useState } from "react";
import { api } from "../api/client";

// "¿Olvidaste tu contraseña?" de las pantallas de login. tipo: "paciente" | "enfermero".
export default function RecuperarContrasena({ tipo, emailInicial = "", anillo = "focus:ring-purple-300" }) {
  const [abierto, setAbierto] = useState(false);
  const [email, setEmail] = useState(emailInicial);
  const [estado, setEstado] = useState(null); // { ok: bool, texto }
  const [enviando, setEnviando] = useState(false);

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => {
          setEmail(emailInicial);
          setAbierto(true);
        }}
        className="w-full text-gray-500 text-sm hover:text-gray-700"
      >
        ¿Olvidaste tu contraseña?
      </button>
    );
  }

  const enviar = async () => {
    setEstado(null);
    setEnviando(true);
    try {
      const r = await api.recuperarContrasena(tipo, email.trim());
      setEstado({ ok: true, texto: r.mensaje });
    } catch (err) {
      setEstado({ ok: false, texto: err.message || "No pudimos mandar el mail. Probá de nuevo en un rato." });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="border-t border-gray-100 pt-4 space-y-2">
      <label htmlFor={`recuperar-${tipo}`} className="block text-sm font-medium text-gray-600">
        Te mandamos una contraseña nueva a tu email
      </label>
      <input
        id={`recuperar-${tipo}`}
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className={`w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${anillo}`}
      />
      {estado && <p className={`text-xs ${estado.ok ? "text-green-700" : "text-red-500"}`}>{estado.texto}</p>}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={enviar}
          disabled={!email.trim() || enviando}
          className="flex-1 bg-gray-800 hover:bg-gray-900 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-lg"
        >
          {enviando ? "Enviando..." : "Mandarme una nueva"}
        </button>
        <button type="button" onClick={() => setAbierto(false)} className="text-sm text-gray-400 hover:text-gray-600">
          Cancelar
        </button>
      </div>
    </div>
  );
}
