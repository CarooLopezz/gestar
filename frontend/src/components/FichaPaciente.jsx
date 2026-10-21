import { useEffect, useState } from "react";
import { api } from "../api/client";
import { formatFecha } from "../utils/fecha";
import GraficoLinea from "./GraficoLinea";

// Mismos límites que usa el backend para marcar alerta de presión (bp.py).
const SISTOLICA_MAX = 120;
const DIASTOLICA_MAX = 80;
const MAX_PUNTOS = 15;

const TRIMESTRE = { 1: "1.er trimestre", 2: "2.º trimestre", 3: "3.er trimestre" };

// Los registros guardan la fecha como "dd/mm/aaaa".
function aDate(fecha) {
  const [d, m, a] = (fecha || "").split("/").map(Number);
  return a ? new Date(a, m - 1, d) : null;
}

// Del más nuevo al más viejo según fecha y hora (no según el orden de carga).
function masNuevoPrimero(registros) {
  const clave = (r) => {
    const f = aDate(r.fecha);
    const [h, m] = (r.hora || "00:00").split(":").map(Number);
    return f ? f.getTime() + (h * 60 + m) * 60000 : 0;
  };
  return [...registros].sort((a, b) => clave(b) - clave(a));
}

function diasDesde(fecha) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  return Math.round((hoy - fecha) / 86400000);
}

function Dato({ titulo, valor, detalle, alerta }) {
  return (
    <div className={`rounded-xl border p-4 ${alerta ? "bg-red-50 border-red-100" : "bg-white border-gray-100"}`}>
      <p className="text-xs font-medium text-gray-500">{titulo}</p>
      <p className={`text-2xl font-semibold mt-1 tabular-nums ${alerta ? "text-red-700" : "text-gray-800"}`}>{valor}</p>
      {detalle && <p className="text-xs text-gray-500 mt-0.5">{detalle}</p>}
    </div>
  );
}

function Seccion({ titulo, children }) {
  return (
    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <h3 className="font-medium text-gray-700 mb-3">{titulo}</h3>
      {children}
    </section>
  );
}

