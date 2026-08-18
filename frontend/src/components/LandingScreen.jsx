export default function LandingScreen({ onOpenNurse, onOpenPatient }) {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-b from-purple-50 to-pink-50 gap-6 px-4">
      <div className="text-6xl">🤰</div>
      <h1 className="text-3xl font-bold text-purple-700">GESTAR+</h1>
      <p className="text-gray-500 text-center max-w-xs">
        Seguimiento de embarazo: presión arterial y síntomas, todo en un mismo lugar.
      </p>

      <div className="flex flex-col gap-3 w-full max-w-xs mt-4">
        <button
          onClick={onOpenNurse}
          className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 rounded-xl shadow-sm transition"
        >
          👩‍⚕️ Ingresar como enfermero
        </button>
        <button
          onClick={onOpenPatient}
          className="flex items-center justify-center gap-2 bg-pink-500 hover:bg-pink-600 text-white font-medium py-3 rounded-xl shadow-sm transition"
        >
          🤰 Ingresar como paciente
        </button>
      </div>
    </div>
  );
}
