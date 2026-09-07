import { useState } from "react";
import { api } from "../api/client";

const PESO_MIN = 40;
const PESO_MAX = 200;

export default function WeightForm({ patients, weightRecords, onRecordCreated, showToast }) {
  const [patientId, setPatientId] = useState("");
  const [peso, setPeso] = useState("");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const pesoNum = Number(peso);
  const pesoFueraDeRango = peso !== "" && (Number.isNaN(pesoNum) || pesoNum < PESO_MIN || pesoNum > PESO_MAX);

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
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">Paciente</th>
              <th className="px-4 py-3 font-medium">Fecha</th>
              <th className="px-4 py-3 font-medium">Hora</th>
              <th className="px-4 py-3 font-medium">Peso (kg)</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {weightRecords.map((r) => (
              <tr key={r.id} className={r.alerta ? "bg-red-50" : ""}>
                <td className="px-4 py-3">{r.patient_name}</td>
                <td className="px-4 py-3">{r.fecha}</td>
                <td className="px-4 py-3">{r.hora}</td>
                <td className="px-4 py-3">{r.peso}</td>
                <td className="px-4 py-3">
                  {r.alerta && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                      ⚠ Alerta: aumento brusco
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {weightRecords.length === 0 && (
          <p className="text-center text-gray-400 py-8 text-sm">Sin registros.</p>
        )}
      </div>
    </div>
  );
}
