import { useEffect, useState } from "react";
import { api } from "../api/client";
import RegisterUserForm from "./RegisterUserForm";
import PatientListTable from "./PatientListTable";
import BloodPressureForm from "./BloodPressureForm";
import WeightForm from "./WeightForm";
import SymptomsFormNurse from "./SymptomsFormNurse";
import AlertsPanel from "./AlertsPanel";
import NurseListTable from "./NurseListTable";
import ConfirmLogoutModal from "./ConfirmLogoutModal";

const NAV_ITEMS = [
  { id: "register", label: "Registrar", icon: "➕" },
  { id: "list", label: "Lista de usuarios", icon: "📋" },
  { id: "bp", label: "Registrar presión arterial", icon: "🩺" },
  { id: "weight", label: "Registrar peso", icon: "⚖️" },
  { id: "symptoms", label: "Registrar síntomas", icon: "🤒" },
  { id: "alerts", label: "Alertas", icon: "🚨" },
];

export default function NurseDashboard({ nurse, onLogout, showToast }) {
  const [activeView, setActiveView] = useState("register");
  const [patients, setPatients] = useState([]);
  const [bpRecords, setBpRecords] = useState([]);
  const [weightRecords, setWeightRecords] = useState([]);
  const [symptomRecords, setSymptomRecords] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [nurses, setNurses] = useState([]);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  const loadSymptomRecords = withSessionGuard(async () => {
    setSymptomRecords(await api.getAllSymptoms());
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
    if (activeView === "symptoms") {
      loadPatients();
      loadSymptomRecords();
    }
    if (activeView === "alerts") loadAlerts();
  }, [activeView]);

  const handleNavClick = (id) => {
    setActiveView(id);
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen w-full flex bg-gray-50">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-100 flex flex-col shrink-0 transform transition-transform duration-200 md:static md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
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
              onClick={() => handleNavClick(item.id)}
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
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-50"
          >
            🚪 Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden flex items-center gap-3 bg-white border-b border-gray-100 px-4 py-3 sticky top-0 z-20">
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menú"
            className="text-xl px-2 py-1 rounded-lg hover:bg-gray-50"
          >
            ☰
          </button>
          <span className="font-bold text-purple-700">GESTAR+</span>
        </header>

        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        {activeView === "register" && (
          <RegisterUserForm
            onPatientCreated={(p) => setPatients((prev) => [...prev, p])}
            onNurseCreated={(n) => setNurses((prev) => [...prev, n])}
            showToast={showToast}
          />
        )}
        {activeView === "list" && (
          <div className="space-y-8">
            <PatientListTable
              patients={patients}
              onPatientUpdated={(updated) =>
                setPatients((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
              }
              onPatientDeleted={(id) => setPatients((prev) => prev.filter((p) => p.id !== id))}
              showToast={showToast}
            />
            <NurseListTable
              nurses={nurses}
              currentNurseId={nurse?.id}
              onNurseUpdated={(updated) =>
                setNurses((prev) => prev.map((n) => (n.id === updated.id ? updated : n)))
              }
              onNurseDeleted={(id) => {
                setNurses((prev) => prev.filter((n) => n.id !== id));
                if (id === nurse?.id) {
                  showToast("Eliminaste tu propia cuenta.");
                  onLogout();
                }
              }}
              showToast={showToast}
            />
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
        {activeView === "symptoms" && (
          <SymptomsFormNurse
            patients={patients}
            symptomRecords={symptomRecords}
            onRecordCreated={(r) => setSymptomRecords((prev) => [r, ...prev])}
            showToast={showToast}
          />
        )}
        {activeView === "alerts" && <AlertsPanel alerts={alerts} />}
        </main>
      </div>

      <ConfirmLogoutModal
        open={showLogoutConfirm}
        onCancel={() => setShowLogoutConfirm(false)}
        onConfirm={() => {
          setShowLogoutConfirm(false);
          showToast("Sesión cerrada correctamente.");
          onLogout();
        }}
      />
     </div>
   );
 }