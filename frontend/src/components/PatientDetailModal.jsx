import { useEffect, useState } from "react";
import { api } from "../api/client";

const GRAVEDAD_COLOR = {
  Leve: "bg-yellow-50 text-yellow-700",
  Moderado: "bg-orange-50 text-orange-700",
  Severo: "bg-red-100 text-red-700",
};

export default function PatientDetailModal({ patient, onClose, showToast }) {
  const [bpRecords, setBpRecords] = useState([]);
  const [weightRecords, setWeightRecords] = useState([]);
  const [symptomRecords, setSymptomRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      api.getOwnBPRecords(patient.dni),
      api.getOwnWeightRecords(patient.dni),
      api.getSymptoms(patient.dni),
    ])
      .then(([bp, weight, symptoms]) => {
        if (cancelled) return;
        setBpRecords(bp);
        setWeightRecords(weight);
        setSymptomRecords(symptoms);
      })
      .catch((err) => {
        if (!cancelled) showToast(err.message || "No se pudo cargar el detalle", false);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [patient.dni]);

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-lg w-full max-w-2xl max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-100 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              {patient.nombre} {patient.apellido}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              DNI {patient.dni} · {patient.email}
            </p>
            <span
              className={`inline-block mt-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                patient.estado === "Activo" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
              }`}
            >
              {patient.estado}
            </span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">
          {loading ? (
            <p className="text-center text-gray-400 text-sm py-8">Cargando historial...</p>
          ) : (
            <>
              <section>
                <h3 className="font-medium text-gray-700 mb-2">Presión arterial</h3>
                <div className="space-y-2">
                  {bpRecords.map((r) => (
                    <div
                      key={r.id}
                      className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
                        r.alerta ? "bg-red-50" : "bg-gray-50"
                      }`}
                    >
                      <span className="text-gray-500">
                        {r.fecha} {r.hora}
                      </span>
                      <span className="text-gray-700">
                        {r.sistolica}/{r.diastolica} mmHg
                      </span>
                    </div>
                  ))}
                  {bpRecords.length === 0 && (
                    <p className="text-gray-400 text-sm">Sin registros.</p>
                  )}
                </div>
              </section>

              <section>
                <h3 className="font-medium text-gray-700 mb-2">Peso</h3>
                <div className="space-y-2">
                  {weightRecords.map((r) => (
                    <div
                      key={r.id}
                      className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
                        r.alerta ? "bg-red-50" : "bg-gray-50"
                      }`}
                    >
                      <span className="text-gray-500">
                        {r.fecha} {r.hora}
                      </span>
                      <span className="text-gray-700">{r.peso} kg</span>
                    </div>
                  ))}
                  {weightRecords.length === 0 && (
                    <p className="text-gray-400 text-sm">Sin registros.</p>
                  )}
                </div>
              </section>

              <section>
                <h3 className="font-medium text-gray-700 mb-2">Síntomas</h3>
                <div className="space-y-2">
                  {symptomRecords.map((r) => (
                    <div key={r.id} className="rounded-lg px-3 py-2 text-sm bg-gray-50">
                      <p className="text-gray-500 text-xs mb-1">
                        {r.fecha} {r.hora}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {r.symptoms.map((s) => (
                          <span
                            key={s.nombre}
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              GRAVEDAD_COLOR[s.gravedad] || "bg-purple-50 text-purple-600"
                            }`}
                          >
                            {s.nombre} · {s.gravedad}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                  {symptomRecords.length === 0 && (
                    <p className="text-gray-400 text-sm">Sin registros.</p>
                  )}
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
