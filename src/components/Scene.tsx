import { SceneKind } from '../game/missions'
import { Cat } from './Cat'
import { CoatId } from '../game/catalog'
import { Cube } from './Sprites'

/** Bandeau d'aventure qui avance à chaque bonne réponse. */
export function Scene({ kind, step, total, coat }: { kind: SceneKind; step: number; total: number; coat: CoatId }) {
  const p = Math.min(1, step / total)
  if (kind === 'train') {
    const x = 30 + p * 470
    return (
      <svg className="scene" viewBox="0 0 600 120">
        <path d="M 0 100 H 600" stroke="#b88758" strokeWidth={6} />
        {Array.from({ length: 30 }).map((_, i) => <rect key={i} x={i * 20 + 4} y={97} width={10} height={10} fill="#8a6447" />)}
        <g className="cloud-drift" fill="#fff" opacity={0.85}><ellipse cx={120} cy={24} rx={30} ry={10} /><ellipse cx={420} cy={34} rx={36} ry={11} /></g>
        <g transform={`translate(540 50)`}><rect x={-18} y={0} width={46} height={44} rx={4} fill="#ffd9a8" /><path d="M -24 0 L 5 -22 L 34 0 Z" fill="#ff8fb3" /><text x={5} y={30} textAnchor="middle" fontSize={14}>🚉</text></g>
        <g style={{ transform: `translateX(${x}px)`, transition: 'transform .8s cubic-bezier(.3,1.4,.5,1)' }}>
          <rect x={-60} y={66} width={44} height={28} rx={6} fill="#7fb6ff" />
          <rect x={-10} y={56} width={56} height={38} rx={8} fill="#ff8fb3" />
          <rect x={26} y={44} width={12} height={16} fill="#5b4a7a" />
          {[-48, -28, 2, 30].map((c) => <circle key={c} cx={c} cy={96} r={7} fill="#5b4a7a" />)}
          <g transform="translate(-58 34) scale(0.36)"><Cat coat={coat} mood="happy" size={110} /></g>
          {step > 0 && <circle className="puff" cx={32} cy={36} r={8} fill="#fff" opacity={0.8} />}
        </g>
      </svg>
    )
  }
  if (kind === 'tower') {
    const levels = Math.round(p * total)
    return (
      <svg className="scene" viewBox="0 0 600 140">
        <ellipse cx={300} cy={128} rx={160} ry={10} fill="#000" opacity={0.08} />
        <path d="M 160 128 h 280" stroke="#8bd86b" strokeWidth={8} strokeLinecap="round" />
        <g transform="translate(300 124)">
          {Array.from({ length: total }).map((_, i) => (
            <g key={i} transform={`translate(0 ${-i * 16})`} opacity={i < levels ? 1 : 0.18} className={i === levels - 1 ? 'pop-in' : ''}>
              <Cube s={30} h={16} color={i % 2 ? '#e8dccf' : '#d9cbbd'} top="#f6ede3" />
            </g>
          ))}
          {levels >= total && (
            <g transform={`translate(0 ${-total * 16 - 4})`} className="pop-in">
              <path d="M -30 0 L 0 -40 L 30 0 Z" fill="#6fa8ff" /><path d="M 0 -40 l 10 4 -10 4" fill="#ff8fc0" />
            </g>
          )}
        </g>
        <g transform="translate(90 40)"><Cat coat={coat} mood={levels >= total ? 'cheer' : 'happy'} size={90} /></g>
      </svg>
    )
  }
  // chaton perdu
  const x = 40 + p * 430
  return (
    <svg className="scene" viewBox="0 0 600 120">
      <path d="M 20 98 Q 150 70 300 96 T 580 92" stroke="#e9d6a7" strokeWidth={22} fill="none" strokeLinecap="round" />
      {Array.from({ length: 9 }).map((_, i) => (
        <text key={i} x={60 + i * 55} y={96 - (i % 2) * 6} fontSize={12} opacity={i / 9 < p ? 0.9 : 0.25}>🐾</text>
      ))}
      <g transform="translate(520 40)">
        <ellipse cx={20} cy={50} rx={36} ry={18} fill="#56b864" />
        {p >= 1 ? (
          <g className="pop-in" transform="translate(-6 0) scale(0.5)"><Cat coat="blanc" accessory="bow" mood="cheer" size={110} /></g>
        ) : (
          <text x={14} y={30} fontSize={18}>❔</text>
        )}
        <ellipse cx={4} cy={58} rx={30} ry={14} fill="#6fcf7a" />
      </g>
      <g style={{ transform: `translateX(${x}px)`, transition: 'transform .8s cubic-bezier(.3,1.4,.5,1)' }}>
        <g transform="translate(-40 10)"><Cat coat={coat} mood="happy" size={90} /></g>
      </g>
    </svg>
  )
}
