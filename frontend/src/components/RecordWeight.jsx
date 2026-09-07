import { useEffect, useState } from "react";
import { api } from "../api/client";

const PESO_MIN = 40;
const PESO_MAX = 200;

export default function RecordWeight({ patient, showToast }) {
  const [peso, setPeso] = useState("");
  const [errors, setErrors] = useState({});
  const [records, setRecords] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const pesoNum = Number(peso);
  const pesoFueraDeRango = peso !== "" && (Number.isNaN(pesoNum) || pesoNum < PESO_MIN || pesoNum > PESO_MAX);

  const loadHistory = async () => {
    try {
      setRecords(await api.getOwnWeightRecords(patient.dni));
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
      const record = await api.createOwnWeightRecord({ patient_dni: patient.dni, peso });
      setPeso("");
      showToast(
        record.alerta
          ? "Peso registrado. ⚠ Alerta: aumento brusco, le avisamos a tu enfermera."
          : "Peso registrado correctamente."
      );
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
        <h2 className="font-medium text-gray-700 mb-4">Registrar mi peso</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
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
                  : "border-gray-200 focus:ring-pink-300"
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
            className="w-full bg-pink-500 hover:bg-pink-600 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg transition"
          >
            {submitting ? "Guardando..." : "Guardar"}
          </button>
        </form>
      </div>

      <div className="w-full max-w-lg mb-8">
        <h3 className="font-medium text-gray-700 mb-3">Historial de peso</h3>
        <div className="space-y-3">
          {records.map((r) => (
            <div key={r.id} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
              <div className="flex justify-between text-xs text-gray-400 mb-2">
                <span>{r.fecha}</span>
                <span>{r.hora}</span>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">{r.peso} kg</p>
                {r.alerta && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                    ⚠ Alerta: aumento brusco
                  </span>
                )}
              </div>
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
