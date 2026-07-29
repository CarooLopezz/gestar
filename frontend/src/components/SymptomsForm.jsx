import { useEffect, useState } from "react";
import { api } from "../api/client";

const SINTOMAS = [
  "Dolor de cabeza intenso",
  "Visión borrosa",
  "Hinchazón",
  "Dolor abdominal",
  "Náuseas",
  "Mareos",
];

export default function SymptomsForm({ patient, onLogout, showToast }) {
  const [checked, setChecked] = useState([]);
  const [error, setError] = useState("");
  const [records, setRecords] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const loadHistory = async () => {
    try {
      setRecords(await api.getSymptoms(patient.dni));
    } catch (err) {
      showToast(err.message || "No se pudo cargar el historial", false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const toggle = (symptom) => {
    setChecked((prev) =>
      prev.includes(symptom) ? prev.filter((s) => s !== symptom) : [...prev, symptom]
    );
  };

  const handleSubmit = async () => {
    if (checked.length === 0) {
      setError("Seleccioná al menos un síntoma.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await api.createSymptomRecord({ patient_dni: patient.dni, symptoms: checked });
      setChecked([]);
      showToast("Síntomas registrados correctamente.");
      loadHistory();
    } catch (err) {
      setError(err.message || "No se pudo registrar");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gray-50 px-4 py-8 flex flex-col items-center">
      <div className="w-full max-w-lg flex justify-between items-center mb-6">
        <h1 className="text-lg font-semibold text-gray-800">
          Hola, {patient.nombre} 👋
        </h1>
        <button onClick={onLogout} className="text-sm text-gray-400 hover:text-gray-600">
          Salir
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 w-full max-w-lg mb-8">
        <h2 className="font-medium text-gray-700 mb-4">¿Cómo te sentís hoy?</h2>
        <div className="space-y-2 mb-4">
          {SINTOMAS.map((s) => (
            <label key={s} className="flex items-center gap-3 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={checked.includes(s)}
                onChange={() => toggle(s)}
                className="w-4 h-4 accent-pink-500"
              />
              {s}
            </label>
          ))}
        </div>

        {error && <p className="text-red-500 text-xs mb-3">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full bg-pink-500 hover:bg-pink-600 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg transition"
        >
          {submitting ? "Guardando..." : "Guardar"}
        </button>
      </div>

      <div className="w-full max-w-lg">
        <h3 className="font-medium text-gray-700 mb-3">Historial de síntomas</h3>
        <div className="space-y-3">
          {records.map((r) => (
            <div key={r.id} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
              <div className="flex justify-between text-xs text-gray-400 mb-2">
                <span>{r.fecha}</span>
                <span>{r.hora}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {r.symptoms.map((s) => (
                  <span
                    key={s}
                    className="px-2 py-1 rounded-full bg-pink-50 text-pink-600 text-xs font-medium"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          ))}
          {records.length === 0 && (
            <p className="text-center text-gray-400 py-6 text-sm">Sin registros.</p>
          )}
        </div>
      </div>
    </div>
  );
}
