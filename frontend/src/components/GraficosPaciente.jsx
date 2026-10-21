import GraficoLinea from "./GraficoLinea";

// Mismos límites que usa el backend para marcar alerta de presión (bp.py).
const SISTOLICA_MAX = 120;
const DIASTOLICA_MAX = 80;
const MAX_PUNTOS = 15;

function Tarjeta({ titulo, children }) {
  return (
    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <h3 className="font-medium text-gray-700 mb-3">{titulo}</h3>
      {children}
    </section>
  );
}

// Presión y peso de una embarazada. Recibe los registros del más nuevo al más
// viejo (masNuevoPrimero) y grafica los últimos 15, en orden cronológico.
export default function GraficosPaciente({ presiones, pesos }) {
  const p = presiones.slice(0, MAX_PUNTOS).reverse();
  const w = pesos.slice(0, MAX_PUNTOS).reverse();

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <Tarjeta titulo="Presión arterial (mmHg)">
        <GraficoLinea
          etiquetas={p.map((r) => r.fecha.slice(0, 5))}
          series={[
            { nombre: "Sistólica", color: "#7c3aed", valores: p.map((r) => r.sistolica) },
            { nombre: "Diastólica", color: "#db2777", valores: p.map((r) => r.diastolica) },
          ]}
          referencias={[
            { valor: SISTOLICA_MAX, etiqueta: `límite ${SISTOLICA_MAX}` },
            { valor: DIASTOLICA_MAX, etiqueta: `límite ${DIASTOLICA_MAX}` },
          ]}
        />
        <div className="flex flex-wrap gap-4 text-xs text-gray-500 mt-2">
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
      </Tarjeta>

      <Tarjeta titulo="Peso (kg)">
        <GraficoLinea
          etiquetas={w.map((r) => r.fecha.slice(0, 5))}
          series={[{ nombre: "Peso", color: "#0d9488", valores: w.map((r) => r.peso) }]}
          unidad=" kg"
        />
      </Tarjeta>
    </div>
  );
}
