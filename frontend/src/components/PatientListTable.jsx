import { useMemo, useState } from "react";
import { api } from "../api/client";
import PatientDetailModal from "./PatientDetailModal";
import { formatFecha } from "../utils/fecha";
import MisPacientesToggle from "./MisPacientesToggle";
import { coincideBusqueda } from "../utils/busqueda";

function ActionIcons({ patient, isBusy, confirming, onDetail, onEdit, onAskDelete, onConfirmDelete, onCancelDelete }) {
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
        onClick={onDetail}
        title="Ver detalle"
        aria-label="Ver detalle"
        className="w-7 h-7 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700 text-lg leading-none"
      >
        +
      </button>
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

export default function PatientListTable({
  patients,
  nurses = [],
  currentNurseId,
  onPatientUpdated,
  onPatientDeleted,
  showToast,
}) {
  const [search, setSearch] = useState("");
  const [soloMias, setSoloMias] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editErrors, setEditErrors] = useState({});
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [detailPatient, setDetailPatient] = useState(null);

  const filtered = useMemo(() => {
    return patients.filter(
      (p) => (!soloMias || p.nurse_id === currentNurseId) && coincideBusqueda(p, search)
    );
  }, [patients, search, soloMias, currentNurseId]);

  const startEdit = (p) => {
    setEditingId(p.id);
    setEditForm({
      nombre: p.nombre,
      apellido: p.apellido,
      dni: p.dni,
      email: p.email,
      fecha_parto: p.fecha_parto || "",
      nurse_id: p.nurse_id ? String(p.nurse_id) : "",
    });
    setEditErrors({});
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditErrors({});
  };

  const saveEdit = async (id) => {
    setBusyId(id);
    try {
      const updated = await api.updatePatient(id, {
        ...editForm,
        nurse_id: editForm.nurse_id ? Number(editForm.nurse_id) : null,
      });
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

  // Se llama como función, no como componente: definido acá adentro sería
  // un componente nuevo en cada render y React recrearía los inputs con cada
  // tecla (se pierde el foco).
  const renderEditFields = ({ stacked } = {}) => (
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
      <div>
        {stacked && <label className="text-xs text-gray-400">Fecha probable de parto</label>}
        <input
          type="date"
          value={editForm.fecha_parto}
          onChange={(e) => setEditForm((f) => ({ ...f, fecha_parto: e.target.value }))}
          className="w-full border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
        />
        {editErrors.fecha_parto && <p className="text-red-500 text-xs mt-1">{editErrors.fecha_parto}</p>}
      </div>
      <div>
        {stacked && <label className="text-xs text-gray-400">Enfermero/a de referencia</label>}
        <select
          value={editForm.nurse_id}
          onChange={(e) => setEditForm((f) => ({ ...f, nurse_id: e.target.value }))}
          className="w-full border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
        >
          <option value="">Sin asignar</option>
          {nurses.map((n) => (
            <option key={n.id} value={n.id}>
              {n.nombre} {n.apellido}
            </option>
          ))}
        </select>
        {editErrors.nurse_id && <p className="text-red-500 text-xs mt-1">{editErrors.nurse_id}</p>}
      </div>
    </div>
  );

  return (
    <div className="fade-in">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Embarazadas registradas</h2>
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar por nombre, apellido, DNI o email..."
        className="w-full border border-gray-200 rounded-lg px-3 py-2 mb-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
      />
      <div className="mb-3">
        <MisPacientesToggle checked={soloMias} onChange={setSoloMias} />
      </div>

      {/* Desktop: tabla */}
      <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-sm text-left">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Apellido</th>
                <th className="px-4 py-3 font-medium">DNI</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Fecha de parto</th>
                <th className="px-4 py-3 font-medium">Referente</th>
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
                        <td className="px-4 py-2" colSpan={6}>
                          <div className="grid grid-cols-6 gap-2">
                            {renderEditFields()}
                          </div>
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
                            <button onClick={cancelEdit} className="text-xs font-medium text-gray-400 hover:text-gray-600">
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
                          {formatFecha(p.fecha_parto) || <span className="text-gray-400">No registrada</span>}
                        </td>
                        <td className="px-4 py-3">
                          {p.enfermero_referencia || <span className="text-gray-400">Sin asignar</span>}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => toggleEstado(p)}
                            disabled={isBusy}
                            className={`px-2 py-0.5 rounded-full text-xs font-medium disabled:opacity-50 ${
                              p.estado === "Activo" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                            }`}
                            title="Click para cambiar el estado"
                          >
                            {p.estado}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <ActionIcons
                            patient={p}
                            isBusy={isBusy}
                            confirming={confirmDeleteId === p.id}
                            onDetail={() => setDetailPatient(p)}
                            onEdit={() => startEdit(p)}
                            onAskDelete={() => setConfirmDeleteId(p.id)}
                            onConfirmDelete={() => confirmDelete(p.id)}
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
        {patients.length === 0 && (
          <p className="text-center text-gray-400 py-8 text-sm">No hay embarazadas registradas.</p>
        )}
        {patients.length > 0 && filtered.length === 0 && (
          <p className="text-center text-gray-400 py-8 text-sm">{search ? `Sin resultados para "${search}".` : "No tenés embarazadas asignadas."}</p>
        )}
      </div>

      {/* Mobile: tarjetas */}
      <div className="md:hidden space-y-3">
        {filtered.map((p) => {
          const isEditing = editingId === p.id;
          const isBusy = busyId === p.id;
          return (
            <div key={p.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              {isEditing ? (
                <>
                  {renderEditFields({ stacked: true })}
                  <div className="flex gap-3 mt-3">
                    <button
                      onClick={() => saveEdit(p.id)}
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
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-800">
                        {p.nombre} {p.apellido}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">DNI {p.dni}</p>
                      <p className="text-xs text-gray-400">{p.email}</p>
                      <p className="text-xs text-gray-400">
                        Parto: {formatFecha(p.fecha_parto) || "No registrada"}
                      </p>
                      <p className="text-xs text-gray-400">
                        Referente: {p.enfermero_referencia || "Sin asignar"}
                      </p>
                    </div>
                    <button
                      onClick={() => toggleEstado(p)}
                      disabled={isBusy}
                      className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium disabled:opacity-50 ${
                        p.estado === "Activo" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {p.estado}
                    </button>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <ActionIcons
                      patient={p}
                      isBusy={isBusy}
                      confirming={confirmDeleteId === p.id}
                      onDetail={() => setDetailPatient(p)}
                      onEdit={() => startEdit(p)}
                      onAskDelete={() => setConfirmDeleteId(p.id)}
                      onConfirmDelete={() => confirmDelete(p.id)}
                      onCancelDelete={() => setConfirmDeleteId(null)}
                    />
                  </div>
                </>
              )}
            </div>
          );
        })}
        {patients.length === 0 && (
          <p className="text-center text-gray-400 py-8 text-sm bg-white rounded-2xl border border-gray-100">
            No hay embarazadas registradas.
          </p>
        )}
        {patients.length > 0 && filtered.length === 0 && (
          <p className="text-center text-gray-400 py-8 text-sm bg-white rounded-2xl border border-gray-100">
            {search ? `Sin resultados para "${search}".` : "No tenés embarazadas asignadas."}
          </p>
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
