import { useMemo } from "react";

// Paleta cíclica para diferenciar visualmente a qué paciente pertenece cada
// alerta (no indica gravedad, solo agrupa filas de la misma persona).
// Colores mas saturados (borde solido + fondo -100) para que se note el
// contraste entre pacientes distintas.
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

export default function AlertsPanel({ alerts }) {
  const colorByPatient = useMemo(() => {
    const map = new Map();
    alerts.forEach((a) => {
      if (!map.has(a.patient_name)) {
        map.set(a.patient_name, COLORS[map.size % COLORS.length]);
      }
    });
    return map;
  }, [alerts]);

  return (
    <div className="fade-in">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Alertas</h2>

      {/* Desktop: tabla */}
      <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm text-left">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Paciente</th>
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium">Hora</th>
                <th className="px-4 py-3 font-medium">Detalle</th>
                <th className="px-4 py-3 font-medium">Motivo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {alerts.map((a) => {
                const color = colorByPatient.get(a.patient_name) || COLORS[0];
                return (
                  <tr key={`${a.tipo}-${a.id}`} className={`${color.row} border-l-4 ${color.border}`}>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-2 font-medium text-gray-800">
                        <span className={`w-2.5 h-2.5 rounded-full ${color.dot}`} />
                        {a.patient_name}
                      </span>
                    </td>
                    <td className="px-4 py-3">{a.fecha}</td>
                    <td className="px-4 py-3">{a.hora}</td>
                    <td className="px-4 py-3">{a.detalle}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-600 text-white">
                        ⚠ {a.motivo}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {alerts.length === 0 && (
          <p className="text-center text-gray-400 py-8 text-sm">Sin alertas activas.</p>
        )}
      </div>

      {/* Mobile: tarjetas */}
      <div className="md:hidden space-y-3">
        {alerts.map((a) => {
          const color = colorByPatient.get(a.patient_name) || COLORS[0];
          return (
            <div
              key={`${a.tipo}-${a.id}`}
              className={`rounded-xl border-l-4 ${color.border} ${color.row} shadow-sm p-4`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="inline-flex items-center gap-2 font-medium text-gray-800">
                  <span className={`w-2.5 h-2.5 rounded-full ${color.dot}`} />
                  {a.patient_name}
                </span>
                <span className="text-xs text-gray-500">
                  {a.fecha} {a.hora}
                </span>
              </div>
              <p className="text-sm text-gray-700 mb-2">{a.detalle}</p>
              <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-red-600 text-white">
                ⚠ {a.motivo}
              </span>
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
