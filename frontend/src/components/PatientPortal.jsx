import { useEffect, useState } from "react";
import { api } from "../api/client";
import BasculaIcon from "./BasculaIcon";
import PatientLoginForm from "./PatientLoginForm";
import SymptomsForm from "./SymptomsForm";
import RecordBloodPressure from "./RecordBloodPressure";
import RecordWeight from "./RecordWeight";
import PatientMessageForm from "./PatientMessageForm";
import ConfirmLogoutModal from "./ConfirmLogoutModal";
import ChatbotWidget from "./ChatbotWidget";
import CambiarContrasenaModal from "./CambiarContrasenaModal";
import { borrarConversacion } from "../utils/chatbot";
import PatientAgenda from "./PatientAgenda";
import CentrosMapa from "./CentrosMapa";

const NAV_ITEMS = [
  { id: "agenda", label: "Agenda", icon: "📅" },
  { id: "symptoms", label: "Síntomas", icon: "🤒" },
  { id: "bp", label: "Presión arterial", icon: "🩺" },
  { id: "weight", label: "Peso", icon: <BasculaIcon /> },
  { id: "messages", label: "Mensajes", icon: "💬" },
  { id: "centros", label: "Centros de salud", icon: "🏥" },
];

export default function PatientPortal({ onBack, showToast }) {
  const [currentPatient, setCurrentPatient] = useState(null);
  const [activeView, setActiveView] = useState("agenda");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [cambiandoContrasena, setCambiandoContrasena] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [recordatorio, setRecordatorio] = useState({ hora_recordatorio: "", ya_registro_hoy: true });
  const [monitoreo, setMonitoreo] = useState({ necesita_control: false, dias_sin_control: null });

  const loadRecordatorio = async (dni) => {
    try {
      const data = await api.getRecordatorio(dni);
      setRecordatorio({
        hora_recordatorio: data.hora_recordatorio || "",
        ya_registro_hoy: data.ya_registro_hoy,
      });
    } catch {
      // no es crítico si falla, simplemente no se muestra el aviso
    }
  };

  const loadMonitoreo = async (dni) => {
    try {
      setMonitoreo(await api.getOwnMonitoringStatus(dni));
    } catch {
      // no es crítico si falla, simplemente no se muestra el aviso
    }
  };

  useEffect(() => {
    if (currentPatient) {
      loadRecordatorio(currentPatient.dni);
      loadMonitoreo(currentPatient.dni);
    }
  }, [currentPatient, activeView]);

  if (!currentPatient) {
    return <PatientLoginForm onLogin={setCurrentPatient} onBack={onBack} />;
  }

  const handleNavClick = (id) => {
    setActiveView(id);
    setSidebarOpen(false);
  };

  const handleHoraChange = async (e) => {
    const hora = e.target.value;
    setRecordatorio((prev) => ({ ...prev, hora_recordatorio: hora }));
    try {
      await api.setRecordatorio(currentPatient.dni, hora);
      showToast(hora ? `Te vamos a recordar cargar tu presión a las ${hora}.` : "Recordatorio desactivado.");
    } catch (err) {
      showToast(err.message || "No se pudo guardar el recordatorio", false);
    }
  };

  const mostrarAviso = recordatorio.hora_recordatorio && !recordatorio.ya_registro_hoy;

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
          <img src="/logo.png" alt="" className="h-8 w-auto" />
          <span className="font-bold text-pink-600">GESTAR+</span>
        </div>

        <div className="px-6 py-3 border-b border-gray-100 text-xs text-gray-500">
          Hola, {currentPatient.nombre} 👋
          <p className="mt-1">
            Tu enfermera/o de referencia:{" "}
            <span className="font-medium text-gray-700">
              {currentPatient.enfermero_referencia || "todavía sin asignar"}
            </span>
          </p>
        </div>

        <div className="px-6 py-3 border-b border-gray-100">
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Recordatorio diario de presión
          </label>
          <input
            type="time"
            value={recordatorio.hora_recordatorio}
            onChange={handleHoraChange}
            className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
          />
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 ${
                activeView === item.id ? "bg-pink-50 text-pink-700" : ""
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-100 space-y-1">
          <button
            onClick={() => setCambiandoContrasena(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-50"
          >
            🔑 Cambiar contraseña
          </button>
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-50"
          >
            🚪 Salir
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
          <span className="font-bold text-pink-600">GESTAR+</span>
        </header>

        <main className="flex-1 p-4 md:p-8 overflow-y-auto flex flex-col items-center">
          {monitoreo.necesita_control && (
            <div className="w-full max-w-lg mb-4 bg-red-50 border border-red-200 text-red-800 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
              <span className="text-lg">🩺</span>
              <span>
                {monitoreo.dias_sin_control === null
                  ? "Todavía no cargaste ningún control (presión, peso o síntomas). Te recomendamos empezar hoy."
                  : `No te controlaste hace ${monitoreo.dias_sin_control} días. Te recomendamos cargar tus datos.`}
              </span>
            </div>
          )}

          {mostrarAviso && (
            <button
              onClick={() => handleNavClick("bp")}
              className="w-full max-w-lg mb-4 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-xl px-4 py-3 flex items-center gap-2 text-left hover:bg-amber-100 transition"
            >
              <span className="text-lg">⏰</span>
              <span>
                Todavía no cargaste tu presión hoy — tu recordatorio era a las{" "}
                {recordatorio.hora_recordatorio}. Tocá acá para registrarla.
              </span>
            </button>
          )}

          {activeView === "agenda" && <PatientAgenda patient={currentPatient} showToast={showToast} />}
          {activeView === "centros" && <CentrosMapa />}
          {activeView === "symptoms" && (
            <SymptomsForm patient={currentPatient} showToast={showToast} />
          )}
          {activeView === "bp" && (
            <RecordBloodPressure patient={currentPatient} showToast={showToast} />
          )}
          {activeView === "weight" && (
            <RecordWeight patient={currentPatient} showToast={showToast} />
          )}
          {activeView === "messages" && (
            <PatientMessageForm patient={currentPatient} showToast={showToast} />
          )}
        </main>
      </div>

      <ChatbotWidget patient={currentPatient} />

      {cambiandoContrasena && (
        <CambiarContrasenaModal
          tipo="paciente"
          email={currentPatient.email}
          onCerrar={() => setCambiandoContrasena(false)}
          showToast={showToast}
          anillo="focus:ring-pink-300"
        />
      )}

      <ConfirmLogoutModal
        open={showLogoutConfirm}
        onCancel={() => setShowLogoutConfirm(false)}
        onConfirm={() => {
          setShowLogoutConfirm(false);
          showToast("Sesión cerrada correctamente.");
          // Una sesión nueva empieza con la bienvenida del asistente.
          borrarConversacion(currentPatient.dni);
          setCurrentPatient(null);
        }}
      />
    </div>
  );
}
