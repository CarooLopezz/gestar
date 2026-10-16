import { useState } from "react";
import { api } from "../api/client";
import { formatFecha } from "../utils/fecha";

// Diseño de tarjetas basado en la sección Agenda que hizo LARA (rama GT-119).

const TIPOS = [
  "Control prenatal",
  "Control de presión",
  "Ecografía",
  "Análisis de laboratorio",
  "Vacunación",
  "Otro",
];

const emptyForm = { patient_id: "", fecha: "", hora: "", tipo: TIPOS[0] };

function hoyISO() {
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mes}-${dia}`;
}

export default function Agenda({ patients, appointments, onAppointmentCreated, onAppointmentUpdated, onAppointmentDeleted, showToast }) {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const hoy = hoyISO();
  const pendientes = appointments.filter((a) => a.estado === "Pendiente");
  const realizados = appointments.filter((a) => a.estado === "Realizado").slice().reverse();
  const activePatients = patients.filter((p) => p.estado === "Activo");

  const handleChange = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setSubmitting(true);
    try {
      const appointment = await api.createAppointment({
        ...form,
        patient_id: form.patient_id ? Number(form.patient_id) : null,
      });
      onAppointmentCreated(appointment);
      setForm(emptyForm);
      showToast("Turno agendado correctamente");
    } catch (err) {
      if (err.data?.errors) {
        setErrors(err.data.errors);
      } else {
        showToast(err.message || "No se pudo agendar el turno", false);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleComplete = async (id) => {
    setBusyId(id);
    try {
      onAppointmentUpdated(await api.completeAppointment(id));
    } catch (err) {
      showToast(err.message || "No se pudo actualizar el turno", false);
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id) => {
    setBusyId(id);
    try {
      await api.deleteAppointment(id);
      onAppointmentDeleted(id);
      showToast("Turno cancelado");
    } catch (err) {
      showToast(err.message || "No se pudo cancelar el turno", false);
    } finally {
      setBusyId(null);
      setConfirmDeleteId(null);
    }
  };

  const AppointmentCard = ({ appointment }) => {
    const isBusy = busyId === appointment.id;
    const vencido = appointment.estado === "Pendiente" && appointment.fecha < hoy;
    const esHoy = appointment.fecha === hoy;
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-semibold text-gray-800">{appointment.patient_name}</h3>
            <p className="text-sm text-gray-500 mt-1">{appointment.tipo}</p>
          </div>
          <span
            className={`shrink-0 text-xs font-medium px-3 py-1 rounded-full ${
              appointment.estado === "Realizado"
                ? "bg-green-50 text-green-700"
                : vencido
                ? "bg-red-50 text-red-700"
                : "bg-yellow-50 text-yellow-700"
            }`}
          >
            {vencido ? "Vencido" : appointment.estado}
          </span>
        </div>

        <div className="flex items-center gap-6 mt-4 text-sm text-gray-600">
          <span>
            📅 {formatFecha(appointment.fecha)}
            {esHoy && <span className="ml-1 font-medium text-purple-700">(hoy)</span>}
          </span>
          <span>🕐 {appointment.hora}</span>
        </div>

        {appointment.estado === "Pendiente" && (
          <div className="flex items-center gap-4 mt-4">
            <button
              onClick={() => handleComplete(appointment.id)}
              disabled={isBusy}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-60"
            >
              Marcar como realizado
            </button>
            {confirmDeleteId === appointment.id ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">¿Cancelar turno?</span>
                <button
                  onClick={() => handleDelete(appointment.id)}
                  disabled={isBusy}
                  className="text-xs font-medium text-red-600 hover:text-red-800 disabled:opacity-50"
                >
                  Sí
                </button>
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  className="text-xs font-medium text-gray-400 hover:text-gray-600"
                >
                  No
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDeleteId(appointment.id)}
                className="text-sm font-medium text-gray-400 hover:text-red-600"
              >
                Cancelar turno
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fade-in max-w-3xl">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Turnos</h2>
        <p className="text-sm text-gray-500 mt-1">Próximos controles y consultas de las embarazadas.</p>
      </div>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4 max-w-lg mb-8"
      >
        <h3 className="font-medium text-gray-700">Nuevo turno</h3>

        <Field label="Embarazada" error={errors.patient_id}>
          <select
            value={form.patient_id}
            onChange={handleChange("patient_id")}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-300"
          >
            <option value="">-- Seleccione --</option>
            {activePatients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre} {p.apellido}
              </option>
            ))}
          </select>
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Fecha" error={errors.fecha}>
            <input
              type="date"
              min={hoy}
              value={form.fecha}
              onChange={handleChange("fecha")}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-300"
            />
          </Field>
          <Field label="Hora" error={errors.hora}>
            <input
              type="time"
              value={form.hora}
              onChange={handleChange("hora")}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-300"
            />
          </Field>
        </div>

        <Field label="Tipo de control" error={errors.tipo}>
          <select
            value={form.tipo}
            onChange={handleChange("tipo")}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-300"
          >
            {TIPOS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </Field>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg transition"
        >
          {submitting ? "Guardando..." : "Agendar turno"}
        </button>
      </form>

      <h3 className="font-medium text-gray-700 mb-3">Próximos turnos</h3>
      {pendientes.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-8 text-center mb-8">
          <p className="text-gray-500">No hay turnos pendientes.</p>
        </div>
      ) : (
        <div className="space-y-4 mb-8">
          {pendientes.map((a) => (
            <AppointmentCard key={a.id} appointment={a} />
          ))}
        </div>
      )}

      {realizados.length > 0 && (
        <>
          <h3 className="font-medium text-gray-700 mb-3">Realizados</h3>
          <div className="space-y-4">
            {realizados.map((a) => (
              <AppointmentCard key={a.id} appointment={a} />
            ))}
          </div>
        </>
      )}
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
