import { useMemo } from "react";

// Paleta cíclica para diferenciar visualmente a qué paciente pertenece cada
// alerta (no indica gravedad, solo agrupa filas de la misma persona).
const COLORS = [
  { row: "bg-red-50", dot: "bg-red-500" },
  { row: "bg-orange-50", dot: "bg-orange-500" },
  { row: "bg-amber-50", dot: "bg-amber-500" },
  { row: "bg-lime-50", dot: "bg-lime-500" },
  { row: "bg-teal-50", dot: "bg-teal-500" },
  { row: "bg-blue-50", dot: "bg-blue-500" },
  { row: "bg-purple-50", dot: "bg-purple-500" },
  { row: "bg-pink-50", dot: "bg-pink-500" },
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
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
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
                  <tr key={`${a.tipo}-${a.id}`} className={color.row}>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${color.dot}`} />
                        {a.patient_name}
                      </span>
                    </td>
                    <td className="px-4 py-3">{a.fecha}</td>
                    <td className="px-4 py-3">{a.hora}</td>
                    <td className="px-4 py-3">{a.detalle}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
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
    </div>
  );
}
