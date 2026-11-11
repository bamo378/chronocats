import { useEffect, useRef, useState } from 'react'
import { Profile, addPlayTime, recordGame } from '../profiles/store'
import { UpdateProfile } from '../App'
import { pickFactFrom } from '../engine/exercises'
import { GAME_BY_ID, tablesLabel } from '../game/games'
import { applyRewards } from '../game/rewards'
import { GameBar, ResultView } from '../components/ui'
import { Icon } from '../components/Icon'
import { fx } from '../components/Fx'
import { sfx } from '../audio/sound'
import { Intro } from './Intro'

interface CardT { id: number; pair: number; text: string; kind: 'calc' | 'res' }

const PAIRS = 6

function deal(tables: number[]): CardT[] {
  const facts: { a: number; b: number; p: number }[] = []
  let guard = 0
  while (facts.length < PAIRS && guard++ < 400) {
    const { table, n } = pickFactFrom(tables, Math.random)
    const p = table * n
    // produits tous différents, sinon deux résultats seraient identiques
    if (facts.some((f) => f.p === p)) continue
    facts.push(Math.random() < 0.5 ? { a: table, b: n, p } : { a: n, b: table, p })
  }
  const cards: CardT[] = []
  facts.forEach((f, i) => {
    cards.push({ id: i * 2, pair: i, text: `${f.a} × ${f.b}`, kind: 'calc' })
    cards.push({ id: i * 2 + 1, pair: i, text: String(f.p), kind: 'res' })
  })
  return cards.sort(() => Math.random() - 0.5)
}

export function Memory({ profile, update, onExit, onAgain }: { profile: Profile; update: UpdateProfile; onExit: () => void; onAgain: () => void }) {
  const def = GAME_BY_ID.memory
  const tables = profile.selection
  const best = profile.records.memory
  const [phase, setPhase] = useState<'intro' | 'play' | 'end'>('intro')
  const [cards] = useState(() => deal(tables))
  const [open, setOpen] = useState<number[]>([])
  const [found, setFound] = useState<number[]>([])
  const [wrong, setWrong] = useState<number[]>([])
  const [moves, setMoves] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [result, setResult] = useState<{ record: boolean; xp: number; coins: number; cubes: number; secs: number } | null>(null)
  const t0 = useRef(0)
  const pairsCount = cards.length / 2

  useEffect(() => {
    if (phase !== 'play') return
    const id = setInterval(() => setElapsed((Date.now() - t0.current) / 1000), 100)
    return () => clearInterval(id)
  }, [phase])

  function flip(c: CardT, el: HTMLElement) {
    if (phase !== 'play' || open.length >= 2 || open.includes(c.id) || found.includes(c.pair)) return
    sfx.tap()
    const o = [...open, c.id]
    setOpen(o)
    if (o.length < 2) return
    setMoves((m) => m + 1)
    const [x, y] = o.map((id) => cards.find((k) => k.id === id)!)
    if (x.pair === y.pair && x.kind !== y.kind) {
      setTimeout(() => {
        sfx.good()
        const r = el.getBoundingClientRect()
        fx.burst(r.left + r.width / 2, r.top + r.height / 2, 'stars', 14)
        const f = [...found, x.pair]
        setFound(f)
        setOpen([])
        if (f.length === pairsCount) end(f.length)
      }, 250)
    } else {
      setTimeout(() => setWrong(o), 350)
      setTimeout(() => { sfx.soft(); setOpen([]); setWrong([]) }, 900)
    }
  }

  function end(pairs: number) {
    const secs = Math.round((Date.now() - t0.current) / 1000)
    const np: Profile = structuredClone(profile)
    addPlayTime(np, secs * 1000)
    const record = recordGame(np, { game: 'memory', score: secs, correct: pairs, total: moves + 1, tables }, true)
    const rw = applyRewards(np, { correct: pairs * 2, record, bonus: Math.max(0, 40 - secs) })
    update((p) => Object.assign(p, np))
    setResult({ record, secs, ...rw })
    setTimeout(() => {
      setPhase('end')
      if (record) { sfx.fanfare(); fx.burst(innerWidth / 2, innerHeight / 3, 'confetti', 90) }
    }, 700)
  }

  if (phase === 'intro') return <Intro def={def} tables={tables} best={best} onStart={() => { t0.current = Date.now(); setPhase('play') }} onExit={onExit} />

  if (phase === 'end' && result)
    return (
      <ResultView
        profile={profile}
        title="Memory"
        score={result.secs}
        unit="secondes"
        record={result.record}
        best={best !== undefined ? `${best} s` : undefined}
        stats={[['coups', moves], ['paires', `${pairsCount}/${pairsCount}`], ['livrets', tables.join(', ')]]}
        rewards={result}
        onAgain={onAgain}
        onExit={onExit}
      />
    )

  return (
    <div className="screen play memory">
      <GameBar onExit={onExit}>
        <span className="gb-title">Memory<small>{tablesLabel(tables)}</small></span>
        <span className="score-chip"><Icon name="grid" size={16} /> {found.length}/{pairsCount}</span>
        <span className="time-chip"><Icon name="timer" size={16} /> {Math.floor(elapsed)} s</span>
        <span className="gb-count">{moves} coup{moves > 1 ? 's' : ''}</span>
      </GameBar>
      <div className="mem-grid">
        {cards.map((c) => {
          const shown = open.includes(c.id) || found.includes(c.pair)
          return (
            <button
              key={c.id}
              className={`mem ${shown ? 'shown' : ''} ${found.includes(c.pair) ? 'found' : ''} ${wrong.includes(c.id) ? 'nope' : ''} k-${c.kind}`}
              onClick={(e) => flip(c, e.currentTarget)}
              aria-label={shown ? c.text : 'Carte cachée'}
            >
              <span className="mem-inner">
                <span className="mem-back"><Icon name="paw" size={30} /></span>
                <span className="mem-front">{c.text}</span>
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
