import { useState } from "react";
import { api } from "../api/client";
import PasswordInput from "./PasswordInput";

const MIN_LARGO = 6;

// Cambio opcional de contraseña. tipo: "paciente" | "enfermero".
export default function CambiarContrasenaModal({ tipo, email, onCerrar, showToast, anillo = "focus:ring-purple-300" }) {
  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [repetida, setRepetida] = useState("");
  const [errores, setErrores] = useState({});
  const [guardando, setGuardando] = useState(false);

  const guardar = async (e) => {
    e.preventDefault();
    if (nueva.length < MIN_LARGO) return setErrores({ nueva: `Tiene que tener al menos ${MIN_LARGO} caracteres.` });
    if (nueva !== repetida) return setErrores({ repetida: "Las dos contraseñas no coinciden." });
    setErrores({});
    setGuardando(true);
    try {
      await api.cambiarContrasena({ tipo, email, actual, nueva });
      showToast("Contraseña cambiada");
      onCerrar();
    } catch (err) {
      setErrores(err.data?.errors || { general: err.message || "No se pudo cambiar la contraseña." });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onCerrar}>
      <form
        onSubmit={guardar}
        noValidate
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-lg w-full max-w-sm p-6 space-y-4"
      >
        <h2 className="text-lg font-semibold text-gray-800">Cambiar contraseña</h2>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Contraseña actual</label>
          <PasswordInput value={actual} onChange={(e) => setActual(e.target.value)} focusRingClass={anillo} />
          {errores.actual && <p className="text-red-500 text-xs mt-1">{errores.actual}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Contraseña nueva</label>
          <PasswordInput value={nueva} onChange={(e) => setNueva(e.target.value)} focusRingClass={anillo} />
          {errores.nueva && <p className="text-red-500 text-xs mt-1">{errores.nueva}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Repetí la contraseña nueva</label>
          <PasswordInput value={repetida} onChange={(e) => setRepetida(e.target.value)} focusRingClass={anillo} />
          {errores.repetida && <p className="text-red-500 text-xs mt-1">{errores.repetida}</p>}
        </div>
        {errores.general && <p className="text-red-500 text-xs">{errores.general}</p>}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={guardando}
            className="flex-1 bg-gray-800 hover:bg-gray-900 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg"
          >
            {guardando ? "Guardando..." : "Guardar"}
          </button>
          <button type="button" onClick={onCerrar} className="px-4 text-sm text-gray-500 hover:text-gray-700">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
