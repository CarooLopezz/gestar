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

const GRAVEDADES = ["Leve", "Moderado", "Severo"];

const GRAVEDAD_COLOR = {
  Leve: "bg-yellow-50 text-yellow-700",
  Moderado: "bg-orange-50 text-orange-700",
  Severo: "bg-red-100 text-red-700",
};

export default function SymptomsFormNurse({ patients, symptomRecords, onRecordCreated, showToast }) {
  const [patientId, setPatientId] = useState("");
  const [selected, setSelected] = useState({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showAll, setShowAll] = useState(false);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const patient = patients.find((p) => p.id === Number(patientId));
    if (!patient) {
      setError("Seleccione una embarazada");
      return;
    }
    const symptoms = Object.entries(selected).map(([nombre, gravedad]) => ({ nombre, gravedad }));
    if (symptoms.length === 0) {
      setError("Seleccioná al menos un síntoma.");
      return;
    }

    setSubmitting(true);
    try {
      const record = await api.createSymptomRecord({
        patient_dni: patient.dni,
        symptoms,
      });
      onRecordCreated({ ...record, patient_name: `${patient.nombre} ${patient.apellido}` });
      setSelected({});
      showToast(
        record.alerta
          ? "Síntomas registrados. ⚠ Alerta: hay un síntoma marcado como Severo."
          : "Síntomas registrados correctamente."
      );
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
          <div className="space-y-3">
            {SINTOMAS.map((s) => (
              <div key={s}>
                <label className="flex items-center gap-3 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={s in selected}
                    onChange={() => toggle(s)}
                    className="w-4 h-4 accent-purple-600"
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
        {(showAll ? symptomRecords : symptomRecords.slice(0, 1)).map((r) => (
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
          <p className="text-center text-gray-400 py-8 text-sm bg-white rounded-2xl border border-gray-100">
            Sin registros.
          </p>
        )}
        {symptomRecords.length > 1 && (
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className="w-full flex items-center justify-center gap-1 text-sm text-purple-600 hover:text-purple-700 py-2"
          >
            <span className="text-base leading-none">{showAll ? "−" : "+"}</span>
            {showAll ? "Ver menos" : "Ver más"}
          </button>
        )}
      </div>
    </div>
  );
}
