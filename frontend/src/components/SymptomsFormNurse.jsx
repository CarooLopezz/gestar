import { useState } from "react";
import { api } from "../api/client";

const SINTOMAS = [
  "Dolor de cabeza intenso",
  "Visión borrosa",
  "Hinchazón",
  "Dolor abdominal",
  "Náuseas",
  "Mareos",
];

export default function SymptomsFormNurse({ patients, symptomRecords, onRecordCreated, showToast }) {
  const [patientId, setPatientId] = useState("");
  const [checked, setChecked] = useState([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const toggle = (symptom) => {
    setChecked((prev) =>
      prev.includes(symptom) ? prev.filter((s) => s !== symptom) : [...prev, symptom]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const patient = patients.find((p) => p.id === Number(patientId));
    if (!patient) {
      setError("Seleccione una embarazada");
      return;
    }
    if (checked.length === 0) {
      setError("Seleccioná al menos un síntoma.");
      return;
    }

    setSubmitting(true);
    try {
      const record = await api.createSymptomRecord({
        patient_dni: patient.dni,
        symptoms: checked,
      });
      onRecordCreated({ ...record, patient_name: `${patient.nombre} ${patient.apellido}` });
      setChecked([]);
      showToast("Síntomas registrados correctamente.");
    } catch (err) {
      setError(err.message || "No se pudo registrar");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fade-in max-w-3xl">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Registrar síntomas</h2>

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
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">Síntomas</label>
          <div className="space-y-2">
            {SINTOMAS.map((s) => (
              <label key={s} className="flex items-center gap-3 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={checked.includes(s)}
                  onChange={() => toggle(s)}
                  className="w-4 h-4 accent-purple-600"
                />
                {s}
              </label>
            ))}
          </div>
        </div>

        {error && <p className="text-red-500 text-xs">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg transition"
        >
          {submitting ? "Guardando..." : "Guardar"}
        </button>
      </form>

      <h3 className="text-lg font-semibold text-gray-800 mb-3">Historial de síntomas</h3>
      <div className="space-y-3">
        {symptomRecords.map((r) => (
          <div key={r.id} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="flex justify-between text-xs text-gray-400 mb-2">
              <span>{r.patient_name}</span>
              <span>
                {r.fecha} {r.hora}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {r.symptoms.map((s) => (
                <span
                  key={s}
                  className="px-2 py-1 rounded-full bg-purple-50 text-purple-600 text-xs font-medium"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        ))}
        {symptomRecords.length === 0 && (
          <p className="text-center text-gray-400 py-8 text-sm bg-white rounded-2xl border border-gray-100">
            Sin registros.
          </p>
        )}
      </div>
    </div>
  );
}
