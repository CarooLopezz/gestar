import { useState } from "react";
import { api } from "../api/client";
import PasswordInput from "./PasswordInput";

export default function NurseLoginForm({ onLogin, onBack, onGoToRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const nurse = await api.loginNurse({ email, password });
      onLogin(nurse);
    } catch (err) {
      setError(err.message || "Email o contraseña incorrectos.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-b from-purple-50 to-pink-50 px-4">
      <div className="text-5xl mb-4">👩‍⚕️</div>
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 w-full max-w-sm space-y-4"
      >
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-300"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Contraseña</label>
          <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>

        {error && <p className="text-red-500 text-xs">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg transition"
        >
          {submitting ? "Ingresando..." : "Ingresar"}
        </button>

        <button
          type="button"
          onClick={onGoToRegister}
          className="w-full text-purple-500 text-sm hover:text-purple-700"
        >
          ¿No tenés cuenta? Registrate
        </button>

        <button
          type="button"
          onClick={onBack}
          className="w-full text-gray-400 text-sm hover:text-gray-600"
        >
          ← Volver
        </button>
      </form>
    </div>
  );
}
