import { AccessoryId, CoatId } from '../game/catalog'

export type Mood = 'idle' | 'happy' | 'wow' | 'think' | 'sleepy' | 'cheer'

const COAT: Record<CoatId, { base: string; dark: string; belly: string; eye: string; inner: string }> = {
  roux: { base: '#ffab5e', dark: '#e9813a', belly: '#fff1df', eye: '#3b2f4f', inner: '#ffc2d4' },
  noir: { base: '#3f3653', dark: '#2a2338', belly: '#5e5277', eye: '#ffd34f', inner: '#e79bb8' },
  blanc: { base: '#ffffff', dark: '#e6dff0', belly: '#ffffff', eye: '#4aa3ff', inner: '#ffc2d4' },
  tigre: { base: '#f5bc77', dark: '#b8682d', belly: '#fff1df', eye: '#3f8f4f', inner: '#ffc2d4' },
  gris: { base: '#aeb7cb', dark: '#7f8aa3', belly: '#eef1f7', eye: '#3b2f4f', inner: '#ffc2d4' },
  fantastique: { base: '#c7a6ff', dark: '#8f7cf2', belly: '#fbe9ff', eye: '#40c6ff', inner: '#ffb3e6' },
}

interface Props {
  coat: CoatId
  accessory?: AccessoryId
  mood?: Mood
  size?: number | string
  className?: string
  onClick?: () => void
  flip?: boolean
}

export function Cat({ coat, accessory = 'none', mood = 'idle', size = 120, className, onClick, flip }: Props) {
  const c = COAT[coat]
  const stroke = coat === 'blanc' ? '#d9d0e8' : 'none'
  const eyes = () => {
    if (mood === 'happy' || mood === 'cheer')
      return (
        <g stroke={c.eye} strokeWidth={3.5} fill="none" strokeLinecap="round">
          <path d="M 45 52 Q 50 46 55 52" />
          <path d="M 65 52 Q 70 46 75 52" />
        </g>
      )
    if (mood === 'sleepy')
      return (
        <g stroke={c.eye} strokeWidth={3} fill="none" strokeLinecap="round">
          <path d="M 45 52 Q 50 55 55 52" />
          <path d="M 65 52 Q 70 55 75 52" />
        </g>
      )
    const r = mood === 'wow' ? 7.5 : 6
    const dx = mood === 'think' ? 2.5 : 0
    return (
      <g className="cat-eyes">
        <ellipse cx={50} cy={51} rx={r} ry={r + 1} fill={c.eye} />
        <ellipse cx={70} cy={51} rx={r} ry={r + 1} fill={c.eye} />
        <circle cx={50 + dx + 2} cy={48} r={2.4} fill="#fff" />
        <circle cx={70 + dx + 2} cy={48} r={2.4} fill="#fff" />
      </g>
    )
  }
  const mouth = () => {
    if (mood === 'wow' || mood === 'cheer') return <ellipse cx={60} cy={66} rx={4} ry={mood === 'cheer' ? 5 : 3.5} fill="#7a3550" />
    return <path d="M 54 63 Q 57 67 60 63 Q 63 67 66 63" stroke="#7a3550" strokeWidth={2.2} fill="none" strokeLinecap="round" />
  }
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} className={`cat cat-${mood} ${className ?? ''}`} onClick={onClick} style={flip ? { transform: 'scaleX(-1)' } : undefined}>
      <defs>
        {coat === 'fantastique' && (
          <linearGradient id="fant" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#d9b8ff" />
            <stop offset="1" stopColor="#8fd8ff" />
          </linearGradient>
        )}
      </defs>
      <ellipse cx={60} cy={112} rx={30} ry={5} fill="#000" opacity={0.12} />
      <g className="cat-bob">
        {/* queue */}
        <path className="cat-tail" d="M 82 98 Q 108 92 102 66 Q 99 56 92 60" stroke={coat === 'fantastique' ? 'url(#fant)' : c.base} strokeWidth={10} fill="none" strokeLinecap="round" />
        {coat === 'tigre' && <path className="cat-tail" d="M 100 74 l 6 2 M 104 86 l 6 -1" stroke={c.dark} strokeWidth={3} strokeLinecap="round" />}
        {/* corps */}
        <ellipse cx={60} cy={92} rx={27} ry={21} fill={coat === 'fantastique' ? 'url(#fant)' : c.base} stroke={stroke} strokeWidth={1.5} />
        <ellipse cx={60} cy={96} rx={15} ry={14} fill={c.belly} />
        <ellipse cx={47} cy={110} rx={8} ry={5} fill={c.base} stroke={stroke} />
        <ellipse cx={73} cy={110} rx={8} ry={5} fill={c.base} stroke={stroke} />
        {/* tête */}
        <g className="cat-head">
          <path d="M 33 40 L 36 12 L 56 30 Z" fill={coat === 'fantastique' ? '#cfaeff' : c.base} stroke={stroke} />
          <path d="M 87 40 L 84 12 L 64 30 Z" fill={coat === 'fantastique' ? '#a9c9ff' : c.base} stroke={stroke} />
          <path d="M 38 34 L 39 19 L 50 29 Z" fill={c.inner} />
          <path d="M 82 34 L 81 19 L 70 29 Z" fill={c.inner} />
          <ellipse cx={60} cy={52} rx={30} ry={26} fill={coat === 'fantastique' ? 'url(#fant)' : c.base} stroke={stroke} strokeWidth={1.5} />
          {coat === 'tigre' && (
            <g stroke={c.dark} strokeWidth={3.2} strokeLinecap="round">
              <path d="M 60 27 v 8" /><path d="M 52 29 l 2 7" /><path d="M 68 29 l -2 7" />
              <path d="M 31 50 h 7" /><path d="M 32 58 h 6" /><path d="M 89 50 h -7" /><path d="M 88 58 h -6" />
            </g>
          )}
          {coat === 'gris' && <path d="M 52 28 Q 60 34 68 28" stroke={c.dark} strokeWidth={3} fill="none" />}
          {coat === 'fantastique' && (
            <g fill="#fff8a8">
              <path d="M 60 30 l 2 4 4 1 -4 1 -2 4 -2 -4 -4 -1 4 -1 z" />
              <circle cx={40} cy={40} r={1.6} /><circle cx={82} cy={44} r={1.4} />
            </g>
          )}
          <ellipse cx={60} cy={62} rx={12} ry={8} fill={c.belly} opacity={coat === 'blanc' ? 0 : 0.9} />
          {eyes()}
          <path d="M 57 58 L 63 58 L 60 61.5 Z" fill="#ff7ea6" />
          {mouth()}
          <ellipse cx={42} cy={62} rx={5} ry={3} fill="#ff8fb0" opacity={0.45} />
          <ellipse cx={78} cy={62} rx={5} ry={3} fill="#ff8fb0" opacity={0.45} />
          <g stroke={coat === 'noir' ? '#9d92b5' : '#a99fbb'} strokeWidth={1.3} strokeLinecap="round">
            <path d="M 44 60 L 28 57" /><path d="M 44 64 L 29 66" /><path d="M 76 60 L 92 57" /><path d="M 76 64 L 91 66" />
          </g>
          <Accessory id={accessory} />
        </g>
        {accessory === 'scarf' && (
          <g>
            <path d="M 38 74 Q 60 84 82 74 L 82 80 Q 60 90 38 80 Z" fill="#ff6f91" />
            <path d="M 70 80 L 76 96 L 66 94 Z" fill="#ff4f7b" />
          </g>
        )}
        {accessory === 'bell' && (
          <g>
            <path d="M 40 75 Q 60 83 80 75" stroke="#e0476f" strokeWidth={4} fill="none" />
            <circle cx={60} cy={82} r={5} fill="#ffcf3f" stroke="#d39a13" strokeWidth={1.2} />
          </g>
        )}
        {mood === 'cheer' && (
          <g className="sparkles" fill="#ffd76f">
            <path d="M 16 30 l 3 6 6 2 -6 2 -3 6 -3 -6 -6 -2 6 -2 z" />
            <path d="M 104 24 l 2 4 4 1 -4 1 -2 4 -2 -4 -4 -1 4 -1 z" />
          </g>
        )}
      </g>
    </svg>
  )
}

