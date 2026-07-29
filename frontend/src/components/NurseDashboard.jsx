import { useEffect, useState } from "react";
import { api } from "../api/client";
import RegisterPatientForm from "./RegisterPatientForm";
import PatientListTable from "./PatientListTable";
import BloodPressureForm from "./BloodPressureForm";

const NAV_ITEMS = [
  { id: "register", label: "Registrar embarazada", icon: "➕" },
  { id: "list", label: "Lista de usuarios", icon: "📋" },
  { id: "bp", label: "Registrar presión arterial", icon: "🩺" },
];

export default function NurseDashboard({ onLogout, showToast }) {
  const [activeView, setActiveView] = useState("register");
  const [patients, setPatients] = useState([]);
  const [bpRecords, setBpRecords] = useState([]);

  const loadPatients = async () => {
    try {
      setPatients(await api.getPatients());
    } catch (err) {
      showToast(err.message || "No se pudo cargar la lista", false);
    }
  };

  const loadBPRecords = async () => {
    try {
      setBpRecords(await api.getBPRecords());
    } catch (err) {
      showToast(err.message || "No se pudo cargar el historial", false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, []);

  useEffect(() => {
    if (activeView === "list") loadPatients();
    if (activeView === "bp") {
      loadPatients();
      loadBPRecords();
    }
  }, [activeView]);

  return (
    <div className="min-h-screen w-full flex bg-gray-50">
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col shrink-0">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-2">
          <span className="text-2xl">👩‍⚕️</span>
          <span className="font-bold text-purple-700">GESTAR+</span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`sidebar-link w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 ${
                activeView === item.id ? "active bg-purple-50 text-purple-700" : ""
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-100">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-50"
          >
            🚪 Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto">
        {activeView === "register" && (
          <RegisterPatientForm
            onPatientCreated={(p) => setPatients((prev) => [...prev, p])}
            showToast={showToast}
          />
        )}
        {activeView === "list" && <PatientListTable patients={patients} />}
        {activeView === "bp" && (
          <BloodPressureForm
            patients={patients}
            bpRecords={bpRecords}
            onRecordCreated={(r) => setBpRecords((prev) => [r, ...prev])}
            showToast={showToast}
          />
        )}
      </main>
    </div>
  );
}
