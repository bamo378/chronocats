import { useRef, useState } from 'react'
import { Time, handAngles, pointAngle, angleDiff, dragMinuteHand, dragHourHand } from '../engine/clock'
import { sfx } from '../audio/sound'

interface Props {
  time: Time
  onChange?: (t: Time) => void
  snap?: 1 | 5
  showMinuteLabels?: boolean
  /** Aiguilles fantômes montrant la bonne réponse. */
  ghost?: Time
  /** Mode « touche une aiguille ». */
  onTapHand?: (hand: 'hour' | 'minute') => void
  highlight?: 'hour' | 'minute'
  size?: number | string
  ears?: boolean
  className?: string
}

const C = 150
const R = 128

function polar(angle: number, r: number) {
  const a = ((angle - 90) * Math.PI) / 180
  return { x: C + r * Math.cos(a), y: C + r * Math.sin(a) }
}

export function Clock({ time, onChange, snap = 1, showMinuteLabels, ghost, onTapHand, highlight, size = 300, ears = true, className }: Props) {
  const svg = useRef<SVGSVGElement>(null)
  const [drag, setDrag] = useState<null | 'hour' | 'minute'>(null)
  const last = useRef(time)
  last.current = time
  const lastTick = useRef(-1)
  const interactive = !!onChange && !onTapHand
  const { hour, minute } = handAngles(time)

  function toSvg(e: React.PointerEvent) {
    const s = svg.current!
    const pt = s.createSVGPoint()
    pt.x = e.clientX
    pt.y = e.clientY
    const p = pt.matrixTransform(s.getScreenCTM()!.inverse())
    return p
  }

  function onDown(e: React.PointerEvent) {
    if (!interactive) return
    const p = toSvg(e)
    const a = pointAngle(C, C, p.x, p.y)
    const r = Math.hypot(p.x - C, p.y - C)
    const dh = Math.abs(angleDiff(a, hour))
    const dm = Math.abs(angleDiff(a, minute))
    let hand: 'hour' | 'minute' = 'minute'
    if (dh < 28 && (dh < dm || r < R * 0.58)) hand = 'hour'
    setDrag(hand)
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
    move(p.x, p.y, hand)
    e.preventDefault()
  }

  function move(x: number, y: number, hand: 'hour' | 'minute') {
    const a = pointAngle(C, C, x, y)
    const next = hand === 'minute' ? dragMinuteHand(last.current, a, snap) : dragHourHand(last.current, a, snap)
    if (next.h !== last.current.h || next.m !== last.current.m) {
      if (next.m !== lastTick.current) { sfx.tick(); lastTick.current = next.m }
      last.current = next
      onChange!(next)
    }
  }

  function onMove(e: React.PointerEvent) {
    if (!drag) return
    const p = toSvg(e)
    move(p.x, p.y, drag)
  }

  function end() {
    setDrag(null)
  }

  const ticks = []
  for (let i = 0; i < 60; i++) {
    const big = i % 5 === 0
    const a = polar(i * 6, R - 8)
    const b = polar(i * 6, R - (big ? 22 : 14))
    ticks.push(<line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={big ? '#6c5a8e' : '#b9aecb'} strokeWidth={big ? 4 : 2} strokeLinecap="round" />)
  }
  const nums = []
  for (let n = 1; n <= 12; n++) {
    const p = polar(n * 30, R - 42)
    nums.push(<text key={n} x={p.x} y={p.y} className="clock-num" textAnchor="middle" dominantBaseline="central">{n}</text>)
    if (showMinuteLabels) {
      const q = polar(n * 30, R + 16)
      nums.push(<text key={'m' + n} x={q.x} y={q.y} className="clock-min" textAnchor="middle" dominantBaseline="central">{n === 12 ? '00' : n * 5}</text>)
    }
  }

  const hourEnd = polar(hour, R * 0.5)
  const minEnd = polar(minute, R * 0.8)
  const vb = showMinuteLabels ? '-22 -30 344 352' : '0 -14 300 314'

  return (
    <svg
      ref={svg}
      viewBox={vb}
      width={size}
      height={size}
      className={`clock ${interactive ? 'clock-live' : ''} ${className ?? ''}`}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={end}
      onPointerCancel={end}
      role="img"
      aria-label="Horloge"
    >
      <defs>
        <radialGradient id="face" cx="50%" cy="40%" r="65%">
          <stop offset="0" stopColor="#fffdf7" />
          <stop offset="1" stopColor="#fdf0e0" />
        </radialGradient>
        <linearGradient id="rim" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffc38a" />
          <stop offset="1" stopColor="#f48e6a" />
        </linearGradient>
      </defs>
      {ears && (
        <g>
          <path d={`M ${C - 98} ${C - 78} L ${C - 82} ${C - 150} L ${C - 30} ${C - 118} Z`} fill="url(#rim)" />
          <path d={`M ${C - 88} ${C - 92} L ${C - 80} ${C - 132} L ${C - 50} ${C - 114} Z`} fill="#ffc7d9" />
          <path d={`M ${C + 98} ${C - 78} L ${C + 82} ${C - 150} L ${C + 30} ${C - 118} Z`} fill="url(#rim)" />
          <path d={`M ${C + 88} ${C - 92} L ${C + 80} ${C - 132} L ${C + 50} ${C - 114} Z`} fill="#ffc7d9" />
        </g>
      )}
      <circle cx={C} cy={C + 5} r={R + 10} fill="#000" opacity={0.08} />
      <circle cx={C} cy={C} r={R + 10} fill="url(#rim)" />
      <circle cx={C} cy={C} r={R} fill="url(#face)" />
      {ticks}
      {nums}

      {ghost && (
        <g className="ghost">
          <line x1={C} y1={C} x2={polar(handAngles(ghost).minute, R * 0.8).x} y2={polar(handAngles(ghost).minute, R * 0.8).y} stroke="#2fbf71" strokeWidth={8} strokeLinecap="round" strokeDasharray="2 12" />
          <line x1={C} y1={C} x2={polar(handAngles(ghost).hour, R * 0.5).x} y2={polar(handAngles(ghost).hour, R * 0.5).y} stroke="#2fbf71" strokeWidth={14} strokeLinecap="round" strokeDasharray="2 16" />
        </g>
      )}

      {/* Petite aiguille : heures */}
      <g className={`hand hand-hour ${highlight === 'hour' ? 'hl' : ''}`} onPointerDown={onTapHand ? (e) => { e.stopPropagation(); onTapHand('hour') } : undefined}>
        <line x1={C} y1={C} x2={hourEnd.x} y2={hourEnd.y} stroke="transparent" strokeWidth={44} strokeLinecap="round" />
        <line x1={C} y1={C} x2={hourEnd.x} y2={hourEnd.y} stroke="#ff6fa8" strokeWidth={14} strokeLinecap="round" />
      </g>
      {/* Grande aiguille : minutes */}
      <g className={`hand hand-minute ${highlight === 'minute' ? 'hl' : ''}`} onPointerDown={onTapHand ? (e) => { e.stopPropagation(); onTapHand('minute') } : undefined}>
        <line x1={C} y1={C} x2={minEnd.x} y2={minEnd.y} stroke="transparent" strokeWidth={40} strokeLinecap="round" />
        <line x1={C} y1={C} x2={minEnd.x} y2={minEnd.y} stroke="#7a5cff" strokeWidth={8} strokeLinecap="round" />
        <circle cx={minEnd.x} cy={minEnd.y} r={7} fill="#7a5cff" />
      </g>
      <circle cx={C} cy={C} r={11} fill="#5b4a7a" />
      <circle cx={C} cy={C} r={4} fill="#ffd76f" />
    </svg>
  )
}
