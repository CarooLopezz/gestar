import { useState } from "react";
import PatientLoginForm from "./PatientLoginForm";
import SymptomsForm from "./SymptomsForm";
import RecordBloodPressure from "./RecordBloodPressure";
import RecordWeight from "./RecordWeight";
import PatientMessageForm from "./PatientMessageForm";
import ConfirmLogoutModal from "./ConfirmLogoutModal";

const NAV_ITEMS = [
  { id: "symptoms", label: "Síntomas", icon: "🤒" },
  { id: "bp", label: "Presión arterial", icon: "🩺" },
  { id: "weight", label: "Peso", icon: "⚖️" },
  { id: "messages", label: "Mensajes", icon: "💬" },
];

export default function PatientPortal({ onBack, showToast }) {
  const [currentPatient, setCurrentPatient] = useState(null);
  const [activeView, setActiveView] = useState("symptoms");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!currentPatient) {
    return <PatientLoginForm onLogin={setCurrentPatient} onBack={onBack} />;
  }

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
          <span className="text-2xl">🤰</span>
          <span className="font-bold text-pink-600">GESTAR+</span>
        </div>

        <div className="px-6 py-3 border-b border-gray-100 text-xs text-gray-500">
          Hola, {currentPatient.nombre} 👋
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

        <div className="p-3 border-t border-gray-100">
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

      <ConfirmLogoutModal
        open={showLogoutConfirm}
        onCancel={() => setShowLogoutConfirm(false)}
        onConfirm={() => {
          setShowLogoutConfirm(false);
          showToast("Sesión cerrada correctamente.");
          setCurrentPatient(null);
        }}
      />
    </div>
  );
}
