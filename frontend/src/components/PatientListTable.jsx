import { useMemo, useState } from "react";
import { api } from "../api/client";
import PatientDetailModal from "./PatientDetailModal";

export default function PatientListTable({ patients, onPatientUpdated, onPatientDeleted, showToast }) {
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editErrors, setEditErrors] = useState({});
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [detailPatient, setDetailPatient] = useState(null);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return patients;
    return patients.filter((p) =>
      [p.nombre, p.apellido, p.dni, p.email].some((field) =>
        (field || "").toLowerCase().includes(term)
      )
    );
  }, [patients, search]);

  const startEdit = (p) => {
    setEditingId(p.id);
    setEditForm({ nombre: p.nombre, apellido: p.apellido, dni: p.dni, email: p.email });
    setEditErrors({});
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditErrors({});
  };

  const saveEdit = async (id) => {
    setBusyId(id);
    try {
      const updated = await api.updatePatient(id, editForm);
      onPatientUpdated(updated);
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

  const toggleEstado = async (p) => {
    setBusyId(p.id);
    try {
      const updated = await api.togglePatientEstado(p.id);
      onPatientUpdated(updated);
    } catch (err) {
      showToast(err.message || "No se pudo cambiar el estado", false);
    } finally {
      setBusyId(null);
    }
  };

  const confirmDelete = async (id) => {
    setBusyId(id);
    try {
      await api.deletePatient(id);
      onPatientDeleted(id);
      showToast("Paciente eliminada correctamente");
    } catch (err) {
      showToast(err.message || "No se pudo eliminar", false);
    } finally {
      setBusyId(null);
      setConfirmDeleteId(null);
    }
  };

  return (
    <div className="fade-in">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Embarazadas registradas</h2>
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar por nombre, apellido, DNI o email..."
        className="w-full border border-gray-200 rounded-lg px-3 py-2 mb-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
      />
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm text-left">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Apellido</th>
                <th className="px-4 py-3 font-medium">DNI</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((p) => {
                const isEditing = editingId === p.id;
                const isBusy = busyId === p.id;
                return (
                  <tr key={p.id}>
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
                            value={editForm.dni}
                            onChange={(e) => setEditForm((f) => ({ ...f, dni: e.target.value }))}
                            className="w-full border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                          />
                          {editErrors.dni && <p className="text-red-500 text-xs mt-1">{editErrors.dni}</p>}
                        </td>
                        <td className="px-4 py-2">
                          <input
                            value={editForm.email}
                            onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                            className="w-full border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                          />
                          {editErrors.email && <p className="text-red-500 text-xs mt-1">{editErrors.email}</p>}
                        </td>
                        <td className="px-4 py-3 text-gray-400">{p.estado}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => saveEdit(p.id)}
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
                        <td className="px-4 py-3">{p.nombre}</td>
                        <td className="px-4 py-3">{p.apellido}</td>
                        <td className="px-4 py-3">{p.dni}</td>
                        <td className="px-4 py-3">{p.email}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => toggleEstado(p)}
                            disabled={isBusy}
                            className={`px-2 py-0.5 rounded-full text-xs font-medium disabled:opacity-50 ${
                              p.estado === "Activo"
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-500"
                            }`}
                            title="Click para cambiar el estado"
                          >
                            {p.estado}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          {confirmDeleteId === p.id ? (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">¿Eliminar?</span>
                              <button
                                onClick={() => confirmDelete(p.id)}
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
                                onClick={() => setDetailPatient(p)}
                                className="text-xs font-medium text-gray-500 hover:text-gray-700"
                              >
                                Ver detalle
                              </button>
                              <button
                                onClick={() => startEdit(p)}
                                className="text-xs font-medium text-purple-600 hover:text-purple-800"
                              >
                                Editar
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(p.id)}
                                className="text-xs font-medium text-red-500 hover:text-red-700"
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
        {patients.length === 0 && (
          <p className="text-center text-gray-400 py-8 text-sm">No hay embarazadas registradas.</p>
        )}
        {patients.length > 0 && filtered.length === 0 && (
          <p className="text-center text-gray-400 py-8 text-sm">Sin resultados para "{search}".</p>
        )}
      </div>

      {detailPatient && (
        <PatientDetailModal
          patient={detailPatient}
          onClose={() => setDetailPatient(null)}
          showToast={showToast}
        />
      )}
    </div>
  );
}
