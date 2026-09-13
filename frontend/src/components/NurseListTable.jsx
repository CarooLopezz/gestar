import { useMemo, useState } from "react";
import { api } from "../api/client";

export default function NurseListTable({ nurses, currentNurseId, onNurseUpdated, onNurseDeleted, showToast }) {
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editErrors, setEditErrors] = useState({});
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return nurses;
    return nurses.filter((n) =>
      [n.nombre, n.apellido, n.dni, n.email].some((field) =>
        (field || "").toLowerCase().includes(term)
      )
    );
  }, [nurses, search]);

  const startEdit = (n) => {
    setEditingId(n.id);
    setEditForm({ nombre: n.nombre, apellido: n.apellido, dni: n.dni, email: n.email });
    setEditErrors({});
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditErrors({});
  };

  const saveEdit = async (id) => {
    setBusyId(id);
    try {
      const updated = await api.updateNurse(id, editForm);
      onNurseUpdated(updated);
      setEditingId(null);
      showToast("Datos actualizados correctamente");
    } catch (err) {
      if (err.data?.errors) {
        setEditErrors(err.data.errors);
      } else {
        showToast(err.message || "No se pudo actualizar", false);
      }
    } finally {
      setBusyId(null);
    }
  };

  const confirmDelete = async (id) => {
    setBusyId(id);
    try {
      await api.deleteNurse(id);
      onNurseDeleted(id);
      showToast("Enfermero/a eliminado correctamente");
    } catch (err) {
      showToast(err.message || "No se pudo eliminar", false);
    } finally {
      setBusyId(null);
      setConfirmDeleteId(null);
    }
  };

  return (
    <div className="fade-in">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Enfermeros/as registrados</h2>
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar por nombre, apellido o email..."
        className="w-full max-w-3xl border border-gray-200 rounded-lg px-3 py-2 mb-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
      />
      <div className="max-w-3xl bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm text-left">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Apellido</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((n) => {
                const isEditing = editingId === n.id;
                const isBusy = busyId === n.id;
                return (
                  <tr key={n.id}>
                    {isEditing ? (
                      <>
                        <td className="px-4 py-2">
                          <input
                            value={editForm.nombre}
                            onChange={(e) => setEditForm((f) => ({ ...f, nombre: e.target.value }))}
                            className="w-full border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                          />
                          {editErrors.nombre && <p className="text-red-500 text-xs mt-1">{editErrors.nombre}</p>}
                        </td>
                        <td className="px-4 py-2">
                          <input
                            value={editForm.apellido}
                            onChange={(e) => setEditForm((f) => ({ ...f, apellido: e.target.value }))}
                            className="w-full border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                          />
                          {editErrors.apellido && <p className="text-red-500 text-xs mt-1">{editErrors.apellido}</p>}
                        </td>
                        <td className="px-4 py-2">
                          <input
                            value={editForm.email}
                            onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                            className="w-full border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                          />
                          {editErrors.email && <p className="text-red-500 text-xs mt-1">{editErrors.email}</p>}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => saveEdit(n.id)}
                              disabled={isBusy}
                              className="text-xs font-medium text-purple-600 hover:text-purple-800 disabled:opacity-50"
                            >
                              Guardar
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="text-xs font-medium text-gray-400 hover:text-gray-600"
                            >
                              Cancelar
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3">{n.nombre}</td>
                        <td className="px-4 py-3">{n.apellido}</td>
                        <td className="px-4 py-3">{n.email}</td>
                        <td className="px-4 py-3">
                          {confirmDeleteId === n.id ? (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">¿Eliminar?</span>
                              <button
                                onClick={() => confirmDelete(n.id)}
                                disabled={isBusy}
                                className="text-xs font-medium text-red-600 hover:text-red-800 disabled:opacity-50"
                              >
                                Sí
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="text-xs font-medium text-gray-400 hover:text-gray-600"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <div className="flex gap-3">
                              <button
                                onClick={() => startEdit(n)}
                                className="text-xs font-medium text-purple-600 hover:text-purple-800"
                              >
                                Editar
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(n.id)}
                                className="text-xs font-medium text-red-500 hover:text-red-700"
                                title={n.id === currentNurseId ? "Esta es tu propia cuenta" : undefined}
                              >
                                Eliminar
                              </button>
                            </div>
                          )}
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {nurses.length === 0 && (
          <p className="text-center text-gray-400 py-8 text-sm">No hay enfermeros/as registrados.</p>
        )}
        {nurses.length > 0 && filtered.length === 0 && (
          <p className="text-center text-gray-400 py-8 text-sm">Sin resultados para "{search}".</p>
        )}
      </div>
    </div>
  );
}
