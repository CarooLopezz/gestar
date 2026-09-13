import { useState } from "react";
import { api } from "../api/client";

export default function BloodPressureForm({ patients, bpRecords, onRecordCreated, showToast }) {
  const [patientId, setPatientId] = useState("");
  const [sistolica, setSistolica] = useState("");
  const [diastolica, setDiastolica] = useState("");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setSubmitting(true);
    try {
      const record = await api.createBPRecord({
        patient_id: patientId ? Number(patientId) : null,
        sistolica,
        diastolica,
      });
      onRecordCreated(record);
      setSistolica("");
      setDiastolica("");
      showToast(
        record.alerta
          ? "Presión registrada. ⚠ Está fuera de rango seguro, se generó una alerta."
          : "Presión registrada correctamente"
      );
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
    <div className="fade-in max-w-3xl">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Registrar presión arterial</h2>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4 max-w-lg mb-8"
      >
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Seleccionar embarazada</label>
          <select
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-300"
          >
            <option value="">-- Seleccione --</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre} {p.apellido}
              </option>
            ))}
          </select>
          {errors.patient_id && <p className="text-red-500 text-xs mt-1">{errors.patient_id}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Sistólica (la máxima)</label>
            <input
              type="number"
              value={sistolica}
              onChange={(e) => setSistolica(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-300"
            />
            {errors.sistolica && <p className="text-red-500 text-xs mt-1">{errors.sistolica}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Diastólica (la mínima)</label>
            <input
              type="number"
              value={diastolica}
              onChange={(e) => setDiastolica(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-300"
            />
            {errors.diastolica && <p className="text-red-500 text-xs mt-1">{errors.diastolica}</p>}
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg transition"
        >
          {submitting ? "Guardando..." : "Guardar"}
        </button>
      </form>

      <h3 className="text-lg font-semibold text-gray-800 mb-3">Historial de presión arterial</h3>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">Paciente</th>
              <th className="px-4 py-3 font-medium">Fecha</th>
              <th className="px-4 py-3 font-medium">Hora</th>
              <th className="px-4 py-3 font-medium">Sistólica</th>
              <th className="px-4 py-3 font-medium">Diastólica</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(showAll ? bpRecords : bpRecords.slice(0, 1)).map((r) => (
              <tr key={r.id} className={r.alerta ? "bg-red-50" : ""}>
                <td className="px-4 py-3">{r.patient_name}</td>
                <td className="px-4 py-3">{r.fecha}</td>
                <td className="px-4 py-3">{r.hora}</td>
                <td className="px-4 py-3">{r.sistolica}</td>
                <td className="px-4 py-3">{r.diastolica}</td>
                <td className="px-4 py-3">
                  {r.alerta && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                      ⚠ Fuera de rango
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {bpRecords.length === 0 && (
          <p className="text-center text-gray-400 py-8 text-sm">Sin registros.</p>
        )}
        {bpRecords.length > 1 && (
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className="w-full flex items-center justify-center gap-1 text-sm text-purple-600 hover:text-purple-700 py-3 border-t border-gray-100"
          >
            <span className="text-base leading-none">{showAll ? "−" : "+"}</span>
            {showAll ? "Ver menos" : "Ver más"}
          </button>
        )}
      </div>
    </div>
  );
}
