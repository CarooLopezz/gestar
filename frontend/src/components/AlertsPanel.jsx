import { useMemo, useState } from "react";
import { api } from "../api/client";

// Paleta cíclica para diferenciar visualmente a qué paciente pertenece cada
// alerta (no indica gravedad, solo agrupa filas de la misma persona).
const COLORS = [
  { row: "bg-red-100", border: "border-red-500", dot: "bg-red-500" },
  { row: "bg-orange-100", border: "border-orange-500", dot: "bg-orange-500" },
  { row: "bg-amber-100", border: "border-amber-500", dot: "bg-amber-500" },
  { row: "bg-lime-100", border: "border-lime-600", dot: "bg-lime-600" },
  { row: "bg-teal-100", border: "border-teal-500", dot: "bg-teal-500" },
  { row: "bg-blue-100", border: "border-blue-500", dot: "bg-blue-500" },
  { row: "bg-purple-100", border: "border-purple-500", dot: "bg-purple-500" },
  { row: "bg-pink-100", border: "border-pink-500", dot: "bg-pink-500" },
];

export default function AlertsPanel({ alerts, onAlertUpdated, onAlertDismissed, showToast }) {
  const [drafts, setDrafts] = useState({});
  const [busyKey, setBusyKey] = useState(null);

  const colorByPatient = useMemo(() => {
    const map = new Map();
    alerts.forEach((a) => {
      if (!map.has(a.patient_name)) {
        map.set(a.patient_name, COLORS[map.size % COLORS.length]);
      }
    });
    return map;
  }, [alerts]);

  const keyOf = (a) => `${a.tipo}-${a.id}`;

  const handleResponder = async (a) => {
    const key = keyOf(a);
    const mensaje = (drafts[key] || "").trim();
    if (!mensaje) {
      showToast("Escribí una respuesta antes de enviarla.", false);
      return;
    }
    setBusyKey(key);
    try {
      const updated = await api.respondAlert(a.tipo, a.id, mensaje);
      onAlertUpdated({ ...a, respuesta: updated.respuesta });
      setDrafts((prev) => ({ ...prev, [key]: "" }));
      showToast("Respuesta enviada, ya le llega a la paciente.");
    } catch (err) {
      showToast(err.message || "No se pudo enviar la respuesta", false);
    } finally {
      setBusyKey(null);
    }
  };

  const handleDescartar = async (a) => {
    const key = keyOf(a);
    setBusyKey(key);
    try {
      await api.dismissAlert(a.tipo, a.id);
      onAlertDismissed(a);
      showToast("Alerta descartada");
    } catch (err) {
      showToast(err.message || "No se pudo descartar la alerta", false);
    } finally {
      setBusyKey(null);
    }
  };

  return (
    <div className="fade-in">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Alertas</h2>

      <div className="space-y-3">
        {alerts.map((a) => {
          const color = colorByPatient.get(a.patient_name) || COLORS[0];
          const key = keyOf(a);
          const isBusy = busyKey === key;
          return (
            <div key={key} className={`rounded-xl border-l-4 ${color.border} ${color.row} shadow-sm p-4`}>
              <div className="flex items-center justify-between mb-2 gap-2">
                <span className="inline-flex items-center gap-2 font-medium text-gray-800">
                  <span className={`w-2.5 h-2.5 rounded-full ${color.dot}`} />
                  {a.patient_name}
                </span>
                <span className="text-xs text-gray-500 shrink-0">
                  {a.fecha} {a.hora}
                </span>
              </div>
              <p className="text-sm text-gray-700 mb-2">{a.detalle}</p>
              <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-red-600 text-white mb-3">
                ⚠ {a.motivo}
              </span>

              {a.respuesta ? (
                <div className="bg-white/70 rounded-lg p-3 text-sm text-gray-700 mb-2">
                  <p className="text-xs font-medium text-gray-500 mb-1">💬 Tu respuesta a la paciente:</p>
                  {a.respuesta}
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-2 mb-2">
                  <input
                    type="text"
                    value={drafts[key] || ""}
                    onChange={(e) => setDrafts((prev) => ({ ...prev, [key]: e.target.value }))}
                    placeholder="Escribir una respuesta para la paciente..."
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-300"
                  />
                  <button
                    onClick={() => handleResponder(a)}
                    disabled={isBusy}
                    className="text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-lg px-3 py-1.5 shrink-0"
                  >
                    Responder
                  </button>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={() => handleDescartar(a)}
                  disabled={isBusy}
                  className="text-xs font-medium text-gray-500 hover:text-gray-700 disabled:opacity-50"
                >
                  Descartar alerta
                </button>
              </div>
            </div>
          );
        })}
        {alerts.length === 0 && (
          <p className="text-center text-gray-400 py-8 text-sm bg-white rounded-2xl border border-gray-100">
            Sin alertas activas.
          </p>
        )}
      </div>
    </div>
  );
}
