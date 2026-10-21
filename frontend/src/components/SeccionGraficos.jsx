import { useMemo, useState } from "react";
import { aDate } from "../utils/registros";
import GraficoBarras from "./GraficoBarras";
import GraficoLinea from "./GraficoLinea";

const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const DIAS_ADHERENCIA = 7;

function Tarjeta({ titulo, detalle, children }) {
  return (
    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <h3 className="font-medium text-gray-700">{titulo}</h3>
      {detalle && <p className="text-xs text-gray-400 mb-3">{detalle}</p>}
      {children}
    </section>
  );
}

function Metrica({ titulo, valor, detalle }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4">
      <p className="text-xs font-medium text-gray-500">{titulo}</p>
      <p className="text-2xl font-semibold text-gray-800 mt-1 tabular-nums">{valor}</p>
      {detalle && <p className="text-xs text-gray-400 mt-0.5">{detalle}</p>}
    </div>
  );
}

// "dd/mm/aaaa HH:MM" (respondida_en) o fecha + hora de un registro → Date.
function aFechaHora(fecha, hora) {
  const d = aDate(fecha);
  if (!d) return null;
  const [h, m] = (hora || "00:00").split(":").map(Number);
  d.setHours(h, m);
  return d;
}

function formatHoras(horas) {
  if (horas < 1) return `${Math.max(1, Math.round(horas * 60))} min`;
  if (horas < 48) return `${horas.toFixed(1).replace(".", ",")} h`;
  return `${Math.round(horas / 24)} días`;
}

const porcentaje = (parte, total) => (total ? `${Math.round((parte / total) * 100)}%` : "—");

