export default function MonitoringPanel({ notifications }) {
  return (
    <div className="fade-in max-w-3xl">
      <h2 className="text-xl font-semibold text-gray-800 mb-1">Monitoreo</h2>
      <p className="text-sm text-gray-400 mb-4">
        Pacientes que no cargaron presión, peso ni síntomas en los últimos días.
      </p>

      <div className="space-y-3">
        {notifications.map((n) => (
          <div
            key={n.patient_id}
            className="bg-white rounded-xl border-l-4 border-red-400 shadow-sm p-4 flex items-center justify-between gap-3"
          >
            <div>
              <p className="font-medium text-gray-800">{n.patient_name}</p>
              <p className="text-xs text-gray-500">DNI {n.patient_dni}</p>
            </div>
            <span className="shrink-0 px-3 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700">
              {n.dias_sin_control === null
                ? "Nunca se controló"
                : `Sin controlarse hace ${n.dias_sin_control} días`}
            </span>
          </div>
        ))}
        {notifications.length === 0 && (
          <p className="text-center text-gray-400 py-8 text-sm bg-white rounded-2xl border border-gray-100">
            Todas las pacientes activas se controlaron recientemente.
          </p>
        )}
      </div>
    </div>
  );
}
