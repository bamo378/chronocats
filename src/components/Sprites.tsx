// Dessins isométriques (voxels 2.5D) des sols et des objets. Origine = centre du dessus de la case.

export const TW = 32 // demi-largeur d'une case
export const TH = 16 // demi-hauteur d'une case

export function iso(x: number, y: number) {
  return { sx: (x - y) * TW, sy: (x + y) * TH }
}

function shade(hex: string, k: number) {
  const n = parseInt(hex.slice(1), 16)
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(v * k)))
  const r = f(n >> 16), g = f((n >> 8) & 255), b = f(n & 255)
  return `rgb(${r},${g},${b})`
}

/** Un cube voxel. (cx, cy) = centre de la base. s = demi-largeur, h = hauteur. */
export function Cube({ cx = 0, cy = 0, s = 14, h = 14, color, top }: { cx?: number; cy?: number; s?: number; h?: number; color: string; top?: string }) {
  const t = s / 2
  return (
    <g>
      <path d={`M ${cx - s} ${cy - h} L ${cx} ${cy - h + t} L ${cx} ${cy + t} L ${cx - s} ${cy} Z`} fill={shade(color, 0.86)} />
      <path d={`M ${cx + s} ${cy - h} L ${cx} ${cy - h + t} L ${cx} ${cy + t} L ${cx + s} ${cy} Z`} fill={shade(color, 0.7)} />
      <path d={`M ${cx} ${cy - h - t} L ${cx + s} ${cy - h} L ${cx} ${cy - h + t} L ${cx - s} ${cy - h} Z`} fill={top ?? color} />
    </g>
  )
}

const diamond = (cx = 0, cy = 0, w = TW, h = TH) => `M ${cx} ${cy - h} L ${cx + w} ${cy} L ${cx} ${cy + h} L ${cx - w} ${cy} Z`

export function GroundTile({ kind, x, y }: { kind: string; x: number; y: number }) {
  const seed = (x * 7 + y * 13) % 5
  switch (kind) {
    case 'path':
      return (
        <g>
          <path d={diamond()} fill="#e9d6a7" />
          <ellipse cx={-10 + seed * 3} cy={-3} rx={6} ry={3} fill="#d8c08a" />
          <ellipse cx={9} cy={4 - seed} rx={7} ry={3.2} fill="#d3b97f" />
          <ellipse cx={2} cy={-8 + seed} rx={4} ry={2} fill="#f5e6c2" />
        </g>
      )
    case 'water':
      return (
        <g>
          <path d={diamond()} fill="#7fcaff" />
          <path d={diamond(0, 0, TW - 6, TH - 3)} fill="#9ad8ff" />
          <path className="shimmer" d={`M ${-14 + seed * 2} ${-2} q 6 -3 12 0 M ${2} ${5} q 6 -3 12 0`} stroke="#e8f7ff" strokeWidth={2} fill="none" strokeLinecap="round" />
        </g>
      )
    case 'sand':
      return (
        <g>
          <path d={diamond()} fill="#f7e4a9" />
          <circle cx={-8} cy={2} r={1.2} fill="#e3c97f" /><circle cx={10} cy={-3} r={1.2} fill="#e3c97f" /><circle cx={2} cy={7} r={1} fill="#e3c97f" />
        </g>
      )
    case 'meadow':
      return (
        <g>
          <path d={diamond()} fill="#9fe27e" />
          {[[-12, -2, '#ff8fc0'], [8, -6, '#fff'], [2, 6, '#ffd76f'], [16, 2, '#c3a2ff'], [-4, -8, '#fff']].map(([a, b, c], i) => (
            <circle key={i} cx={a as number} cy={b as number} r={2.2} fill={c as string} />
          ))}
        </g>
      )
    default:
      return (
        <g>
          <path d={diamond()} fill={seed % 2 ? '#93dd72' : '#8bd86b'} />
          <path d={`M ${-6 + seed * 3} ${-4} l 2 -4 l 2 4 M ${8 - seed} ${5} l 2 -4 l 2 4`} stroke="#6fc256" strokeWidth={1.4} fill="none" />
        </g>
      )
  }
}

