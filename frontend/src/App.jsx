import { useState } from "react";
import LandingScreen from "./components/LandingScreen";
import NursePortal from "./components/NursePortal";
import PatientPortal from "./components/PatientPortal";
import Toast from "./components/Toast";
import { useToast } from "./hooks/useToast";

// "landing" | "nurse" | "patient"
export default function App() {
  const [screen, setScreen] = useState("landing");
  const { toast, showToast } = useToast();

  return (
    <div className="relative">
      <Toast toast={toast} />

      {screen === "landing" && (
        <LandingScreen
          onOpenNurse={() => setScreen("nurse")}
          onOpenPatient={() => setScreen("patient")}
        />
      )}

      {screen === "nurse" && (
        <NursePortal onBack={() => setScreen("landing")} showToast={showToast} />
      )}

      {screen === "patient" && (
        <PatientPortal onBack={() => setScreen("landing")} showToast={showToast} />
      )}
    </div>
  );
}
