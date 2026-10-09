import { useState } from "react";

export default function PregnancyTrimesterCalculator() {
  const [weeks, setWeeks] = useState("");
  const [days, setDays] = useState("0");
  const [result, setResult] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    const completedWeeks = Number(weeks);
    const additionalDays = Number(days);

    if (
      weeks === "" ||
      !Number.isInteger(completedWeeks) ||
      completedWeeks < 0 ||
      completedWeeks > 42 ||
      !Number.isInteger(additionalDays) ||
      additionalDays < 0 ||
      additionalDays > 6
    ) {
      setResult({ error: "Ingresá semanas entre 0 y 42 y días entre 0 y 6." });
      return;
    }

    const gestationalDays = completedWeeks * 7 + additionalDays;
    const trimester =
      gestationalDays < 14 * 7 ? 1 : gestationalDays < 28 * 7 ? 2 : 3;

    setResult({ trimester, completedWeeks, additionalDays });
  };

  return (
    <section className="fade-in w-full max-w-lg">
      <h2 className="text-xl font-semibold text-gray-800 mb-2">Calculadora de trimestre</h2>
      <p className="text-sm text-gray-500 mb-4">
        Ingresá las semanas y los días de gestación indicados en el último control.
      </p>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4"
      >
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="gestational-weeks" className="block text-sm font-medium text-gray-600 mb-1">
              Semanas completas
            </label>
            <input
              id="gestational-weeks"
              type="number"
              min="0"
              max="42"
              step="1"
              required
              value={weeks}
              onChange={(e) => setWeeks(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-300"
            />
          </div>
          <div>
            <label htmlFor="gestational-days" className="block text-sm font-medium text-gray-600 mb-1">
              Días adicionales
            </label>
            <select
              id="gestational-days"
              value={days}
              onChange={(e) => setDays(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-300"
            >
              {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-pink-500 hover:bg-pink-600 text-white font-medium py-2.5 rounded-lg transition"
        >
          Calcular trimestre
        </button>

        {result?.error && (
          <p role="alert" className="text-red-600 text-sm">
            {result.error}
          </p>
        )}
        {result?.trimester && (
          <p
            role="status"
            className="rounded-lg bg-pink-50 px-4 py-3 text-sm text-pink-800"
          >
            Con {result.completedWeeks} semanas y {result.additionalDays} días, corresponde al{" "}
            <strong>{result.trimester}° trimestre</strong>.
          </p>
        )}

        <p className="text-xs text-gray-400">
          Referencia: 1° hasta 13 semanas y 6 días; 2° desde 14 semanas hasta 27 semanas y 6
          días; 3° desde 28 semanas. Confirmá la edad gestacional con el equipo de salud.
        </p>
      </form>
    </section>
  );
}
