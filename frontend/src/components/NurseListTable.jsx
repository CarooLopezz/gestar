export default function NurseListTable({ nurses }) {
  return (
    <div className="fade-in">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Enfermeros/as registrados</h2>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">Nombre</th>
              <th className="px-4 py-3 font-medium">Apellido</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Rol</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {nurses.map((n) => (
              <tr key={n.id}>
                <td className="px-4 py-3">{n.nombre}</td>
                <td className="px-4 py-3">{n.apellido}</td>
                <td className="px-4 py-3">{n.email}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                    {n.role}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {nurses.length === 0 && (
          <p className="text-center text-gray-400 py-8 text-sm">No hay enfermeros/as registrados.</p>
        )}
      </div>
    </div>
  );
}
