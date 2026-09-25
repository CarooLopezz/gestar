import { useMemo, useState } from "react";
import { api } from "../api/client";

const MENSAJE_MAX_LEN = 500;

export default function MessagesPanel({ messages, onMessageUpdated, showToast }) {
  const [expanded, setExpanded] = useState(() => new Set());
  const [drafts, setDrafts] = useState({});
  const [busyId, setBusyId] = useState(null);

  const groups = useMemo(() => {
    const map = new Map();
    messages.forEach((m) => {
      if (!map.has(m.patient_id)) {
        map.set(m.patient_id, { patient_id: m.patient_id, patient_name: m.patient_name, records: [] });
      }
      map.get(m.patient_id).records.push(m);
    });
    return Array.from(map.values());
  }, [messages]);

  const toggleExpanded = (patientId) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(patientId)) next.delete(patientId);
      else next.add(patientId);
      return next;
    });
  };

  const handleResponder = async (m) => {
    const respuesta = (drafts[m.id] || "").trim();
    if (!respuesta) {
      showToast("Escribí una respuesta antes de enviarla.", false);
      return;
    }
    if (respuesta.length > MENSAJE_MAX_LEN) {
      showToast(`La respuesta no puede superar los ${MENSAJE_MAX_LEN} caracteres.`, false);
      return;
    }
    setBusyId(m.id);
    try {
      const updated = await api.replyMessage(m.id, respuesta);
      onMessageUpdated(updated);
      setDrafts((prev) => ({ ...prev, [m.id]: "" }));
      showToast("Respuesta enviada, ya le llega a la paciente.");
    } catch (err) {
      showToast(err.message || "No se pudo enviar la respuesta", false);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="fade-in max-w-3xl">
      <h2 className="text-xl font-semibold text-gray-800 mb-1">Mensajes</h2>
      <p className="text-sm text-gray-400 mb-4">Consultas enviadas por las pacientes.</p>

      <div className="space-y-3">
        {groups.map((g) => {
          const [latest, ...previous] = g.records;
          const isOpen = expanded.has(g.patient_id);
          const isBusy = busyId === latest.id;
          return (
            <div key={g.patient_id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium text-gray-800">{g.patient_name}</p>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400">
                    {latest.fecha} {latest.hora}
                  </span>
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
              </div>

              <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700 whitespace-pre-wrap">
                {latest.mensaje}
              </div>

              {latest.respuesta ? (
                <div className="bg-purple-50 rounded-lg p-3 text-sm text-gray-700 mt-2">
                  <p className="text-xs font-medium text-purple-600 mb-1">Tu respuesta:</p>
                  {latest.respuesta}
                  <p className="text-xs text-gray-400 mt-2">
                    {latest.fecha_respuesta} {latest.hora_respuesta}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-2 mt-2">
                  <input
                    type="text"
                    value={drafts[latest.id] || ""}
                    onChange={(e) => setDrafts((prev) => ({ ...prev, [latest.id]: e.target.value }))}
                    placeholder="Escribir una respuesta..."
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                  />
                  <button
                    onClick={() => handleResponder(latest)}
                    disabled={isBusy}
                    className="text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-lg px-3 py-1.5 shrink-0"
                  >
                    Responder
                  </button>
                </div>
              )}

              {isOpen && (
                <div className="mt-3 pt-3 border-t border-gray-100 space-y-3">
                  {previous.map((m) => (
                    <div key={m.id}>
                      <p className="text-xs text-gray-400 mb-1">
                        {m.fecha} {m.hora}
                      </p>
                      <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700 whitespace-pre-wrap">
                        {m.mensaje}
                      </div>
                      {m.respuesta && (
                        <div className="bg-purple-50 rounded-lg p-3 text-sm text-gray-700 mt-2">
                          <p className="text-xs font-medium text-purple-600 mb-1">Tu respuesta:</p>
                          {m.respuesta}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {messages.length === 0 && (
          <p className="text-center text-gray-400 py-8 text-sm bg-white rounded-2xl border border-gray-100">
            No hay mensajes de pacientes.
          </p>
        )}
      </div>
    </div>
  );
}
