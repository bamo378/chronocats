// Petits sons synthétisés (aucun fichier à charger), désactivables.

let ctx: AudioContext | null = null
let enabled = true

export function setSound(on: boolean) {
  enabled = on
}
export function soundOn() {
  return enabled
}

function ac(): AudioContext | null {
  if (!enabled) return null
  try {
    if (!ctx) ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    if (ctx.state === 'suspended') ctx.resume()
    return ctx
  } catch {
    return null
  }
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = 'sine', vol = 0.12) {
  const c = ac()
  if (!c) return
  const o = c.createOscillator()
  const g = c.createGain()
  o.type = type
  o.frequency.value = freq
  const t = c.currentTime + start
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(vol, t + 0.01)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  o.connect(g).connect(c.destination)
  o.start(t)
  o.stop(t + dur + 0.02)
}

export const sfx = {
  tap: () => tone(660, 0, 0.08, 'triangle', 0.06),
  tick: () => tone(1200, 0, 0.03, 'square', 0.02),
  good: () => { tone(660, 0, 0.12, 'triangle'); tone(880, 0.09, 0.14, 'triangle'); tone(1320, 0.18, 0.2, 'triangle') },
  soft: () => { tone(330, 0, 0.18, 'sine', 0.08); tone(294, 0.12, 0.22, 'sine', 0.07) },
  coin: () => { tone(988, 0, 0.08, 'square', 0.04); tone(1319, 0.07, 0.18, 'square', 0.04) },
  place: () => { tone(220, 0, 0.08, 'triangle', 0.1); tone(440, 0.05, 0.1, 'triangle', 0.06) },
  remove: () => tone(180, 0, 0.12, 'sawtooth', 0.04),
  meow: () => {
    const c = ac()
    if (!c) return
    const o = c.createOscillator()
    const g = c.createGain()
    o.type = 'triangle'
    const t = c.currentTime
    o.frequency.setValueAtTime(600, t)
    o.frequency.linearRampToValueAtTime(900, t + 0.12)
    o.frequency.linearRampToValueAtTime(520, t + 0.35)
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(0.08, t + 0.03)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.4)
    o.connect(g).connect(c.destination)
    o.start(t)
    o.stop(t + 0.45)
  },
  fanfare: () => [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, i * 0.11, 0.2, 'triangle', 0.09)),
}
