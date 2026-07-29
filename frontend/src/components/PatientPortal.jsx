import { useState } from "react";
import PatientLoginForm from "./PatientLoginForm";
import SymptomsForm from "./SymptomsForm";

export default function PatientPortal({ onBack, showToast }) {
  const [currentPatient, setCurrentPatient] = useState(null);

  if (!currentPatient) {
    return <PatientLoginForm onLogin={setCurrentPatient} onBack={onBack} />;
  }

  return (
    <SymptomsForm
      patient={currentPatient}
      onLogout={() => setCurrentPatient(null)}
      showToast={showToast}
    />
  );
}
