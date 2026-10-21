// Gráfico de barras verticales en SVG, sin librerías.
// barras: [{ etiqueta, valor, color? }]
const W = 600;
const H = 220;
const M = { arriba: 22, abajo: 30, izq: 8, der: 8 };

export default function GraficoBarras({ barras, color = "#7c3aed", etiquetaCada = 1 }) {
  const max = Math.max(1, ...barras.map((b) => b.valor));
  const ancho = (W - M.izq - M.der) / barras.length;
  const alto = H - M.arriba - M.abajo;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full h-auto"
      role="img"
      aria-label={barras.map((b) => `${b.etiqueta}: ${b.valor}`).join(", ")}
    >
      <line x1={M.izq} x2={W - M.der} y1={H - M.abajo} y2={H - M.abajo} stroke="#e2e8f0" />
      {barras.map((b, i) => {
        const h = (b.valor / max) * alto;
        const x = M.izq + i * ancho;
        const cx = x + ancho / 2;
        return (
          <g key={b.etiqueta}>
            <rect
              x={x + ancho * 0.15}
              y={H - M.abajo - h}
              width={ancho * 0.7}
              height={h}
              rx="4"
              fill={b.color || color}
            >
              <title>{`${b.etiqueta}: ${b.valor}`}</title>
            </rect>
            {b.valor > 0 && (
              <text x={cx} y={H - M.abajo - h - 6} textAnchor="middle" fontSize="12" fontWeight="600" fill="#334155">
                {b.valor}
              </text>
            )}
            {i % etiquetaCada === 0 && (
              <text x={cx} y={H - 10} textAnchor="middle" fontSize="11" fill="#64748b">
                {b.etiqueta}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
