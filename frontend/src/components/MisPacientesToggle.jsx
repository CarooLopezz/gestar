// Filtro "Mis pacientes": muestra solo las embarazadas de las que el
// enfermero logueado es referente. Es un filtro de vista, no de permisos:
// apagado, se ven todas.
export default function MisPacientesToggle({ checked, onChange }) {
  return (
    <label className="inline-flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="accent-purple-600"
      />
      Solo mis pacientes
    </label>
  );
}
