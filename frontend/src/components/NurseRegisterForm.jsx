import { useState } from "react";
import { api } from "../api/client";

const emptyForm = { nombre: "", apellido: "", email: "", password: "" };

export default function NurseRegisterForm({ onRegistered, onBack, onGoToLogin }) {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setSubmitting(true);
    try {
      const nurse = await api.registerNurse(form);
      onRegistered(nurse);
    } catch (err) {
      if (err.data?.errors) {
        setErrors(err.data.errors);
      } else {
        setErrors({ _general: err.message || "No se pudo registrar" });
      }
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
        <Field label="Nombre" error={errors.nombre}>
          <input
            type="text"
            value={form.nombre}
            onChange={handleChange("nombre")}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-300"
          />
        </Field>

        <Field label="Apellido" error={errors.apellido}>
          <input
            type="text"
            value={form.apellido}
            onChange={handleChange("apellido")}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-300"
          />
        </Field>

        <Field label="Email" error={errors.email}>
          <input
            type="email"
            value={form.email}
            onChange={handleChange("email")}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-300"
          />
        </Field>

        <Field label="Contraseña" error={errors.password}>
          <input
            type="password"
            value={form.password}
            onChange={handleChange("password")}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-300"
          />
        </Field>

        {errors._general && <p className="text-red-500 text-xs">{errors._general}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg transition"
        >
          {submitting ? "Registrando..." : "Registrarme"}
        </button>

        <button
          type="button"
          onClick={onGoToLogin}
          className="w-full text-purple-500 text-sm hover:text-purple-700"
        >
          ¿Ya tenés cuenta? Ingresá
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

function Field({ label, error, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-600 mb-1">{label}</label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}