function Accessory({ id }: { id: AccessoryId }) {
  switch (id) {
    case 'bow':
      return (
        <g transform="translate(78 30) rotate(18)">
          <path d="M 0 0 L -11 -7 L -11 7 Z" fill="#ff5f9e" />
          <path d="M 0 0 L 11 -7 L 11 7 Z" fill="#ff5f9e" />
          <circle r={3.5} fill="#ff2f80" />
        </g>
      )
    case 'flower':
      return (
        <g transform="translate(40 31)">
          {[0, 72, 144, 216, 288].map((a) => <ellipse key={a} cx={0} cy={-5} rx={3.5} ry={5} fill="#fff" transform={`rotate(${a})`} />)}
          <circle r={3.2} fill="#ffcf3f" />
        </g>
      )
    case 'glasses':
      return (
        <g fill="none" stroke="#5b4a7a" strokeWidth={2.4}>
          <circle cx={50} cy={51} r={9} />
          <circle cx={70} cy={51} r={9} />
          <path d="M 59 50 h 2" />
        </g>
      )
    case 'wizard':
      return (
        <g>
          <path d="M 40 30 L 64 -8 L 82 28 Z" fill="#7a5cff" />
          <path d="M 34 30 Q 60 38 88 28 Q 60 26 34 30" fill="#5b3fe0" stroke="#5b3fe0" strokeWidth={4} />
          <path d="M 62 10 l 2 4 4 1 -4 1 -2 4 -2 -4 -4 -1 4 -1 z" fill="#ffd76f" />
          <circle cx={54} cy={22} r={1.8} fill="#ffd76f" />
        </g>
      )
    case 'crown':
      return (
        <g>
          <path d="M 44 28 L 46 12 L 53 21 L 60 8 L 67 21 L 74 12 L 76 28 Z" fill="#ffd34f" stroke="#e0a51a" strokeWidth={1.5} />
          <circle cx={60} cy={22} r={2.6} fill="#ff5f9e" />
        </g>
      )
    default:
      return null
  }
}
