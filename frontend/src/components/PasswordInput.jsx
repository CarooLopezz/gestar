import { useState } from "react";

export default function PasswordInput({ value, onChange, focusRingClass = "focus:ring-purple-300" }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        type={visible ? "text" : "password"}
        value={value}
        onChange={onChange}
        className={`w-full border border-gray-200 rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 ${focusRingClass}`}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        tabIndex={-1}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
      >
        {visible ? "🙈" : "👁️"}
      </button>
    </div>
  );
}
