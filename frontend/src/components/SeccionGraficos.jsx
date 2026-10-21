import { useMemo, useState } from "react";
import { aDate, masNuevoPrimero } from "../utils/registros";
import GraficoBarras from "./GraficoBarras";
import GraficosPaciente from "./GraficosPaciente";

const DIAS_ACTIVIDAD = 14;
const DIAS_ALERTAS = 30;

function Tarjeta({ titulo, detalle, children }) {
  return (
    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <h3 className="font-medium text-gray-700">{titulo}</h3>
      {detalle && <p className="text-xs text-gray-400 mb-3">{detalle}</p>}
      {children}
    </section>
  );
}

function inicioDelDia(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

// Gráficos del grupo de embarazadas y, eligiendo una, su presión y su peso.
// Recibe todos los registros que ve la enfermera (presión, peso y síntomas).
export default function SeccionGraficos({ patients, monitoring, bpRecords, weightRecords, symptomRecords }) {
  const [elegidaId, setElegidaId] = useState("");

  const porTrimestre = useMemo(() => {
    const cuenta = { 1: 0, 2: 0, 3: 0, sin: 0 };
    monitoring.forEach((m) => (cuenta[m.embarazo ? m.embarazo.trimestre : "sin"] += 1));
    return [
      { etiqueta: "1.er trimestre", valor: cuenta[1], color: "#f472b6" },
      { etiqueta: "2.º trimestre", valor: cuenta[2], color: "#a78bfa" },
      { etiqueta: "3.er trimestre", valor: cuenta[3], color: "#fbbf24" },
      { etiqueta: "Sin fecha", valor: cuenta.sin, color: "#cbd5e1" },
    ];
  }, [monitoring]);

  // Cuántos controles (presión, peso o síntomas) se cargaron cada día.
  const actividad = useMemo(() => {
    const hoy = inicioDelDia(new Date());
    const dias = Array.from({ length: DIAS_ACTIVIDAD }, (_, i) => {
      const d = new Date(hoy);
      d.setDate(hoy.getDate() - (DIAS_ACTIVIDAD - 1 - i));
      return { fecha: d, etiqueta: `${d.getDate()}/${d.getMonth() + 1}`, valor: 0 };
    });
    [...bpRecords, ...weightRecords, ...symptomRecords].forEach((r) => {
      const f = aDate(r.fecha);
      const dia = f && dias.find((d) => d.fecha.getTime() === f.getTime());
      if (dia) dia.valor += 1;
    });
    return dias;
  }, [bpRecords, weightRecords, symptomRecords]);

  const alertasPorTipo = useMemo(() => {
    const desde = inicioDelDia(new Date());
    desde.setDate(desde.getDate() - DIAS_ALERTAS);
    const contar = (registros) =>
      registros.filter((r) => {
        const f = aDate(r.fecha);
        return r.alerta && f && f >= desde;
      }).length;
    return [
      { etiqueta: "Presión", valor: contar(bpRecords), color: "#7c3aed" },
      { etiqueta: "Peso", valor: contar(weightRecords), color: "#0d9488" },
      { etiqueta: "Síntomas", valor: contar(symptomRecords), color: "#db2777" },
    ];
  }, [bpRecords, weightRecords, symptomRecords]);

  const elegida = patients.find((p) => String(p.id) === elegidaId);
  const presionesElegida = useMemo(
    () => (elegida ? masNuevoPrimero(bpRecords.filter((r) => r.patient_id === elegida.id)) : []),
    [elegida, bpRecords]
  );
  const pesosElegida = useMemo(
    () => (elegida ? masNuevoPrimero(weightRecords.filter((r) => r.patient_id === elegida.id)) : []),
    [elegida, weightRecords]
  );

  return (
    <div className="fade-in max-w-5xl space-y-6">
      <h2 className="text-xl font-semibold text-gray-800">Gráficos</h2>

      <div className="grid lg:grid-cols-2 gap-6">
        <Tarjeta titulo="Embarazadas por trimestre" detalle="Embarazadas activas, según su fecha probable de parto">
          <GraficoBarras barras={porTrimestre} />
        </Tarjeta>
        <Tarjeta titulo="Alertas por tipo" detalle={`Últimos ${DIAS_ALERTAS} días`}>
          <GraficoBarras barras={alertasPorTipo} />
        </Tarjeta>
      </div>

      <Tarjeta
        titulo="Controles cargados por día"
        detalle={`Presión, peso y síntomas de todas las embarazadas · últimos ${DIAS_ACTIVIDAD} días`}
      >
        <GraficoBarras barras={actividad} color="#a78bfa" etiquetaCada={2} />
      </Tarjeta>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <h3 className="font-medium text-gray-700">Por embarazada</h3>
          <select
            value={elegidaId}
            onChange={(e) => setElegidaId(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
          >
            <option value="">Elegí una embarazada</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre} {p.apellido}
              </option>
            ))}
          </select>
        </div>
        {elegida ? (
          <GraficosPaciente presiones={presionesElegida} pesos={pesosElegida} />
        ) : (
          <p className="text-sm text-gray-400">Elegí una embarazada para ver su presión y su peso.</p>
        )}
      </section>
    </div>
  );
}
