// Quadrillage de cubes : « 4 rangées de 6 ». Les rangées apparaissent une à une pour aider à compter.

const COLORS = ['#ffa7c7', '#86c8ff', '#8fe3c2', '#ffd76f', '#c3a2ff', '#ffb36b']

export function CubeArray({ rows, cols }: { rows: number; cols: number }) {
  const s = 26
  const gap = 6
  const extra = (c: number) => Math.floor(c / 5) * 6 // petit espace tous les 5 pour compter
  const w = cols * (s + gap) + extra(cols - 1) + 10
  const h = rows * (s + gap) + 12
  return (
    <svg className="cube-array" viewBox={`-4 -4 ${w} ${h}`} role="img" aria-label={`${rows} rangées de ${cols} cubes`}>
      {Array.from({ length: rows }).map((_, r) => {
        const color = COLORS[r % COLORS.length]
        return (
          <g key={r} className="cube-row" style={{ animationDelay: `${r * 0.12}s` }}>
            {Array.from({ length: cols }).map((__, c) => {
              const x = c * (s + gap) + extra(c)
              const y = r * (s + gap)
              return (
                <g key={c} transform={`translate(${x} ${y})`}>
                  <rect y={3} width={s} height={s} rx={7} fill={color} style={{ filter: 'brightness(.82)' }} />
                  <rect width={s} height={s} rx={7} fill={color} />
                  <rect x={4} y={4} width={s - 8} height={7} rx={3.5} fill="#fff" opacity={0.5} />
                </g>
              )
            })}
          </g>
        )
      })}
    </svg>
  )
}