export function ObjectSprite({ item }: { item: string }) {
  switch (item) {
    case 'tree':
      return (
        <g>
          <Cube s={5} h={18} color="#a8744a" />
          <Cube cy={-14} s={18} h={18} color="#5fc46a" top="#79d77f" />
          <Cube cy={-32} s={12} h={12} color="#6fd07a" top="#8fe394" />
        </g>
      )
    case 'cherry':
      return (
        <g>
          <Cube s={5} h={22} color="#9a6a4a" />
          <Cube cy={-18} s={22} h={18} color="#ff9fc8" top="#ffc0da" />
          <Cube cy={-36} s={15} h={14} color="#ffb0d2" top="#ffd2e6" />
          <circle cx={-12} cy={-22} r={2} fill="#fff" /><circle cx={10} cy={-40} r={2} fill="#fff" />
        </g>
      )
    case 'bush':
      return <Cube s={13} h={12} color="#56b864" top="#74cf7d" />
    case 'flowers':
      return (
        <g>
          {[[-10, -2, '#ff7eb6'], [6, -6, '#ffd34f'], [12, 3, '#b48cff'], [-2, 6, '#ffffff'], [-14, 6, '#ff9f5a']].map(([a, b, c], i) => (
            <g key={i}>
              <line x1={a as number} y1={b as number} x2={a as number} y2={(b as number) - 8} stroke="#4fae5c" strokeWidth={2} />
              <circle cx={a as number} cy={(b as number) - 9} r={3.4} fill={c as string} />
            </g>
          ))}
        </g>
      )
    case 'mushroom':
      return (
        <g>
          <Cube s={5} h={10} color="#fff3e3" />
          <Cube cy={-9} s={14} h={9} color="#ff5f6d" top="#ff7a85" />
          <circle cx={-4} cy={-20} r={2.2} fill="#fff" /><circle cx={6} cy={-17} r={1.8} fill="#fff" />
        </g>
      )
    case 'cathouse':
      return (
        <g>
          <Cube s={20} h={22} color="#ffd9a8" top="#ffe9c9" />
          <path d="M -22 -22 L 0 -46 L 0 -11 Z" fill="#ff8fb3" />
          <path d="M 22 -22 L 0 -46 L 0 -11 Z" fill="#e8739b" />
          <path d="M -2 -48 L 0 -46 L 2 -48" stroke="#ff8fb3" strokeWidth={3} />
          <ellipse cx={-10} cy={-2} rx={5} ry={7} fill="#5b4a7a" />
          <path d="M -15 -6 l 2 -4 l 2 3 M -7 -6 l 2 -4 l 2 3" stroke="#5b4a7a" strokeWidth={2} fill="none" />
          <circle cx={11} cy={-12} r={3.5} fill="#fff6c9" />
        </g>
      )
    case 'cushion':
      return (
        <g>
          <ellipse cx={0} cy={0} rx={18} ry={9} fill="#c79bff" />
          <ellipse cx={0} cy={-3} rx={14} ry={6.5} fill="#e1c9ff" />
        </g>
      )
    case 'cattree':
      return (
        <g>
          <Cube s={14} h={6} color="#d9b38a" />
          <Cube cy={-6} s={4} h={34} color="#e8d2b4" />
          <Cube cy={-24} s={12} h={5} color="#b48cff" />
          <Cube cy={-40} s={12} h={5} color="#ff8fc0" />
          <circle cx={14} cy={-26} r={3} fill="#ffd34f" />
          <line x1={14} y1={-34} x2={14} y2={-29} stroke="#b9aecb" strokeWidth={1} />
        </g>
      )
    case 'house':
      return (
        <g>
          <Cube s={26} h={30} color="#f5e3c8" top="#fff1dc" />
          <path d="M -30 -28 L -4 -62 L 26 -46 L 0 -12 Z" fill="#8f6cf2" />
          <path d="M 30 -28 L 26 -46 L 0 -12 L 4 -14 Z" fill="#6f4fd2" />
          <path d="M 30 -30 L 26 -46 L -4 -62 L 0 -46 Z" fill="#a587ff" opacity={0.5} />
          <rect x={-18} y={-16} width={9} height={14} rx={2} fill="#8a5a3a" transform="skewY(26)" />
          <rect x={6} y={-26} width={8} height={8} rx={1} fill="#fff4b8" transform="skewY(-26)" />
          <rect x={16} y={-30} width={6} height={9} fill="#c79f84" />
        </g>
      )
    case 'market':
      return (
        <g>
          <Cube s={24} h={16} color="#c7955f" top="#d9aa76" />
          <Cube cy={-10} s={6} h={4} color="#ff6f6f" />
          <Cube cx={-10} cy={-14} s={5} h={4} color="#ffd34f" />
          <Cube cx={10} cy={-12} s={5} h={4} color="#7dd36f" />
          <line x1={-22} y1={-14} x2={-22} y2={-40} stroke="#8a5a3a" strokeWidth={3} />
          <line x1={22} y1={-14} x2={22} y2={-40} stroke="#8a5a3a" strokeWidth={3} />
          <path d="M -28 -40 L 0 -54 L 28 -40 L 0 -26 Z" fill="#7fb6ff" />
          <path d="M -21 -36.5 L 7 -50.5 M -7 -29.5 L 21 -43.5" stroke="#fff" strokeWidth={5} />
        </g>
      )
    case 'tower':
      return (
        <g>
          <Cube s={20} h={30} color="#d9cbbd" top="#ebe0d4" />
          <Cube cy={-30} s={17} h={36} color="#e8dccf" top="#f6ede3" />
          <circle cx={-8} cy={-48} r={9} fill="#fffdf7" stroke="#f48e6a" strokeWidth={2.5} transform="skewY(26)" />
          <path d="M -8 -48 v -6 M -8 -48 h 5" stroke="#5b4a7a" strokeWidth={1.6} transform="skewY(26)" strokeLinecap="round" />
          <path d="M -20 -66 L 0 -104 L 0 -58 Z" fill="#6fa8ff" />
          <path d="M 20 -66 L 0 -104 L 0 -58 Z" fill="#4f86e0" />
          <path d="M 0 -104 v -10" stroke="#8a5a3a" strokeWidth={2} />
          <path d="M 0 -114 l 9 3 -9 3 z" fill="#ff8fc0" />
        </g>
      )
    case 'lantern':
      return (
        <g>
          <line x1={0} y1={0} x2={0} y2={-34} stroke="#5b4a7a" strokeWidth={3} />
          <rect x={-5} y={-44} width={10} height={11} rx={2} fill="#ffe38a" stroke="#5b4a7a" strokeWidth={2} />
          <circle className="glow" cx={0} cy={-38} r={12} fill="#fff1a8" opacity={0.45} />
        </g>
      )
    case 'fence':
      return (
        <g stroke="#b88758" strokeWidth={4} strokeLinecap="round">
          <line x1={-20} y1={-2} x2={-20} y2={-18} /><line x1={0} y1={8} x2={0} y2={-8} /><line x1={20} y1={-2} x2={20} y2={-18} />
          <line x1={-22} y1={-12} x2={22} y2={-12} strokeWidth={3} transform="skewY(0)" />
        </g>
      )
    case 'bench':
      return (
        <g>
          <Cube cx={-8} cy={-2} s={3} h={8} color="#8a5a3a" />
          <Cube cx={8} cy={2} s={3} h={8} color="#8a5a3a" />
          <path d="M -20 -12 L 4 -24 L 20 -16 L -4 -4 Z" fill="#d79a62" />
          <path d="M -20 -12 L -4 -4 L -4 -1 L -20 -9 Z" fill="#b97c47" />
        </g>
      )
    case 'table':
      return (
        <g>
          <Cube s={3} h={10} color="#8a5a3a" />
          <path d="M -18 -10 L 0 -19 L 18 -10 L 0 -1 Z" fill="#ffa7c7" />
          <path d="M -12 -10 L 0 -16 M 0 -4 L 12 -10" stroke="#fff" strokeWidth={2.5} />
          <circle cx={-3} cy={-13} r={2.5} fill="#ff6f6f" />
        </g>
      )
    case 'bridge':
      return (
        <g>
          <path d="M -30 -2 L 2 -18 L 30 -2 L -2 14 Z" fill="#c9915c" />
          {[-20, -10, 0, 10, 20].map((o) => <path key={o} d={`M ${o - 8} ${-2 - o * 0.5 + 4} l 16 -8`} stroke="#a6713f" strokeWidth={1.4} />)}
          <path d="M -30 -2 L -30 -12 M -2 14 L -2 4 M 30 -2 L 30 -12 M 2 -18 L 2 -28" stroke="#8a5a3a" strokeWidth={3} />
          <path d="M -30 -12 L -2 4 M 2 -28 L 30 -12" stroke="#8a5a3a" strokeWidth={2} />
        </g>
      )
    case 'crystal':
      return (
        <g>
          <Cube s={22} h={8} color="#c9c1d6" top="#a9dcff" />
          <path className="glow" d="M 0 -60 L 10 -36 L 0 -14 L -10 -36 Z" fill="#6cc8ff" />
          <path d="M 0 -60 L 10 -36 L 0 -36 Z" fill="#b8e6ff" />
          <circle className="glow" cx={0} cy={-36} r={22} fill="#9ad8ff" opacity={0.3} />
        </g>
      )
    case 'statue':
      return (
        <g>
          <Cube s={16} h={12} color="#d9cbbd" top="#ebe0d4" />
          <g transform="translate(0 -12)">
            <ellipse cx={0} cy={-14} rx={12} ry={14} fill="#f5c542" />
            <path d="M -11 -24 L -9 -40 L -2 -28 Z M 11 -24 L 9 -40 L 2 -28 Z" fill="#e8b324" />
            <ellipse cx={0} cy={-30} rx={10} ry={9} fill="#ffd966" />
            <ellipse cx={-4} cy={-30} rx={2} ry={2.4} fill="#a87a0c" />
            <ellipse cx={4} cy={-30} rx={2} ry={2.4} fill="#a87a0c" />
            <path d="M -6 -14 q 6 6 12 0" stroke="#fff3c4" strokeWidth={2} fill="none" />
            <circle className="glow" cx={0} cy={-22} r={20} fill="#ffe38a" opacity={0.25} />
          </g>
        </g>
      )
    case 'block-pink':
      return <Cube s={22} h={22} color="#ffa7c7" top="#ffc4da" />
    case 'block-blue':
      return <Cube s={22} h={22} color="#86c8ff" top="#ade0ff" />
    case 'block-mint':
      return <Cube s={22} h={22} color="#8fe3c2" top="#b6f0d9" />
    case 'block-sun':
      return <Cube s={22} h={22} color="#ffd76f" top="#ffe7a6" />
    case 'block-star':
      return (
        <g>
          <Cube s={22} h={22} color="#9b85ff" top="#b9a9ff" />
          <path d="M 0 -40 l 3 6 6 1 -5 4 1 6 -5 -3 -5 3 1 -6 -5 -4 6 -1 z" fill="#ffe38a" />
        </g>
      )
    default:
      return <Cube s={12} h={12} color="#ccc" />
  }
}

/** Petit aperçu d'un objet (pour l'inventaire). */
export function ItemIcon({ item, layer }: { item: string; layer: 'ground' | 'object' }) {
  return (
    <svg viewBox="-40 -70 80 96" width="100%" height="100%">
      {layer === 'ground' ? <g transform="translate(0 -14)"><GroundTile kind={item} x={1} y={2} /></g> : (<><path d={diamond(0, 0)} fill="#e7f5df" /><ObjectSprite item={item} /></>)}
    </svg>
  )
}
