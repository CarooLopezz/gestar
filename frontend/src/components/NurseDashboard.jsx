import { useEffect, useState } from "react";
import { api } from "../api/client";
import BasculaIcon from "./BasculaIcon";
import RegisterUserForm from "./RegisterUserForm";
import PatientListTable from "./PatientListTable";
import BloodPressureForm from "./BloodPressureForm";
import WeightForm from "./WeightForm";
import SymptomsFormNurse from "./SymptomsFormNurse";
import AlertsPanel from "./AlertsPanel";
import MessagesPanel from "./MessagesPanel";
import MonitoringPanel from "./MonitoringPanel";
import NurseListTable from "./NurseListTable";
import ConfirmLogoutModal from "./ConfirmLogoutModal";
import Agenda from "./Agenda";
import PanelGeneral from "./PanelGeneral";
import FichaPaciente from "./FichaPaciente";
import SeccionGraficos from "./SeccionGraficos";

// Cada ítem del menú agrupa una o más pantallas (views); las que van juntas
// se muestran como pestañas (TABS). El ítem abre la primera.
const NAV_ITEMS = [
  { id: "panel", label: "Panel", icon: "📊", views: ["panel"] },
  { id: "usuarios", label: "Usuarios", icon: "👥", views: ["list", "register"] },
  { id: "controles", label: "Controles", icon: "🩺", views: ["bp", "weight", "symptoms"] },
  { id: "alertas", label: "Alertas", icon: "🚨", views: ["alerts", "monitoring"] },
  { id: "mensajes", label: "Mensajes", icon: "💬", views: ["messages"] },
  { id: "turnos", label: "Turnos", icon: "📅", views: ["agenda"] },
  { id: "metricas", label: "Métricas", icon: "📈", views: ["graficos"] },
];

const TABS = {
  controles: [
    { id: "bp", label: "Presión arterial", icon: "🩺" },
    { id: "weight", label: "Peso", icon: <BasculaIcon /> },
    { id: "symptoms", label: "Síntomas", icon: "🤒" },
  ],
  alertas: [
    { id: "alerts", label: "Alertas", icon: "🚨" },
    { id: "monitoring", label: "Monitoreo", icon: "📡" },
  ],
};

function Pestanas({ tabs, activa, onCambiar }) {
  return (
    <div role="tablist" className="flex flex-wrap gap-1 border-b border-gray-200 mb-6">
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          aria-selected={activa === t.id}
          onClick={() => onCambiar(t.id)}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium -mb-px border-b-2 ${
            activa === t.id
              ? "border-purple-600 text-purple-700"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <span>{t.icon}</span>
          {t.label}
        </button>
      ))}
    </div>
  );
}

