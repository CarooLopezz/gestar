// Gráfico de línea simple en SVG, sin librerías. Los valores van en orden
// cronológico (el primero es el más viejo).
//
// series:      [{ nombre, color, valores: [número] }]
// etiquetas:   texto de cada punto en el eje X (ej. la fecha), mismo largo que valores
// referencias: [{ valor, etiqueta }] líneas punteadas (ej. el límite de alerta)
const W = 600;
const H = 220;
const M = { arriba: 16, abajo: 28, izq: 40, der: 64 };

export default function GraficoLinea({ series, etiquetas, referencias = [], unidad = "" }) {
  const n = etiquetas.length;
  if (n < 2) {
    return (
      <p className="text-sm text-gray-400 py-6 text-center">
        Hacen falta al menos 2 registros para ver la evolución.
      </p>
    );
  }

  const todos = [...series.flatMap((s) => s.valores), ...referencias.map((r) => r.valor)];
  const min = Math.min(...todos);
  const max = Math.max(...todos);
  const margen = Math.max((max - min) * 0.15, 1);
  const yMin = min - margen;
  const yMax = max + margen;

  const x = (i) => M.izq + (i * (W - M.izq - M.der)) / (n - 1);
  const y = (v) => M.arriba + ((yMax - v) * (H - M.arriba - M.abajo)) / (yMax - yMin);
  const marcas = [...new Set([yMin + margen, (yMin + yMax) / 2, yMax - margen].map((v) => Math.round(v)))];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label={series.map((s) => s.nombre).join(" y ")}>
      {marcas.map((v) => (
        <g key={v}>
          <line x1={M.izq} x2={W - M.der} y1={y(v)} y2={y(v)} stroke="#f1f5f9" />
          <text x={M.izq - 6} y={y(v) + 4} textAnchor="end" fontSize="11" fill="#94a3b8">
            {v}
          </text>
        </g>
      ))}

      {referencias.map((r) => (
        <g key={r.etiqueta}>
          <line
            x1={M.izq}
            x2={W - M.der}
            y1={y(r.valor)}
            y2={y(r.valor)}
            stroke="#f87171"
            strokeDasharray="4 4"
          />
          <text x={W - M.der + 4} y={y(r.valor) + 4} fontSize="10" fill="#ef4444">
            {r.etiqueta}
          </text>
        </g>
      ))}

      {series.map((s) => (
        <g key={s.nombre}>
          <polyline
            points={s.valores.map((v, i) => `${x(i)},${y(v)}`).join(" ")}
            fill="none"
            stroke={s.color}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          {s.valores.map((v, i) => (
            <circle key={i} cx={x(i)} cy={y(v)} r={i === n - 1 ? 4.5 : 3} fill={s.color}>
              <title>{`${etiquetas[i]}: ${v}${unidad}`}</title>
            </circle>
          ))}
          <text x={x(n - 1) + 8} y={y(s.valores[n - 1]) + 4} fontSize="12" fontWeight="600" fill={s.color}>
            {s.valores[n - 1]}
          </text>
        </g>
      ))}

      <text x={M.izq} y={H - 8} fontSize="11" fill="#94a3b8">
        {etiquetas[0]}
      </text>
      <text x={W - M.der} y={H - 8} textAnchor="end" fontSize="11" fill="#94a3b8">
        {etiquetas[n - 1]}
      </text>
    </svg>
  );
}
