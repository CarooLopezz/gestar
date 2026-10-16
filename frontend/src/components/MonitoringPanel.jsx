const TRIMESTRE_CHIP = {
  1: { nombre: "1.er trimestre", clase: "bg-pink-50 text-pink-700" },
  2: { nombre: "2.º trimestre", clase: "bg-violet-50 text-violet-700" },
  3: { nombre: "3.er trimestre", clase: "bg-amber-50 text-amber-700" },
};

export default function MonitoringPanel({ notifications }) {
  return (
    <div className="fade-in max-w-3xl">
      <h2 className="text-xl font-semibold text-gray-800 mb-1">Monitoreo</h2>
      <p className="text-sm text-gray-400 mb-4">
        En qué trimestre va cada embarazada, qué estudios le faltan según su semana y quién dejó de cargar
        datos.
      </p>

      <div className="space-y-3">
        {notifications.map((n) => {
          const atrasados = n.estudios_faltantes.filter((e) => e.estado === "atrasado");
          const pendientes = n.estudios_faltantes.filter((e) => e.estado === "pendiente");
          const urgente = atrasados.length > 0 || n.necesita_control;
          const chip = n.embarazo && TRIMESTRE_CHIP[n.embarazo.trimestre];
          return (
            <div
              key={n.patient_id}
              className={`bg-white rounded-xl border-l-4 shadow-sm p-4 space-y-3 ${
                urgente ? "border-red-400" : pendientes.length > 0 ? "border-amber-400" : "border-green-400"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-gray-800">{n.patient_name}</p>
                  <p className="text-sm text-gray-600">
                    {n.embarazo ? (
                      <>
                        Va por el <span className="font-medium">{chip.nombre}</span>, semana {n.embarazo.semana}
                      </>
                    ) : (
                      <span className="text-gray-400">Sin fecha probable de parto: no se puede calcular el trimestre</span>
                    )}
                  </p>
                  <p className="text-xs text-gray-400">DNI {n.patient_dni}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {chip && <span className={`px-3 py-1 rounded-full text-xs font-medium ${chip.clase}`}>{chip.nombre}</span>}
                  {n.necesita_control && (
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700">
                      {n.dias_sin_control === null
                        ? "Nunca cargó datos"
                        : `Sin cargar datos hace ${n.dias_sin_control} días`}
                    </span>
                  )}
                </div>
              </div>

              {n.estudios_faltantes.length > 0 ? (
                <div className="text-sm">
                  <p className="text-gray-500 mb-1">Le falta hacerse:</p>
                  <ul className="space-y-1">
                    {[...atrasados, ...pendientes].map((e) => (
                      <li key={e.key} className="flex flex-wrap justify-between gap-x-4">
                        <span className={e.estado === "atrasado" ? "text-red-700" : "text-gray-700"}>{e.nombre}</span>
                        <span className={`text-xs ${e.estado === "atrasado" ? "text-red-500" : "text-gray-400"}`}>
                          {e.estado === "atrasado" ? "atrasado · " : ""}semana {e.semana_desde} a {e.semana_hasta}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                n.embarazo && <p className="text-sm text-green-700">Tiene al día los estudios de su semana.</p>
              )}
            </div>
          );
        })}
        {notifications.length === 0 && (
          <p className="text-center text-gray-400 py-8 text-sm bg-white rounded-2xl border border-gray-100">
            No hay embarazadas activas.
          </p>
        )}
      </div>
    </div>
  );
}
