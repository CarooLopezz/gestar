// Báscula de baño para "Peso". No hay emoji de báscula (⚖️ es una balanza de
// justicia), así que se dibuja; mide 1em para alinearse con los emojis del menú.
export default function BasculaIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="1.4em"
      height="1.4em"
      aria-hidden="true"
      className="inline-block align-[-0.3em] -mx-[0.1em]"
    >
      <rect x="3" y="3" width="18" height="18" rx="4" fill="#ccfbf1" stroke="#0f766e" strokeWidth="1.6" />
      <path d="M7.5 9.5a4.5 4.5 0 0 1 9 0z" fill="#ffffff" stroke="#0f766e" strokeWidth="1.4" />
      <path d="M12 9.5l1.8-2.6" stroke="#dc2626" strokeWidth="1.4" strokeLinecap="round" />
      <rect x="6.5" y="14" width="4" height="4" rx="1" fill="#99f6e4" />
      <rect x="13.5" y="14" width="4" height="4" rx="1" fill="#99f6e4" />
    </svg>
  );
}
