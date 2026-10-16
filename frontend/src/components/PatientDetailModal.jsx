import { useEffect, useState } from "react";
import { api } from "../api/client";
import { formatFecha } from "../utils/fecha";

const GRAVEDAD_COLOR = {
  Leve: "bg-green-600 text-white",
  Moderado: "bg-amber-500 text-white",
  Severo: "bg-red-600 text-white",
};

const TRIMESTRE_NOMBRE = { 1: "1.er trimestre", 2: "2.º trimestre", 3: "3.er trimestre" };

// highlight (opcional): la alerta desde la que se abrió el resumen.
export default function PatientDetailModal({ patient, highlight, onClose, showToast }) {
  const [bpRecords, setBpRecords] = useState([]);
  const [weightRecords, setWeightRecords] = useState([]);
  const [symptomRecords, setSymptomRecords] = useState([]);
  const [agenda, setAgenda] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      api.getOwnBPRecords(patient.dni),
      api.getOwnWeightRecords(patient.dni),
      api.getSymptoms(patient.dni),
      api.getAgenda(patient.dni),
    ])
      .then(([bp, weight, symptoms, agendaData]) => {
        if (cancelled) return;
        setBpRecords(bp);
        setWeightRecords(weight);
        setSymptomRecords(symptoms);
        setAgenda(agendaData);
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
            <p className="text-sm text-gray-500">
              Fecha probable de parto: {formatFecha(patient.fecha_parto) || "No registrada"}
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
              {highlight && (
                <section className="rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-sm">
                  <p className="text-xs font-medium text-red-700 mb-0.5">⚠ Alerta</p>
                  <p className="text-gray-800">
                    {highlight.detalle} · {highlight.fecha} {highlight.hora}
                  </p>
                  <p className="text-xs text-gray-500">{highlight.motivo}</p>
                </section>
              )}

              <section>
                <h3 className="font-medium text-gray-700 mb-2">Embarazo</h3>
                {agenda?.embarazo ? (
                  <div className="text-sm space-y-2">
                    <p className="text-gray-700">
                      Semana {agenda.embarazo.semana} · {TRIMESTRE_NOMBRE[agenda.embarazo.trimestre]}
                    </p>
                    {agenda.estudios.some((e) => e.estado === "pendiente" || e.estado === "atrasado") ? (
                      <div>
                        <p className="text-gray-500 text-xs mb-1">Le falta hacerse:</p>
                        <ul className="space-y-1">
                          {agenda.estudios
                            .filter((e) => e.estado === "pendiente" || e.estado === "atrasado")
                            .map((e) => (
                              <li key={e.key} className={e.estado === "atrasado" ? "text-red-700" : "text-gray-700"}>
                                {e.nombre}
                                {e.estado === "atrasado" && <span className="text-xs"> · atrasado</span>}
                              </li>
                            ))}
                        </ul>
                      </div>
                    ) : (
                      <p className="text-green-700">Tiene al día los estudios de su semana.</p>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm">Sin fecha probable de parto cargada.</p>
                )}
              </section>

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
