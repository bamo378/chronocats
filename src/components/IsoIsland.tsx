import { ReactNode } from 'react'
import { GroundTile, ObjectSprite, iso, TW, TH } from './Sprites'
import { Placed } from '../profiles/store'

interface Props {
  ground: string[][]
  objects: Placed[]
  /** Case sélectionnée (construction). */
  cursor?: { x: number; y: number } | null
  selectedId?: string | null
  showGrid?: boolean
  onTile?: (x: number, y: number) => void
  onObject?: (o: Placed) => void
  /** Élément à dessiner sur une case (le chat), trié en profondeur. */
  actor?: { x: number; y: number; node: ReactNode }
  bursts?: { id: number; x: number; y: number; text: string }[]
}

export function IsoIsland({ ground, objects, cursor, selectedId, showGrid, onTile, onObject, actor, bursts = [] }: Props) {
  const N = ground.length
  const W = N * TW
  const bottom = (N - 1) * 2 * TH + TH
  const mid = (N - 1) * TH

  // Tri en profondeur : objets et acteur.
  type Drawable = { depth: number; key: string; node: ReactNode }
  const draw: Drawable[] = objects.map((o) => {
    const { sx, sy } = iso(o.x, o.y)
    const sel = o.id === selectedId
    return {
      depth: o.x + o.y + 0.1,
      key: o.id,
      node: (
        <g key={o.id} transform={`translate(${sx} ${sy})`} className={`obj ${sel ? 'obj-sel' : ''}`} onClick={onObject ? (e) => { e.stopPropagation(); onObject(o) } : undefined}>
          <g className="pop-in">
            <ObjectSprite item={o.item} />
          </g>
        </g>
      ),
    }
  })
  if (actor) {
    const { sx, sy } = iso(actor.x, actor.y)
    draw.push({
      depth: actor.x + actor.y + 0.5,
      key: 'actor',
      node: (
        <g key="actor" className="actor" style={{ transform: `translate(${sx}px, ${sy}px)` }}>
          {actor.node}
        </g>
      ),
    })
  }
  draw.sort((a, b) => a.depth - b.depth)

  return (
    <svg className="island" viewBox={`${-W - 70} ${-150} ${2 * W + 140} ${bottom + 330}`} preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="cliffL" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#a77b58" />
          <stop offset="1" stopColor="#6f5a7c" />
        </linearGradient>
        <linearGradient id="cliffR" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8a6447" />
          <stop offset="1" stopColor="#584a6e" />
        </linearGradient>
        <linearGradient id="fall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#bfe8ff" />
          <stop offset="1" stopColor="#bfe8ff" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Petits îlots flottants */}
      <g className="float-a" opacity={0.95}>
        <Islet x={-W - 20} y={-90} s={0.8} />
      </g>
      <g className="float-b" opacity={0.95}>
        <Islet x={W + 10} y={-60} s={0.6} />
      </g>
      <g className="float-a" opacity={0.9}>
        <Islet x={W - 10} y={bottom + 120} s={0.5} />
      </g>

      {/* Falaise de l'île */}
      <path d={`M ${-W} ${mid} L 0 ${bottom} L 0 ${bottom + 120} L ${-W * 0.25} ${bottom + 100} L ${-W * 0.42} ${bottom + 70} L ${-W * 0.6} ${bottom + 40} L ${-W * 0.78} ${mid + 60} L ${-W} ${mid + 26} Z`} fill="url(#cliffL)" />
      <path d={`M ${W} ${mid} L 0 ${bottom} L 0 ${bottom + 120} L ${W * 0.3} ${bottom + 96} L ${W * 0.5} ${bottom + 58} L ${W * 0.72} ${mid + 66} L ${W} ${mid + 24} Z`} fill="url(#cliffR)" />
      <path d={`M ${-W} ${mid} L 0 ${bottom} L ${W} ${mid} L ${W} ${mid + 10} L 0 ${bottom + 12} L ${-W} ${mid + 10} Z`} fill="#6cbf5a" />
      {/* rochers */}
      <g fill="#ffffff" opacity={0.08}>
        <path d={`M ${-W * 0.6} ${mid + 40} l 30 14 l -6 20 l -30 -12 z`} />
        <path d={`M ${W * 0.35} ${bottom + 30} l 26 -12 l 6 20 l -26 12 z`} />
      </g>
      {/* cascade */}
      {[[-1, 0.62, 150], [1, 0.38, 110]].map(([side, t, h]) => {
        // point sur l'arête haute de la falaise
        const x = side < 0 ? -W + t * W : W - t * W
        const y = mid + t * (bottom - mid) + 8
        return (
          <g key={side} className="waterfall">
            <path d={`M ${x - 9} ${y} L ${x + 9} ${y + (side < 0 ? 9 : -9)} L ${x + 9} ${y + h} L ${x - 9} ${y + h} Z`} fill="url(#fall)" />
            <ellipse cx={x} cy={y + 2} rx={12} ry={5} fill="#bfe8ff" />
          </g>
        )
      })}

      {/* Sol */}
      {ground.map((row, y) =>
        row.map((k, x) => {
          const { sx, sy } = iso(x, y)
          const isCur = cursor && cursor.x === x && cursor.y === y
          return (
            <g key={`${x}-${y}`} transform={`translate(${sx} ${sy})`} onClick={onTile ? () => onTile(x, y) : undefined} className="tile">
              <GroundTile kind={k} x={x} y={y} />
              {showGrid && <path d={`M 0 ${-TH} L ${TW} 0 L 0 ${TH} L ${-TW} 0 Z`} fill="none" stroke="#ffffff" strokeOpacity={0.45} strokeWidth={1} />}
              {isCur && <path className="cursor" d={`M 0 ${-TH} L ${TW} 0 L 0 ${TH} L ${-TW} 0 Z`} fill="#ffffff" fillOpacity={0.35} stroke="#7a5cff" strokeWidth={3} />}
            </g>
          )
        }),
      )}

      {draw.map((d) => d.node)}

      {bursts.map((b) => {
        const { sx, sy } = iso(b.x, b.y)
        return (
          <text key={b.id} x={sx} y={sy - 60} className="burst" textAnchor="middle">{b.text}</text>
        )
      })}
    </svg>
  )
}

function Islet({ x, y, s }: { x: number; y: number; s: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M -60 0 L 0 30 L 0 90 L -30 60 Z" fill="#9a7252" />
      <path d="M 60 0 L 0 30 L 0 90 L 30 60 Z" fill="#7c5a40" />
      <path d="M 0 -30 L 60 0 L 0 30 L -60 0 Z" fill="#8bd86b" />
      <g transform="translate(0 0)"><ObjectSprite item={x > 0 ? 'cherry' : 'tree'} /></g>
    </g>
  )
}
