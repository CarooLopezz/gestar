import { useState } from "react";
import { api } from "../api/client";
import PasswordInput from "./PasswordInput";

export default function NurseForgotPasswordForm({ onBack, onDone }) {
  const [email, setEmail] = useState("");
  const [dni, setDni] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setSubmitting(true);
    try {
      await api.forgotNursePassword({ email, dni, new_password: newPassword });
      onDone();
    } catch (err) {
      if (err.data?.errors) {
        setErrors(err.data.errors);
      } else {
        setErrors({ _general: err.message || "No se pudo actualizar la contraseña" });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-b from-purple-50 to-pink-50 px-4">
      <div className="text-5xl mb-4">🔑</div>
      <form
        onSubmit={handleSubmit}
        noValidate
        className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 w-full max-w-sm space-y-4"
      >
        <h2 className="text-lg font-semibold text-gray-800">Recuperar contraseña</h2>
        <p className="text-gray-400 text-xs">
          Verificamos tu identidad con tu email y tu DNI (los mismos que usaste al registrarte).
        </p>

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
          <label className="block text-sm font-medium text-gray-600 mb-1">DNI</label>
          <input
            type="text"
            value={dni}
            onChange={(e) => setDni(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-300"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Contraseña nueva</label>
          <PasswordInput value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          {errors.new_password && <p className="text-red-500 text-xs mt-1">{errors.new_password}</p>}
        </div>

        {errors._general && <p className="text-red-500 text-xs">{errors._general}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg transition"
        >
          {submitting ? "Actualizando..." : "Actualizar contraseña"}
        </button>

        <button
          type="button"
          onClick={onBack}
          className="w-full text-gray-400 text-sm hover:text-gray-600"
        >
          ← Volver al login
        </button>
      </form>
    </div>
  );
}