export default function FichaPaciente({ patient, onVolver, showToast }) {
  const [datos, setDatos] = useState(null);

  useEffect(() => {
    let cancelado = false;
    setDatos(null);
    Promise.all([
      api.getOwnBPRecords(patient.dni),
      api.getOwnWeightRecords(patient.dni),
      api.getSymptoms(patient.dni),
      api.getAgenda(patient.dni),
      api.getOwnMessages(patient.dni),
    ])
      .then(([presiones, pesos, sintomas, agenda, mensajes]) => {
        if (!cancelado)
          setDatos({
            presiones: masNuevoPrimero(presiones),
            pesos: masNuevoPrimero(pesos),
            sintomas: masNuevoPrimero(sintomas),
            agenda,
            mensajes,
          });
      })
      .catch((err) => {
        if (!cancelado) showToast(err.message || "No se pudo cargar la ficha", false);
      });
    return () => {
      cancelado = true;
    };
  }, [patient.dni]);

  const encabezado = (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <button onClick={onVolver} className="text-sm text-purple-600 hover:text-purple-800 mb-2">
          ← Volver al panel
        </button>
        <h2 className="text-2xl font-semibold text-gray-800">
          {patient.nombre} {patient.apellido}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          DNI {patient.dni} · {patient.email} · Referente: {patient.enfermero_referencia || "sin asignar"}
        </p>
      </div>
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium ${
          patient.estado === "Activo" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
        }`}
      >
        {patient.estado}
      </span>
    </div>
  );

  if (!datos) {
    return (
      <div className="fade-in max-w-5xl space-y-6">
        {encabezado}
        <p className="text-gray-400 text-sm">Cargando la ficha...</p>
      </div>
    );
  }

  const { presiones, pesos, sintomas, agenda, mensajes } = datos;
  const embarazo = agenda.embarazo;
  const ultimaPresion = presiones[0];
  const [ultimoPeso, pesoAnterior] = pesos;
  const sinResponder = [...presiones, ...pesos, ...sintomas].filter(
    (r) => r.alerta && !r.respuesta && !r.descartada
  ).length;
  const fechas = [...presiones, ...pesos, ...sintomas].map((r) => aDate(r.fecha)).filter(Boolean);
  const ultimoControl = fechas.length ? new Date(Math.max(...fechas)) : null;
  const diasSinControl = ultimoControl ? diasDesde(ultimoControl) : null;
  const faltan = agenda.estudios.filter((e) => e.estado === "pendiente" || e.estado === "atrasado");

  // Para los gráficos: los últimos registros, del más viejo al más nuevo.
  const presionesGrafico = presiones.slice(0, MAX_PUNTOS).reverse();
  const pesosGrafico = pesos.slice(0, MAX_PUNTOS).reverse();
  const variacion = ultimoPeso && pesoAnterior ? ultimoPeso.peso - pesoAnterior.peso : null;

  return (
    <div className="fade-in max-w-5xl space-y-6">
      {encabezado}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Dato
          titulo="Embarazo"
          valor={embarazo ? `Semana ${embarazo.semana}` : "Sin fecha"}
          detalle={
            embarazo
              ? `${TRIMESTRE[embarazo.trimestre]} · parto ${formatFecha(agenda.fecha_parto)}`
              : "No tiene fecha probable de parto"
          }
        />
        <Dato
          titulo="Última presión"
          valor={ultimaPresion ? `${ultimaPresion.sistolica}/${ultimaPresion.diastolica}` : "—"}
          detalle={ultimaPresion ? `${ultimaPresion.fecha} · mmHg` : "Sin registros"}
          alerta={ultimaPresion?.alerta}
        />
        <Dato
          titulo="Último peso"
          valor={ultimoPeso ? `${ultimoPeso.peso} kg` : "—"}
          detalle={
            variacion !== null
              ? `${variacion >= 0 ? "+" : ""}${variacion.toFixed(1).replace(".", ",")} kg desde el anterior`
              : ultimoPeso
              ? ultimoPeso.fecha
              : "Sin registros"
          }
          alerta={ultimoPeso?.alerta}
        />
        <Dato
          titulo="Alertas sin responder"
          valor={sinResponder}
          detalle={
            diasSinControl === null
              ? "Nunca cargó datos"
              : diasSinControl === 0
              ? "Se controló hoy"
              : `Último control hace ${diasSinControl} ${diasSinControl === 1 ? "día" : "días"}`
          }
          alerta={sinResponder > 0}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Seccion titulo="Presión arterial (mmHg)">
          <GraficoLinea
            etiquetas={presionesGrafico.map((r) => r.fecha.slice(0, 5))}
            series={[
              { nombre: "Sistólica", color: "#7c3aed", valores: presionesGrafico.map((r) => r.sistolica) },
              { nombre: "Diastólica", color: "#db2777", valores: presionesGrafico.map((r) => r.diastolica) },
            ]}
            referencias={[
              { valor: SISTOLICA_MAX, etiqueta: `límite ${SISTOLICA_MAX}` },
              { valor: DIASTOLICA_MAX, etiqueta: `límite ${DIASTOLICA_MAX}` },
            ]}
          />
          <div className="flex gap-4 text-xs text-gray-500 mt-2">
            <span className="flex items-center gap-1">
              <span className="w-3 h-0.5 bg-violet-600" /> Sistólica
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-0.5 bg-pink-600" /> Diastólica
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 border-t border-dashed border-red-400" /> Límite de alerta
            </span>
          </div>
        </Seccion>

        <Seccion titulo="Peso (kg)">
          <GraficoLinea
            etiquetas={pesosGrafico.map((r) => r.fecha.slice(0, 5))}
            series={[{ nombre: "Peso", color: "#0d9488", valores: pesosGrafico.map((r) => r.peso) }]}
            unidad=" kg"
          />
        </Seccion>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Seccion titulo="Estudios que le faltan">
          {!embarazo ? (
            <p className="text-sm text-gray-400">Sin fecha probable de parto no se pueden calcular.</p>
          ) : faltan.length === 0 ? (
            <p className="text-sm text-green-700">Tiene al día los estudios de su semana.</p>
          ) : (
            <ul className="space-y-1.5 text-sm">
              {faltan.map((e) => (
                <li key={e.key} className={e.estado === "atrasado" ? "text-red-700" : "text-gray-700"}>
                  {e.nombre}
                  <span className="text-xs text-gray-400">
                    {" "}
                    · {e.estado === "atrasado" ? "atrasado" : `semana ${e.semana_desde} a ${e.semana_hasta}`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Seccion>

        <Seccion titulo="Próximos turnos">
          {agenda.turnos.length === 0 ? (
            <p className="text-sm text-gray-400">No tiene turnos agendados.</p>
          ) : (
            <ul className="space-y-1.5 text-sm text-gray-700">
              {agenda.turnos.map((t) => (
                <li key={t.id}>
                  {t.tipo} · {formatFecha(t.fecha)} a las {t.hora}
                </li>
              ))}
            </ul>
          )}
        </Seccion>

        <Seccion titulo="Últimos síntomas">
          {sintomas.length === 0 ? (
            <p className="text-sm text-gray-400">No cargó síntomas.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {sintomas.slice(0, 3).map((r) => (
                <li key={r.id}>
                  <p className="text-xs text-gray-400">
                    {r.fecha} {r.hora}
                  </p>
                  <p className={r.alerta ? "text-red-700" : "text-gray-700"}>
                    {r.symptoms.map((s) => `${s.nombre} (${s.gravedad})`).join(", ")}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Seccion>

        <Seccion titulo="Últimos mensajes">
          {mensajes.length === 0 ? (
            <p className="text-sm text-gray-400">No envió mensajes.</p>
          ) : (
            <ul className="space-y-3 text-sm">
              {mensajes.slice(0, 3).map((m) => (
                <li key={m.id}>
                  <p className="text-xs text-gray-400">
                    {m.fecha} {m.hora}
                  </p>
                  <p className="text-gray-700">{m.mensaje}</p>
                  <p className="text-xs mt-0.5">
                    {m.respuesta ? (
                      <span className="text-gray-500">
                        Respondió {m.respondido_por || "enfermería"}: {m.respuesta}
                      </span>
                    ) : (
                      <span className="text-amber-700">Sin responder</span>
                    )}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Seccion>
      </div>
    </div>
  );
}
