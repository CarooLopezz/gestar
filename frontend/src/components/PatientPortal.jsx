import { useState } from "react";
import PatientLoginForm from "./PatientLoginForm";
import SymptomsForm from "./SymptomsForm";
import RecordBloodPressure from "./RecordBloodPressure";
import ConfirmLogoutModal from "./ConfirmLogoutModal";

export default function PatientPortal({ onBack, showToast }) {
  const [currentPatient, setCurrentPatient] = useState(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  if (!currentPatient) {
    return <PatientLoginForm onLogin={setCurrentPatient} onBack={onBack} />;
  }

  return (
    <div className="min-h-screen w-full bg-gray-50 px-4 py-8 flex flex-col items-center">
      <div className="w-full max-w-lg flex justify-between items-center mb-6">
        <h1 className="text-lg font-semibold text-gray-800">
          Hola, {currentPatient.nombre} 👋
        </h1>
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="text-sm text-gray-400 hover:text-gray-600"
        >
          Salir
        </button>
      </div>

      <SymptomsForm patient={currentPatient} showToast={showToast} />
      <RecordBloodPressure patient={currentPatient} showToast={showToast} />

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
