export default function NurseListTable({ nurses }) {
  return (
    <div className="fade-in">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Enfermeros/as registrados</h2>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[420px] text-sm text-left">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Apellido</th>
                <th className="px-4 py-3 font-medium">Email</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {nurses.map((n) => (
                <tr key={n.id}>
                  <td className="px-4 py-3">{n.nombre}</td>
                  <td className="px-4 py-3">{n.apellido}</td>
                  <td className="px-4 py-3">{n.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {nurses.length === 0 && (
          <p className="text-center text-gray-400 py-8 text-sm">No hay enfermeros/as registrados.</p>
        )}
      </div>
    </div>
  );
}
