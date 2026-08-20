import { useEffect, useState } from "react";
import { api } from "../api/client";
import RegisterPatientForm from "./RegisterPatientForm";
import PatientListTable from "./PatientListTable";
import BloodPressureForm from "./BloodPressureForm";
import WeightForm from "./WeightForm";
import AlertsPanel from "./AlertsPanel";
import NurseListTable from "./NurseListTable";

const NAV_ITEMS = [
  { id: "register", label: "Registrar embarazada", icon: "➕" },
  { id: "list", label: "Lista de usuarios", icon: "📋" },
  { id: "bp", label: "Registrar presión arterial", icon: "🩺" },
  { id: "weight", label: "Registrar peso", icon: "⚖️" },
  { id: "alerts", label: "Alertas", icon: "🚨" },
];

export default function NurseDashboard({ nurse, onLogout, showToast }) {
  const [activeView, setActiveView] = useState("register");
  const [patients, setPatients] = useState([]);
  const [bpRecords, setBpRecords] = useState([]);
  const [weightRecords, setWeightRecords] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [nurses, setNurses] = useState([]);

  const withSessionGuard = (fn) => async (...args) => {
    try {
      await fn(...args);
    } catch (err) {
      if (err.status === 401) {
        showToast("Tu sesión expiró. Iniciá sesión de nuevo.", false);
        onLogout();
        return;
      }
      throw err;
    }
  };

  const loadPatients = withSessionGuard(async () => {
    setPatients(await api.getPatients());
  });

  const loadBPRecords = withSessionGuard(async () => {
    setBpRecords(await api.getBPRecords());
  });

  const loadWeightRecords = withSessionGuard(async () => {
    setWeightRecords(await api.getWeights());
  });

  const loadAlerts = withSessionGuard(async () => {
    setAlerts(await api.getAlerts());
  });

  const loadNurses = withSessionGuard(async () => {
    setNurses(await api.getNurses());
  });

  useEffect(() => {
    loadPatients();
  }, []);

  useEffect(() => {
    if (activeView === "list") {
      loadPatients();
      loadNurses();
    }
    if (activeView === "bp") {
      loadPatients();
      loadBPRecords();
    }
    if (activeView === "weight") {
      loadPatients();
      loadWeightRecords();
    }
    if (activeView === "alerts") loadAlerts();
  }, [activeView]);

  return (
    <div className="min-h-screen w-full flex bg-gray-50">
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col shrink-0">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-2">
          <span className="text-2xl">👩‍⚕️</span>
          <span className="font-bold text-purple-700">GESTAR+</span>
        </div>

        {nurse && (
          <div className="px-6 py-3 border-b border-gray-100 text-xs text-gray-500">
            {nurse.nombre} {nurse.apellido}
          </div>
        )}

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
        {activeView === "list" && (
          <div className="space-y-8">
            <PatientListTable patients={patients} />
            <NurseListTable nurses={nurses} />
          </div>
        )}
        {activeView === "bp" && (
          <BloodPressureForm
            patients={patients}
            bpRecords={bpRecords}
            onRecordCreated={(r) => setBpRecords((prev) => [r, ...prev])}
            showToast={showToast}
          />
        )}
        {activeView === "weight" && (
          <WeightForm
            patients={patients}
            weightRecords={weightRecords}
            onRecordCreated={(r) => {
              setWeightRecords((prev) => [r, ...prev]);
              if (r.alerta) setAlerts((prev) => [r, ...prev]);
            }}
            showToast={showToast}
          />
        )}
        {activeView === "alerts" && <AlertsPanel alerts={alerts} />}
      </main>
    </div>
  );
}