export default function NurseDashboard({ nurse, onLogout, showToast }) {
  const [activeView, setActiveView] = useState("panel");
  const [fichaPatient, setFichaPatient] = useState(null);
  const [patients, setPatients] = useState([]);
  const [bpRecords, setBpRecords] = useState([]);
  const [weightRecords, setWeightRecords] = useState([]);
  const [symptomRecords, setSymptomRecords] = useState([]);
  const [messages, setMessages] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [monitoring, setMonitoring] = useState([]);
  const [appointments, setAppointments] = useState([]);
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

  const loadMessages = withSessionGuard(async () => {
    setMessages(await api.getAllMessages());
  });

  const loadAlerts = withSessionGuard(async () => {
    setAlerts(await api.getAlerts());
  });

  const loadMonitoring = withSessionGuard(async () => {
    setMonitoring(await api.getMonitoringNotifications());
  });

  const loadAppointments = withSessionGuard(async () => {
    setAppointments(await api.getAppointments());
  });

  const loadNurses = withSessionGuard(async () => {
    setNurses(await api.getNurses());
  });

  // Alertas y mensajes se cargan al entrar para mostrar en el menú cuántos
  // faltan responder.
  useEffect(() => {
    loadPatients();
    loadNurses();
    loadAlerts();
    loadMessages();
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
    if (activeView === "messages") loadMessages();
    if (activeView === "alerts") {
      loadPatients();
      loadAlerts();
    }
    if (activeView === "monitoring") loadMonitoring();
    if (activeView === "agenda") {
      loadPatients();
      loadAppointments();
    }
    if (activeView === "graficos") {
      loadPatients();
      loadMonitoring();
      loadBPRecords();
      loadWeightRecords();
      loadSymptomRecords();
    }
    if (activeView === "panel") {
      loadPatients();
      loadAlerts();
      loadMonitoring();
      loadAppointments();
    }
  }, [activeView]);

  const handleNavClick = (view) => {
    setActiveView(view);
    setFichaPatient(null);
    setSidebarOpen(false);
  };

  const grupoActivo = NAV_ITEMS.find((item) => item.views.includes(activeView));
  const pendientes = {
    alertas: alerts.filter((a) => !a.respuesta).length,
    mensajes: messages.filter((m) => !m.respuesta).length,
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
              onClick={() => handleNavClick(item.views[0])}
              className={`sidebar-link w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 ${
                grupoActivo?.id === item.id ? "active bg-purple-50 text-purple-700" : ""
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
              {pendientes[item.id] > 0 && (
                <span
                  className="ml-auto min-w-[1.5rem] px-1.5 py-0.5 rounded-full bg-red-500 text-white text-xs font-semibold text-center"
                  aria-label={`${pendientes[item.id]} sin responder`}
                >
                  {pendientes[item.id]}
                </span>
              )}
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
        {TABS[grupoActivo?.id] && (
          <Pestanas tabs={TABS[grupoActivo.id]} activa={activeView} onCambiar={setActiveView} />
        )}
        {activeView === "graficos" && (
          <SeccionGraficos
            patients={patients}
            monitoring={monitoring}
            bpRecords={bpRecords}
            weightRecords={weightRecords}
            symptomRecords={symptomRecords}
          />
        )}
        {activeView === "panel" &&
          (fichaPatient ? (
            <FichaPaciente patient={fichaPatient} onVolver={() => setFichaPatient(null)} showToast={showToast} />
          ) : (
            <PanelGeneral
              patients={patients}
              alerts={alerts}
              monitoring={monitoring}
              appointments={appointments}
              currentNurseId={nurse?.id}
              onVerFicha={setFichaPatient}
              onIr={handleNavClick}
            />
          ))}
        {activeView === "register" && (
          <div className="space-y-4">
            <button onClick={() => setActiveView("list")} className="text-sm text-purple-600 hover:text-purple-800">
              ← Volver a usuarios
            </button>
            <RegisterUserForm
              nurses={nurses}
              currentNurseId={nurse?.id}
              onPatientCreated={(p) => {
                setPatients((prev) => [...prev, p]);
                setActiveView("list");
              }}
              onNurseCreated={(n) => {
                setNurses((prev) => [...prev, n]);
                setActiveView("list");
              }}
              showToast={showToast}
            />
          </div>
        )}
        {activeView === "list" && (
          <div className="space-y-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-2xl font-semibold text-gray-800">Usuarios</h2>
              <button
                onClick={() => setActiveView("register")}
                className="bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
              >
                + Registrar
              </button>
            </div>
            <PatientListTable
              patients={patients}
              nurses={nurses}
              currentNurseId={nurse?.id}
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
        {activeView === "messages" && (
          <MessagesPanel
            messages={messages}
            onMessageUpdated={(updated) =>
              setMessages((prev) => prev.map((m) => (m.id === updated.id ? updated : m)))
            }
            showToast={showToast}
          />
        )}
        {activeView === "alerts" && (
          <AlertsPanel
            alerts={alerts}
            patients={patients}
            currentNurseId={nurse?.id}
            onAlertUpdated={(updated) =>
              setAlerts((prev) =>
                prev.map((a) => (a.tipo === updated.tipo && a.id === updated.id ? updated : a))
              )
            }
            onAlertDismissed={(dismissed) =>
              setAlerts((prev) =>
                prev.filter((a) => !(a.tipo === dismissed.tipo && a.id === dismissed.id))
              )
            }
            showToast={showToast}
          />
        )}
        {activeView === "monitoring" && <MonitoringPanel notifications={monitoring} currentNurseId={nurse?.id} />}
        {activeView === "agenda" && (
          <Agenda
            patients={patients}
            appointments={appointments}
            onAppointmentCreated={(a) =>
              setAppointments((prev) =>
                [...prev, a].sort((x, y) => (x.fecha + x.hora).localeCompare(y.fecha + y.hora))
              )
            }
            onAppointmentUpdated={(updated) =>
              setAppointments((prev) => prev.map((a) => (a.id === updated.id ? updated : a)))
            }
            onAppointmentDeleted={(id) => setAppointments((prev) => prev.filter((a) => a.id !== id))}
            showToast={showToast}
          />
        )}
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