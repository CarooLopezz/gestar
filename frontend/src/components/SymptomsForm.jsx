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

const GRAVEDADES = ["Leve", "Moderado", "Severo"];

const GRAVEDAD_COLOR = {
  Leve: "bg-yellow-50 text-yellow-700",
  Moderado: "bg-orange-50 text-orange-700",
  Severo: "bg-red-100 text-red-700",
};

export default function SymptomsForm({ patient, showToast }) {
  const [selected, setSelected] = useState({});
  const [error, setError] = useState("");
  const [records, setRecords] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [showAll, setShowAll] = useState(false);

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
    setSelected((prev) => {
      const next = { ...prev };
      if (symptom in next) {
        delete next[symptom];
      } else {
        next[symptom] = "Leve";
      }
      return next;
    });
  };

  const setGravedad = (symptom, gravedad) => {
    setSelected((prev) => ({ ...prev, [symptom]: gravedad }));
  };

  const handleSubmit = async () => {
    const symptoms = Object.entries(selected).map(([nombre, gravedad]) => ({ nombre, gravedad }));
    if (symptoms.length === 0) {
      setError("Seleccioná al menos un síntoma.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const record = await api.createSymptomRecord({ patient_dni: patient.dni, symptoms });
      setSelected({});
      showToast(
        record.alerta
          ? "Síntomas registrados. ⚠ Alerta: hay un síntoma marcado como Severo."
          : "Síntomas registrados correctamente."
      );
      loadHistory();
    } catch (err) {
      setError(err.message || "No se pudo registrar");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 w-full max-w-lg mb-8">
        <h2 className="font-medium text-gray-700 mb-4">¿Cómo te sentís hoy?</h2>
        <div className="space-y-3 mb-4">
          {SINTOMAS.map((s) => (
            <div key={s}>
              <label className="flex items-center gap-3 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={s in selected}
                  onChange={() => toggle(s)}
                  className="w-4 h-4 accent-pink-500"
                />
                {s}
              </label>
              {s in selected && (
                <div className="flex gap-2 mt-2 ml-7">
                  {GRAVEDADES.map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGravedad(s, g)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium border transition ${
                        selected[s] === g
                          ? `${GRAVEDAD_COLOR[g]} border-transparent`
                          : "bg-white text-gray-400 border-gray-200"
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              )}
            </div>
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

      <div className="w-full max-w-lg mb-8">
        <h3 className="font-medium text-gray-700 mb-3">Historial de síntomas</h3>
        <div className="space-y-3">
          {(showAll ? records : records.slice(0, 1)).map((r) => (
            <div key={r.id} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
              <div className="flex justify-between text-xs text-gray-400 mb-2">
                <span>{r.fecha}</span>
                <span>{r.hora}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {r.symptoms.map((s) => (
                  <span
                    key={s.nombre}
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      GRAVEDAD_COLOR[s.gravedad] || "bg-pink-50 text-pink-600"
                    }`}
                  >
                    {s.nombre} · {s.gravedad}
                  </span>
                ))}
              </div>
            </div>
          ))}
          {records.length === 0 && (
            <p className="text-center text-gray-400 py-6 text-sm">Sin registros.</p>
          )}
          {records.length > 1 && (
            <button
              type="button"
              onClick={() => setShowAll((v) => !v)}
              className="w-full flex items-center justify-center gap-1 text-sm text-pink-600 hover:text-pink-700 py-2"
            >
              <span className="text-base leading-none">{showAll ? "−" : "+"}</span>
              {showAll ? "Ver menos" : "Ver más"}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
