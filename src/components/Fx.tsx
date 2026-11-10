// Effets de particules légers (étoiles, pièces, cœurs) sur un canvas plein écran.
// API simple : fx.burst(x, y, 'stars') depuis n'importe quel composant.

import { useEffect, useRef } from 'react'

type Kind = 'stars' | 'coins' | 'hearts' | 'confetti' | 'cubes'

interface P { x: number; y: number; vx: number; vy: number; life: number; max: number; size: number; rot: number; vr: number; color: string; kind: Kind; tx?: number; ty?: number }

const listeners = new Set<(x: number, y: number, k: Kind, n: number, target?: { x: number; y: number }) => void>()

export const fx = {
  burst(x: number, y: number, kind: Kind = 'stars', n = 18) {
    listeners.forEach((l) => l(x, y, kind, n))
  },
  /** Particules qui volent vers une cible (le compteur de pièces). */
  fly(x: number, y: number, target: { x: number; y: number }, kind: Kind = 'coins', n = 8) {
    listeners.forEach((l) => l(x, y, kind, n, target))
  },
  /** Raccourci : centre d'un élément. */
  at(el: Element | null, kind: Kind = 'stars', n = 18) {
    if (!el) return
    const r = el.getBoundingClientRect()
    fx.burst(r.left + r.width / 2, r.top + r.height / 2, kind, n)
  },
}

const PALETTE: Record<Kind, string[]> = {
  stars: ['#ffd76f', '#ffe9a6', '#ffffff', '#ffb36b'],
  coins: ['#ffcf3f', '#ffe38a'],
  hearts: ['#ff6fa8', '#ff9fc8', '#ffc4da'],
  confetti: ['#ff6fa8', '#7a5cff', '#6fd9a8', '#ffd76f', '#7cc8ff', '#ffb36b'],
  cubes: ['#ffa7c7', '#86c8ff', '#8fe3c2', '#ffd76f', '#c3a2ff'],
}

const reduced = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches

export function FxLayer() {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current!
    const ctx = c.getContext('2d')!
    let ps: P[] = []
    let raf = 0
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const resize = () => { c.width = innerWidth * dpr; c.height = innerHeight * dpr; c.style.width = innerWidth + 'px'; c.style.height = innerHeight + 'px' }
    resize()
    addEventListener('resize', resize)

    const add = (x: number, y: number, kind: Kind, n: number, target?: { x: number; y: number }) => {
      if (reduced()) n = Math.min(n, 4)
      const pal = PALETTE[kind]
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2
        const sp = (target ? 3 : 4) + Math.random() * (kind === 'confetti' ? 9 : 6)
        const max = target ? 50 + Math.random() * 20 : 45 + Math.random() * 35
        ps.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - (kind === 'confetti' ? 6 : 3), life: 0, max, size: (kind === 'confetti' ? 7 : 9) + Math.random() * 8, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3, color: pal[i % pal.length], kind, tx: target?.x, ty: target?.y })
      }
      if (!raf) raf = requestAnimationFrame(tick)
    }
    listeners.add(add)

    function star(s: number) {
      ctx.beginPath()
      for (let i = 0; i < 10; i++) {
        const r = i % 2 ? s * 0.45 : s
        const a = (i * Math.PI) / 5 - Math.PI / 2
        ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r)
      }
      ctx.closePath(); ctx.fill()
    }
    function heart(s: number) {
      ctx.beginPath()
      ctx.moveTo(0, s * 0.35)
      ctx.bezierCurveTo(-s, -s * 0.4, -s * 0.4, -s, 0, -s * 0.35)
      ctx.bezierCurveTo(s * 0.4, -s, s, -s * 0.4, 0, s * 0.35)
      ctx.fill()
    }

    function tick() {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, innerWidth, innerHeight)
      ps = ps.filter((p) => p.life < p.max)
      for (const p of ps) {
        p.life++
        const t = p.life / p.max
        if (p.tx !== undefined && p.ty !== undefined && p.life > 12) {
          // vol vers la cible
          p.vx += (p.tx - p.x) * 0.02; p.vy += (p.ty - p.y) * 0.02
          p.vx *= 0.86; p.vy *= 0.86
          if (Math.hypot(p.tx - p.x, p.ty - p.y) < 14) p.life = p.max
        } else {
          p.vy += p.kind === 'confetti' ? 0.18 : 0.22
          p.vx *= 0.98
        }
        p.x += p.vx; p.y += p.vy; p.rot += p.vr
        ctx.save()
        ctx.globalAlpha = p.tx !== undefined ? 1 : Math.max(0, 1 - t * t)
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rot)
        ctx.fillStyle = p.color
        const s = p.size * (p.tx !== undefined ? 1 : 1 - t * 0.4)
        if (p.kind === 'stars') star(s * 0.8)
        else if (p.kind === 'hearts') heart(s)
        else if (p.kind === 'coins') {
          ctx.beginPath(); ctx.ellipse(0, 0, s * 0.6, s * 0.6 * Math.abs(Math.cos(p.rot * 2)) + 1, 0, 0, Math.PI * 2); ctx.fill()
          ctx.strokeStyle = '#e0a51a'; ctx.lineWidth = 2; ctx.stroke()
        } else if (p.kind === 'cubes') {
          ctx.fillRect(-s / 2, -s / 2, s, s); ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fillRect(-s / 2 + 2, -s / 2 + 2, s - 4, s / 3)
        } else ctx.fillRect(-s / 2, -s / 4, s, s / 2)
        ctx.restore()
      }
      raf = ps.length ? requestAnimationFrame(tick) : 0
      if (!raf) ctx.clearRect(0, 0, innerWidth, innerHeight)
    }

    return () => { listeners.delete(add); removeEventListener('resize', resize); cancelAnimationFrame(raf) }
  }, [])
  return <canvas ref={ref} className="fx-layer" aria-hidden />
}