// Métricas del grupo de embarazadas por año. Recibe todos los registros
// que ve la enfermera.
export default function SeccionGraficos({ patients, monitoring, bpRecords, weightRecords, symptomRecords }) {
  // Todos los controles con su fecha ya convertida.
  const controles = useMemo(
    () =>
      [
        ...bpRecords.map((r) => ({ ...r, patient: r.patient_id })),
        ...weightRecords.map((r) => ({ ...r, patient: r.patient_id })),
        // Los síntomas se vinculan por DNI.
        ...symptomRecords.map((r) => ({ ...r, patient: patients.find((p) => p.dni === r.patient_dni)?.id })),
      ]
        .map((r) => ({ ...r, cuando: aFechaHora(r.fecha, r.hora) }))
        .filter((r) => r.cuando),
    [bpRecords, weightRecords, symptomRecords, patients]
  );

  const anios = useMemo(() => {
    const set = new Set(controles.map((r) => r.cuando.getFullYear()));
    set.add(new Date().getFullYear());
    return [...set].sort((a, b) => b - a);
  }, [controles]);
  const [anio, setAnio] = useState(new Date().getFullYear());

  const m = useMemo(() => {
    const delAnio = controles.filter((r) => r.cuando.getFullYear() === anio);
    const porMes = MESES.map((mes) => ({ etiqueta: mes, valor: 0 }));
    delAnio.forEach((r) => (porMes[r.cuando.getMonth()].valor += 1));

    const alertas = delAnio.filter((r) => r.alerta);
    const alertasPorMes = MESES.map(() => 0);
    const respondidasPorMes = MESES.map(() => 0);
    alertas.forEach((r) => {
      alertasPorMes[r.cuando.getMonth()] += 1;
      if (r.respuesta) respondidasPorMes[r.cuando.getMonth()] += 1;
    });

    // Tiempo de respuesta: solo las que tienen la hora de respuesta guardada
    // (se registra desde que existe la auditoría).
    const tiempos = alertas
      .filter((r) => r.respondida_en)
      .map((r) => {
        const [f, h] = r.respondida_en.split(" ");
        return (aFechaHora(f, h) - r.cuando) / 3600000;
      })
      .filter((h) => h >= 0);

    const conControles = new Set(delAnio.map((r) => r.patient).filter(Boolean));
    const porEmbarazada = patients
      .filter((p) => p.estado === "Activo")
      .map((p) => {
        const suyos = delAnio.filter((r) => r.patient === p.id);
        const ultimo = suyos.reduce((max, r) => (!max || r.cuando > max ? r.cuando : max), null);
        return { id: p.id, nombre: `${p.nombre} ${p.apellido}`, controles: suyos.length, ultimo };
      })
      .sort((a, b) => a.controles - b.controles);

    const hace7 = new Date();
    hace7.setDate(hace7.getDate() - DIAS_ADHERENCIA);
    const activas = patients.filter((p) => p.estado === "Activo");
    const recientes = new Set(controles.filter((r) => r.cuando >= hace7).map((r) => r.patient));

    return {
      total: delAnio.length,
      promedio: conControles.size ? delAnio.length / conControles.size : 0,
      adherencia: porcentaje(activas.filter((p) => recientes.has(p.id)).length, activas.length),
      respondidas: porcentaje(alertas.filter((r) => r.respuesta).length, alertas.length),
      totalAlertas: alertas.length,
      tiempoRespuesta: tiempos.length ? formatHoras(tiempos.reduce((a, b) => a + b, 0) / tiempos.length) : "—",
      tiemposMedidos: tiempos.length,
      porMes,
      alertasPorMes,
      respondidasPorMes,
      porEmbarazada,
    };
  }, [controles, anio, patients]);

  const porTrimestre = useMemo(() => {
    const cuenta = { 1: 0, 2: 0, 3: 0, sin: 0 };
    monitoring.forEach((x) => (cuenta[x.embarazo ? x.embarazo.trimestre : "sin"] += 1));
    return [
      { etiqueta: "1.er trimestre", valor: cuenta[1], color: "#f472b6" },
      { etiqueta: "2.º trimestre", valor: cuenta[2], color: "#a78bfa" },
      { etiqueta: "3.er trimestre", valor: cuenta[3], color: "#fbbf24" },
      { etiqueta: "Sin fecha", valor: cuenta.sin, color: "#cbd5e1" },
    ];
  }, [monitoring]);

  return (
    <div className="fade-in max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-gray-800">Métricas</h2>
        <label className="flex items-center gap-2 text-sm text-gray-600">
          Año
          <select
            value={anio}
            onChange={(e) => setAnio(Number(e.target.value))}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
          >
            {anios.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Metrica titulo="Controles en el año" valor={m.total} detalle="Presión, peso y síntomas" />
        <Metrica
          titulo="Promedio por embarazada"
          valor={m.promedio.toFixed(1).replace(".", ",")}
          detalle="Entre las que cargaron algo"
        />
        <Metrica titulo="Se controlaron esta semana" valor={m.adherencia} detalle={`Activas, últimos ${DIAS_ADHERENCIA} días`} />
        <Metrica titulo="Alertas respondidas" valor={m.respondidas} detalle={`De ${m.totalAlertas} en el año`} />
        <Metrica
          titulo="Tiempo de respuesta"
          valor={m.tiempoRespuesta}
          detalle={m.tiemposMedidos ? `Promedio de ${m.tiemposMedidos} alertas` : "Sin datos todavía"}
        />
      </div>

      <Tarjeta titulo="Controles por mes" detalle={`Presión, peso y síntomas cargados en ${anio}`}>
        <GraficoBarras barras={m.porMes} color="#a78bfa" />
      </Tarjeta>

      <div className="grid lg:grid-cols-2 gap-6">
        <Tarjeta titulo="Alertas por mes" detalle={`Generadas y respondidas en ${anio}`}>
          <GraficoLinea
            etiquetas={MESES}
            series={[
              { nombre: "Alertas", color: "#ef4444", valores: m.alertasPorMes },
              { nombre: "Respondidas", color: "#16a34a", valores: m.respondidasPorMes },
            ]}
          />
          <div className="flex gap-4 text-xs text-gray-500 mt-2">
            <span className="flex items-center gap-1">
              <span className="w-3 h-0.5 bg-red-500" /> Alertas
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-0.5 bg-green-600" /> Respondidas
            </span>
          </div>
        </Tarjeta>
        <Tarjeta titulo="Embarazadas por trimestre" detalle="Embarazadas activas hoy, según su fecha probable de parto">
          <GraficoBarras barras={porTrimestre} />
        </Tarjeta>
      </div>

      <Tarjeta titulo="Controles por embarazada" detalle={`En ${anio}, de la que menos se controla a la que más`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-gray-500 text-left">
              <tr>
                <th className="py-2 pr-4 font-medium">Embarazada</th>
                <th className="py-2 pr-4 font-medium text-right">Controles</th>
                <th className="py-2 font-medium">Último control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {m.porEmbarazada.map((p) => (
                <tr key={p.id}>
                  <td className="py-2 pr-4 text-gray-800">{p.nombre}</td>
                  <td
                    className={`py-2 pr-4 text-right tabular-nums font-medium ${
                      p.controles === 0 ? "text-red-600" : "text-gray-700"
                    }`}
                  >
                    {p.controles}
                  </td>
                  <td className="py-2 text-gray-500">
                    {p.ultimo ? p.ultimo.toLocaleDateString("es-AR") : "Sin controles"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Tarjeta>
    </div>
  );
}
