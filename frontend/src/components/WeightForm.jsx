import { useMemo, useState } from "react";
import { api } from "../api/client";

const PESO_MIN = 40;
const PESO_MAX = 200;

export default function WeightForm({ patients, weightRecords, onRecordCreated, showToast }) {
  const [patientId, setPatientId] = useState("");
  const [peso, setPeso] = useState("");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [expanded, setExpanded] = useState(() => new Set());

  const pesoNum = Number(peso);
  const pesoFueraDeRango = peso !== "" && (Number.isNaN(pesoNum) || pesoNum < PESO_MIN || pesoNum > PESO_MAX);

  // weightRecords ya viene ordenado del mas reciente al mas viejo; agrupar
  // por paciente conserva ese orden dentro de cada grupo.
  const groups = useMemo(() => {
    const map = new Map();
    weightRecords.forEach((r) => {
      if (!map.has(r.patient_id)) {
        map.set(r.patient_id, { patient_id: r.patient_id, patient_name: r.patient_name, records: [] });
      }
      map.get(r.patient_id).records.push(r);
    });
    return Array.from(map.values());
  }, [weightRecords]);

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
      const record = await api.createWeightRecord({
        patient_id: patientId ? Number(patientId) : null,
        peso,
      });
      onRecordCreated(record);
      setPeso("");
      showToast(
        record.alerta
          ? "Peso registrado. ⚠ Alerta: aumento brusco."
          : "Peso registrado correctamente"
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
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Registrar peso</h2>

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

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Peso (kg)</label>
          <input
            type="number"
            step="0.1"
            value={peso}
            onChange={(e) => setPeso(e.target.value)}
            className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${
              pesoFueraDeRango
                ? "border-red-400 bg-red-50 text-red-700 focus:ring-red-300"
                : "border-gray-200 focus:ring-purple-300"
            }`}
          />
          {pesoFueraDeRango && !errors.peso && (
            <p className="text-red-500 text-xs mt-1">
              Debe estar entre {PESO_MIN} y {PESO_MAX} kg
            </p>
          )}
          {errors.peso && <p className="text-red-500 text-xs mt-1">{errors.peso}</p>}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg transition"
        >
          {submitting ? "Guardando..." : "Guardar"}
        </button>
      </form>

      <h3 className="text-lg font-semibold text-gray-800 mb-3">Historial de peso</h3>
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
                <span className="text-sm text-gray-700">{latest.peso} kg</span>
                {latest.alerta && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                    ⚠ Alerta: aumento brusco
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
                      <span className="text-sm text-gray-700">{r.peso} kg</span>
                      {r.alerta && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                          ⚠ Alerta: aumento brusco
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {weightRecords.length === 0 && (
          <p className="text-center text-gray-400 py-8 text-sm bg-white rounded-2xl border border-gray-100">
            Sin registros.
          </p>
        )}
      </div>
    </div>
  );
}
