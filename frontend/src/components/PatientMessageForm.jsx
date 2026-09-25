import { useEffect, useState } from "react";
import { api } from "../api/client";

const MENSAJE_MAX_LEN = 500;

export default function PatientMessageForm({ patient, showToast }) {
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [records, setRecords] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const loadHistory = async () => {
    try {
      setRecords(await api.getOwnMessages(patient.dni));
    } catch (err) {
      showToast(err.message || "No se pudo cargar el historial", false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const text = mensaje.trim();
    if (!text) {
      setError("Escribí un mensaje antes de enviarlo.");
      return;
    }
    if (text.length > MENSAJE_MAX_LEN) {
      setError(`El mensaje no puede superar los ${MENSAJE_MAX_LEN} caracteres.`);
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await api.createOwnMessage({ patient_dni: patient.dni, mensaje: text });
      setMensaje("");
      showToast("Mensaje enviado a tu enfermera.");
      loadHistory();
    } catch (err) {
      setError(err.data?.errors?.mensaje || err.message || "No se pudo enviar el mensaje");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 w-full max-w-lg mb-8">
        <h2 className="font-medium text-gray-700 mb-1">Enviar mensaje a tu enfermera</h2>
        <p className="text-sm text-gray-400 mb-4">Escribí tu consulta o lo que necesites contarle.</p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <textarea
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            placeholder="Escribí tu mensaje..."
            maxLength={MENSAJE_MAX_LEN}
            rows={4}
            className="w-full border border-gray-200 rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-pink-300"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">
              {mensaje.length}/{MENSAJE_MAX_LEN} caracteres
            </span>
            <button
              type="submit"
              disabled={submitting}
              className="bg-pink-500 hover:bg-pink-600 disabled:opacity-60 text-white font-medium px-5 py-2 rounded-lg transition"
            >
              {submitting ? "Enviando..." : "Enviar mensaje"}
            </button>
          </div>
          {error && <p className="text-red-500 text-xs">{error}</p>}
        </form>
      </div>

      <div className="w-full max-w-lg mb-8">
        <h3 className="font-medium text-gray-700 mb-3">Mis mensajes</h3>
        <div className="space-y-3">
          {(showAll ? records : records.slice(0, 1)).map((r) => (
            <div key={r.id} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
              <div className="flex justify-between text-xs text-gray-400 mb-2">
                <span>{r.fecha}</span>
                <span>{r.hora}</span>
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{r.mensaje}</p>
              {r.respuesta ? (
                <div className="bg-pink-50 rounded-lg p-3 text-sm text-gray-700 mt-3">
                  <p className="text-xs font-medium text-pink-600 mb-1">💬 Respuesta de tu enfermera:</p>
                  {r.respuesta}
                  <p className="text-xs text-gray-400 mt-2">
                    {r.fecha_respuesta} {r.hora_respuesta}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-gray-400 mt-2">Todavía sin respuesta.</p>
              )}
            </div>
          ))}
          {records.length === 0 && (
            <p className="text-center text-gray-400 py-6 text-sm">Sin mensajes enviados.</p>
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
