import { useMemo, useState } from "react";
import { api } from "../api/client";

function ActionIcons({ isBusy, confirming, onEdit, onAskDelete, onConfirmDelete, onCancelDelete }) {
  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">¿Eliminar?</span>
        <button
          onClick={onConfirmDelete}
          disabled={isBusy}
          className="text-xs font-medium text-red-600 hover:text-red-800 disabled:opacity-50"
        >
          Sí
        </button>
        <button onClick={onCancelDelete} className="text-xs font-medium text-gray-400 hover:text-gray-600">
          No
        </button>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={onEdit}
        title="Editar"
        aria-label="Editar"
        className="w-7 h-7 flex items-center justify-center rounded-full text-purple-600 hover:bg-purple-50"
      >
        ✏️
      </button>
      <button
        onClick={onAskDelete}
        title="Eliminar"
        aria-label="Eliminar"
        className="w-7 h-7 flex items-center justify-center rounded-full text-red-500 hover:bg-red-50"
      >
        🗑️
      </button>
    </div>
  );
}

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

  const EditFields = ({ stacked }) => (
    <div className={stacked ? "space-y-2" : "contents"}>
      <div>
        {stacked && <label className="text-xs text-gray-400">Nombre</label>}
        <input
          value={editForm.nombre}
          onChange={(e) => setEditForm((f) => ({ ...f, nombre: e.target.value }))}
          className="w-full border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
        />
        {editErrors.nombre && <p className="text-red-500 text-xs mt-1">{editErrors.nombre}</p>}
      </div>
      <div>
        {stacked && <label className="text-xs text-gray-400">Apellido</label>}
        <input
          value={editForm.apellido}
          onChange={(e) => setEditForm((f) => ({ ...f, apellido: e.target.value }))}
          className="w-full border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
        />
        {editErrors.apellido && <p className="text-red-500 text-xs mt-1">{editErrors.apellido}</p>}
      </div>
      <div>
        {stacked && <label className="text-xs text-gray-400">DNI</label>}
        <input
          value={editForm.dni}
          onChange={(e) => setEditForm((f) => ({ ...f, dni: e.target.value }))}
          className="w-full border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
        />
        {editErrors.dni && <p className="text-red-500 text-xs mt-1">{editErrors.dni}</p>}
      </div>
      <div>
        {stacked && <label className="text-xs text-gray-400">Email</label>}
        <input
          value={editForm.email}
          onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
          className="w-full border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
        />
        {editErrors.email && <p className="text-red-500 text-xs mt-1">{editErrors.email}</p>}
      </div>
    </div>
  );

  return (
    <div className="fade-in">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Enfermeros/as registrados</h2>
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar por nombre, apellido, DNI o email..."
        className="w-full max-w-3xl border border-gray-200 rounded-lg px-3 py-2 mb-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
      />

      {/* Desktop: tabla */}
      <div className="hidden md:block max-w-3xl bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm text-left">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Apellido</th>
                <th className="px-4 py-3 font-medium">DNI</th>
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
                        <td className="px-4 py-2" colSpan={4}>
                          <div className="grid grid-cols-4 gap-2">
                            <EditFields />
                          </div>
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
                            <button onClick={cancelEdit} className="text-xs font-medium text-gray-400 hover:text-gray-600">
                              Cancelar
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3">{n.nombre}</td>
                        <td className="px-4 py-3">{n.apellido}</td>
                        <td className="px-4 py-3">{n.dni}</td>
                        <td className="px-4 py-3">{n.email}</td>
                        <td className="px-4 py-3">
                          <ActionIcons
                            isBusy={isBusy}
                            confirming={confirmDeleteId === n.id}
                            onEdit={() => startEdit(n)}
                            onAskDelete={() => setConfirmDeleteId(n.id)}
                            onConfirmDelete={() => confirmDelete(n.id)}
                            onCancelDelete={() => setConfirmDeleteId(null)}
                          />
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

      {/* Mobile: tarjetas */}
      <div className="md:hidden space-y-3">
        {filtered.map((n) => {
          const isEditing = editingId === n.id;
          const isBusy = busyId === n.id;
          return (
            <div key={n.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              {isEditing ? (
                <>
                  <EditFields stacked />
                  <div className="flex gap-3 mt-3">
                    <button
                      onClick={() => saveEdit(n.id)}
                      disabled={isBusy}
                      className="text-xs font-medium text-purple-600 hover:text-purple-800 disabled:opacity-50"
                    >
                      Guardar
                    </button>
                    <button onClick={cancelEdit} className="text-xs font-medium text-gray-400 hover:text-gray-600">
                      Cancelar
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="font-medium text-gray-800">
                    {n.nombre} {n.apellido}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">DNI {n.dni}</p>
                  <p className="text-xs text-gray-400">{n.email}</p>
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <ActionIcons
                      isBusy={isBusy}
                      confirming={confirmDeleteId === n.id}
                      onEdit={() => startEdit(n)}
                      onAskDelete={() => setConfirmDeleteId(n.id)}
                      onConfirmDelete={() => confirmDelete(n.id)}
                      onCancelDelete={() => setConfirmDeleteId(null)}
                    />
                  </div>
                </>
              )}
            </div>
          );
        })}
        {nurses.length === 0 && (
          <p className="text-center text-gray-400 py-8 text-sm bg-white rounded-2xl border border-gray-100">
            No hay enfermeros/as registrados.
          </p>
        )}
        {nurses.length > 0 && filtered.length === 0 && (
          <p className="text-center text-gray-400 py-8 text-sm bg-white rounded-2xl border border-gray-100">
            Sin resultados para "{search}".
          </p>
        )}
      </div>
    </div>
  );
}
