export default function AlertsPanel({ alerts }) {
  return (
    <div className="fade-in">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Alertas</h2>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">Paciente</th>
              <th className="px-4 py-3 font-medium">Fecha</th>
              <th className="px-4 py-3 font-medium">Hora</th>
              <th className="px-4 py-3 font-medium">Peso (kg)</th>
              <th className="px-4 py-3 font-medium">Motivo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {alerts.map((a) => (
              <tr key={a.id} className="bg-red-50">
                <td className="px-4 py-3">{a.patient_name}</td>
                <td className="px-4 py-3">{a.fecha}</td>
                <td className="px-4 py-3">{a.hora}</td>
                <td className="px-4 py-3">{a.peso}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                    ⚠ Aumento &gt; 2kg desde el registro anterior
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {alerts.length === 0 && (
          <p className="text-center text-gray-400 py-8 text-sm">Sin alertas activas.</p>
        )}
      </div>
    </div>
  );
}
