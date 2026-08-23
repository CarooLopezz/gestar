import { useEffect, useState } from "react";
import { api } from "../api/client";

export default function RecordBloodPressure({ patient, showToast }) {
  const [sistolica, setSistolica] = useState("");
  const [diastolica, setDiastolica] = useState("");
  const [errors, setErrors] = useState({});
  const [records, setRecords] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const loadHistory = async () => {
    try {
      setRecords(await api.getOwnBPRecords(patient.dni));
    } catch (err) {
      showToast(err.message || "No se pudo cargar el historial", false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setSubmitting(true);
    try {
      await api.createOwnBPRecord({
        patient_dni: patient.dni,
        sistolica,
        diastolica,
      });
      setSistolica("");
      setDiastolica("");
      showToast("Presión registrada correctamente.");
      loadHistory();
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
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 w-full max-w-lg mb-8">
        <h2 className="font-medium text-gray-700 mb-4">Registrar mi presión arterial</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Sistólica</label>
              <input
                type="number"
                value={sistolica}
                onChange={(e) => setSistolica(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-300"
              />
              {errors.sistolica && <p className="text-red-500 text-xs mt-1">{errors.sistolica}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Diastólica</label>
              <input
                type="number"
                value={diastolica}
                onChange={(e) => setDiastolica(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-300"
              />
              {errors.diastolica && <p className="text-red-500 text-xs mt-1">{errors.diastolica}</p>}
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-pink-500 hover:bg-pink-600 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg transition"
          >
            {submitting ? "Guardando..." : "Guardar"}
          </button>
        </form>
      </div>

      <div className="w-full max-w-lg mb-8">
        <h3 className="font-medium text-gray-700 mb-3">Historial de presión arterial</h3>
        <div className="space-y-3">
          {records.map((r) => (
            <div key={r.id} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
              <div className="flex justify-between text-xs text-gray-400 mb-2">
                <span>{r.fecha}</span>
                <span>{r.hora}</span>
              </div>
              <p className="text-sm text-gray-600">
                {r.sistolica} / {r.diastolica} mmHg
              </p>
            </div>
          ))}
          {records.length === 0 && (
            <p className="text-center text-gray-400 py-6 text-sm">Sin registros.</p>
          )}
        </div>
      </div>
    </>
  );
}
