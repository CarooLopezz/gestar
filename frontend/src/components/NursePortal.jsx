import { useEffect, useState } from "react";
import { api } from "../api/client";
import NurseLoginForm from "./NurseLoginForm";
import NurseRegisterForm from "./NurseRegisterForm";
import NurseDashboard from "./NurseDashboard";

// "login" | "register"
export default function NursePortal({ onBack, showToast }) {
  const [nurse, setNurse] = useState(null);
  const [authScreen, setAuthScreen] = useState("login");
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    api
      .getMe()
      .then(setNurse)
      .catch(() => {})
      .finally(() => setCheckingSession(false));
  }, []);

  const handleLogout = async () => {
    try {
      await api.logoutNurse();
    } catch {
      // la sesión puede haber expirado igual; se limpia del lado del cliente
    }
    setNurse(null);
    setAuthScreen("login");
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-b from-purple-50 to-pink-50">
        <p className="text-gray-400 text-sm">Cargando...</p>
      </div>
    );
  }

  if (!nurse) {
    if (authScreen === "register") {
      return (
        <NurseRegisterForm
          onRegistered={setNurse}
          onBack={onBack}
          onGoToLogin={() => setAuthScreen("login")}
        />
      );
    }
    return (
      <NurseLoginForm
        onLogin={setNurse}
        onBack={onBack}
        onGoToRegister={() => setAuthScreen("register")}
      />
    );
  }

  return <NurseDashboard nurse={nurse} onLogout={handleLogout} showToast={showToast} />;
}
