import { useMemo, useState } from "react";
import { api } from "../api/client";

export default function BloodPressureForm({ patients, bpRecords, onRecordCreated, showToast }) {
  const [patientId, setPatientId] = useState("");
  const [sistolica, setSistolica] = useState("");
  const [diastolica, setDiastolica] = useState("");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [expanded, setExpanded] = useState(() => new Set());

  const groups = useMemo(() => {
    const map = new Map();
    bpRecords.forEach((r) => {
      if (!map.has(r.patient_id)) {
        map.set(r.patient_id, { patient_id: r.patient_id, patient_name: r.patient_name, records: [] });
      }
      map.get(r.patient_id).records.push(r);
    });
    return Array.from(map.values());
  }, [bpRecords]);

  const toggleExpanded = (patientId) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(patientId)) next.delete(patientId);
      else next.add(patientId);
      return next;
    });
  };

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
      <div className="space-y-3">
        {groups.map((g) => {
          const [latest, ...previous] = g.records;
          const isOpen = expanded.has(g.patient_id);
          return (
            <div key={g.patient_id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-center justify-between">
                <p className="font-medium text-gray-800">{g.patient_name}</p>
                {previous.length > 0 && (
                  <button
                    type="button"
                    onClick={() => toggleExpanded(g.patient_id)}
                    className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700"
                  >
                    <span className="text-sm leading-none">{isOpen ? "−" : "+"}</span>
                    {isOpen ? "Ver menos" : "Ver más"}
                  </button>
                )}
              </div>

              <div className={`flex items-center justify-between mt-2 rounded-lg px-3 py-2 ${latest.alerta ? "bg-red-50" : "bg-gray-50"}`}>
                <span className="text-xs text-gray-500">
                  {latest.fecha} {latest.hora}
                </span>
                <span className="text-sm text-gray-700">
                  {latest.sistolica}/{latest.diastolica} mmHg
                </span>
                {latest.alerta && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                    ⚠ Fuera de rango
                  </span>
                )}
              </div>

              {isOpen && (
                <div className="mt-2 space-y-2">
                  {previous.map((r) => (
                    <div
                      key={r.id}
                      className={`flex items-center justify-between rounded-lg px-3 py-2 ${r.alerta ? "bg-red-50" : "bg-gray-50"}`}
                    >
                      <span className="text-xs text-gray-500">
                        {r.fecha} {r.hora}
                      </span>
                      <span className="text-sm text-gray-700">
                        {r.sistolica}/{r.diastolica} mmHg
                      </span>
                      {r.alerta && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                          ⚠ Fuera de rango
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {bpRecords.length === 0 && (
          <p className="text-center text-gray-400 py-8 text-sm bg-white rounded-2xl border border-gray-100">
            Sin registros.
          </p>
        )}
      </div>
    </div>
  );
}
