import { useMemo, useState } from "react";
import MisPacientesToggle from "./MisPacientesToggle";
import { coincideBusqueda } from "../utils/busqueda";

const TRIMESTRE = { 1: "1.er trimestre", 2: "2.º trimestre", 3: "3.er trimestre" };

function hoyISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function Numero({ titulo, valor, alerta, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`text-left rounded-xl border p-4 transition hover:shadow-sm ${
        alerta ? "bg-red-50 border-red-100" : "bg-white border-gray-100"
      }`}
    >
      <p className="text-xs font-medium text-gray-500">{titulo}</p>
      <p className={`text-3xl font-semibold mt-1 tabular-nums ${alerta ? "text-red-700" : "text-gray-800"}`}>{valor}</p>
    </button>
  );
}

// Primera pantalla de la enfermera: cómo está el día y cada embarazada activa.
export default function PanelGeneral({ patients, alerts, monitoring, appointments, currentNurseId, onVerFicha, onIr }) {
  const [soloMias, setSoloMias] = useState(false);
  const [busqueda, setBusqueda] = useState("");

  const alertasPorDni = useMemo(() => {
    const map = new Map();
    alerts.filter((a) => !a.respuesta).forEach((a) => map.set(a.patient_dni, (map.get(a.patient_dni) || 0) + 1));
    return map;
  }, [alerts]);

  const fichas = monitoring
    .filter((m) => !soloMias || m.nurse_id === currentNurseId)
    .map((m) => ({ m, patient: patients.find((p) => p.id === m.patient_id) }))
    .filter(({ m, patient }) => coincideBusqueda(patient || { nombre: m.patient_name }, busqueda));
  const activas = patients.filter((p) => p.estado === "Activo").length;
  const sinResponder = alerts.filter((a) => !a.respuesta).length;
  const sinControl = monitoring.filter((m) => m.necesita_control).length;
  const conAtrasados = monitoring.filter((m) => m.estudios_faltantes.some((e) => e.estado === "atrasado")).length;
  const turnosHoy = appointments.filter((t) => t.estado === "Pendiente" && t.fecha === hoyISO()).length;

  return (
    <div className="fade-in max-w-5xl space-y-6">
      <h2 className="text-xl font-semibold text-gray-800">Panel</h2>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Numero titulo="Embarazadas activas" valor={activas} onClick={() => onIr("list")} />
        <Numero titulo="Alertas sin responder" valor={sinResponder} alerta={sinResponder > 0} onClick={() => onIr("alerts")} />
        <Numero titulo="Sin controlarse" valor={sinControl} alerta={sinControl > 0} onClick={() => onIr("monitoring")} />
        <Numero titulo="Con estudios atrasados" valor={conAtrasados} onClick={() => onIr("monitoring")} />
        <Numero titulo="Turnos de hoy" valor={turnosHoy} onClick={() => onIr("agenda")} />
      </div>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-medium text-gray-700">Embarazadas</h3>
          <MisPacientesToggle checked={soloMias} onChange={setSoloMias} />
        </div>

        <input
          type="search"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre, apellido o DNI..."
          aria-label="Buscar embarazada"
          className="w-full sm:max-w-sm border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-300"
        />

        {fichas.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs font-medium text-gray-500">
                <tr>
                  <th className="px-4 py-3">Embarazada</th>
                  <th className="px-4 py-3">Embarazo</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {fichas.map(({ m, patient }) => {
                  const alertas = alertasPorDni.get(m.patient_dni) || 0;
                  const atrasados = m.estudios_faltantes.filter((e) => e.estado === "atrasado").length;
                  return (
                    <tr key={m.patient_id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800">{m.patient_name}</p>
                        {patient && <p className="text-xs text-gray-400">DNI {patient.dni}</p>}
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {m.embarazo
                          ? `Semana ${m.embarazo.semana} · ${TRIMESTRE[m.embarazo.trimestre]}`
                          : "Sin fecha probable de parto"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1.5 text-xs font-medium">
                          {alertas > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-700">
                              {alertas} {alertas === 1 ? "alerta" : "alertas"}
                            </span>
                          )}
                          {m.necesita_control && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                              {m.dias_sin_control === null ? "Nunca cargó datos" : `Sin control hace ${m.dias_sin_control} d`}
                            </span>
                          )}
                          {atrasados > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-orange-50 text-orange-700">
                              {atrasados} {atrasados === 1 ? "estudio atrasado" : "estudios atrasados"}
                            </span>
                          )}
                          {alertas === 0 && !m.necesita_control && atrasados === 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-green-50 text-green-700">Al día</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {patient && (
                          <button
                            onClick={() => onVerFicha(patient)}
                            className="text-sm font-medium text-purple-600 hover:text-purple-800"
                          >
                            Ver ficha →
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {fichas.length === 0 && (
          <p className="text-center text-gray-400 py-8 text-sm bg-white rounded-2xl border border-gray-100">
            {busqueda.trim()
              ? "Ninguna embarazada coincide con la búsqueda."
              : soloMias
              ? "No tenés embarazadas asignadas."
              : "No hay embarazadas activas."}
          </p>
        )}
      </section>
    </div>
  );
}
