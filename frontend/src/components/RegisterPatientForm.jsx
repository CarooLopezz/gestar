import { useState } from "react";
import { api } from "../api/client";

const emptyForm = { nombre: "", apellido: "", dni: "", email: "" };

export default function RegisterPatientForm({ onPatientCreated, showToast }) {
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
      const patient = await api.createPatient(form);
      onPatientCreated(patient);
      setForm(emptyForm);
      showToast("Usuario registrado correctamente");
    } catch (err) {
      if (err.data?.errors) {
        setErrors(err.data.errors);
      } else {
        showToast(err.message || "No se pudo registrar", false);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fade-in max-w-lg">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Registrar embarazada</h2>
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
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

        <Field label="DNI" error={errors.dni}>
          <input
            type="text"
            value={form.dni}
            onChange={handleChange("dni")}
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

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Estado</label>
          <input
            type="text"
            value="Activo"
            disabled
            className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 text-gray-400"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg transition"
        >
          {submitting ? "Registrando..." : "Registrar"}
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
