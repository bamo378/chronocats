import { useEffect, useRef, useState } from 'react'
import { Profile, addPlayTime } from '../profiles/store'
import { UpdateProfile } from '../App'
import { Exercise, generateFact, checkTyped, strategy } from '../engine/exercises'
import { recordSpeedAnswer } from '../engine/learner'
import { Cat } from '../components/Cat'
import { Icon } from '../components/Icon'
import { GameBar, Keypad, Miss } from '../components/ui'
import { fx } from '../components/Fx'
import { sfx } from '../audio/sound'
import { tablesLabel } from '../game/games'
import { testPlan, testPassed } from '../game/medals'

/** Mode Tester : sans aide ni deuxième chance. 90 % de réussite sur un livret = diplôme. */
export function Test({ profile, update, tables, onExit, onAgain, onTrain }: { profile: Profile; update: UpdateProfile; tables: number[]; onExit: () => void; onAgain: () => void; onTrain: () => void }) {
  const [list] = useState<Exercise[]>(() => testPlan(tables).map((q) => generateFact(q.table, q.n, Math.random, 'type')))
  const [phase, setPhase] = useState<'intro' | 'play' | 'end'>('intro')
  const [i, setI] = useState(0)
  const [typed, setTyped] = useState('')
  const [flash, setFlash] = useState<null | 'ok' | 'ko'>(null)
  const [elapsed, setElapsed] = useState(0)
  const [answers, setAnswers] = useState<{ table: number; ok: boolean }[]>([])
  const [misses, setMisses] = useState<Miss[]>([])
  const [newDiplomas, setNewDiplomas] = useState<number[]>([])
  const t0 = useRef(0)
  const lock = useRef(false)
  const prof = useRef(profile)
  prof.current = profile
  const ex = list[i]
  const N = list.length

  useEffect(() => {
    if (phase !== 'play') return
    const id = setInterval(() => setElapsed((Date.now() - t0.current) / 1000), 200)
    return () => clearInterval(id)
  }, [phase])

  function answer(v: number) {
    if (lock.current) return
    lock.current = true
    const r = checkTyped(ex, v)
    const np: Profile = structuredClone(prof.current)
    recordSpeedAnswer(np.learner, ex, r.correct, r.error, 0)
    update((p) => Object.assign(p, np))
    const all = [...answers, { table: ex.table, ok: r.correct }]
    setAnswers(all)
    if (r.correct) { setFlash('ok'); sfx.coin() }
    else {
      setFlash('ko'); sfx.soft()
      const n = ex.a === ex.table ? ex.b : ex.a
      setMisses((m) => [...m, { a: ex.a, b: ex.b, p: ex.product, tip: strategy(ex.table, n) }])
    }
    setTimeout(() => {
      setFlash(null)
      setTyped('')
      lock.current = false
      if (i + 1 >= N) finish(all)
      else setI(i + 1)
    }, r.correct ? 350 : 1300)
  }

  function press(k: string) {
    if (phase !== 'play' || lock.current) return
    if (k === '⌫') { setTyped((t) => t.slice(0, -1)); return }
    if (k === 'OK') { if (typed) answer(Number(typed)); return }
    setTyped((t) => (t.length >= 3 ? t : t + k))
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) press(e.key)
      else if (e.key === 'Backspace') press('⌫')
      else if (e.key === 'Enter') press('OK')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  function finish(all: { table: number; ok: boolean }[]) {
    const ms = Date.now() - t0.current
    const np: Profile = structuredClone(prof.current)
    addPlayTime(np, ms)
    const got: number[] = []
    for (const t of [...new Set(all.map((a) => a.table))]) {
      const asked = all.filter((a) => a.table === t)
      const ok = asked.filter((a) => a.ok).length
      const pct = Math.round((ok / asked.length) * 100)
      const prev = np.tests[t]
      const passed = testPassed(ok, asked.length)
      if (passed && !prev?.passed) got.push(t)
      np.tests = { ...np.tests, [t]: { best: Math.max(prev?.best ?? 0, pct), passed: !!prev?.passed || passed, at: Date.now() } }
      np.points = { ...np.points, [t]: (np.points[t] ?? 0) + ok * 5 + (passed && !prev?.passed ? 50 : 0) }
    }
    const ok = all.filter((a) => a.ok).length
    np.xp = (np.xp ?? 0) + ok * 10 + got.length * 50
    np.coins += ok * 2
    np.cubes += got.length * 5
    update((p) => Object.assign(p, np))
    setNewDiplomas(got)
    setPhase('end')
    if (ok / all.length >= 0.9) { sfx.fanfare(); setTimeout(() => fx.burst(innerWidth / 2, innerHeight / 3, 'confetti', 100), 200) }
    else sfx.good()
  }

  if (phase === 'intro')
    return (
      <div className="screen intro">
        <GameBar onExit={onExit} />
        <div className="intro-card">
          <span className="intro-art test-art"><Icon name="medal" size={56} stroke={1.8} /></span>
          <h1>Tester mes connaissances</h1>
          <p className="intro-rules">{N} calculs sur {tablesLabel(tables).toLowerCase()}. Pas d’astuce ni de deuxième essai : tu tapes la réponse et tu valides. Avec 90 % de bonnes réponses sur un livret, tu obtiens son diplôme.</p>
          <div className="intro-meta">
            <span className="pill"><Icon name="target" size={16} /> {tablesLabel(tables)}</span>
            <span className="pill"><Icon name="timer" size={16} /> Pas de limite de temps</span>
          </div>
          <button className="btn btn-primary big" onClick={() => { t0.current = Date.now(); setPhase('play') }}><Icon name="play" fill /> Commencer le test</button>
        </div>
      </div>
    )

  if (phase === 'end') {
    const ok = answers.filter((a) => a.ok).length
    const pct = Math.round((ok / answers.length) * 100)
    const grade = pct >= 90 ? 'Excellent !' : pct >= 75 ? 'Très bien' : pct >= 50 ? 'Pas mal' : 'À retravailler'
    const ts = [...new Set(answers.map((a) => a.table))].sort((a, b) => a - b)
    return (
      <div className="screen result">
        <div className="result-card">
          <div className="result-top">
            <Cat coat={profile.cat.coat} accessory={profile.cat.accessory} mood={pct >= 75 ? 'cheer' : 'happy'} size={92} className={pct >= 75 ? 'jump' : ''} />
            <div>
              <div className="eyebrow">Résultat du test</div>
              <h1>{grade}</h1>
            </div>
          </div>
          <div className="result-score">
            <span className="big-num">{ok}<small>/{answers.length}</small></span>
            <span className="big-unit">{pct} % · {Math.round(elapsed)} s</span>
          </div>
          <div className="test-tables">
            {ts.map((t) => {
              const asked = answers.filter((a) => a.table === t)
              const good = asked.filter((a) => a.ok).length
              const passed = testPassed(good, asked.length)
              return (
                <div key={t} className={`tt ${passed ? 'pass' : ''} ${newDiplomas.includes(t) ? 'new' : ''}`}>
                  <span className="tt-n">{t}</span>
                  <span className="tt-score">{good}/{asked.length}</span>
                  <span className="tt-s">{newDiplomas.includes(t) ? <><Icon name="medal" size={16} /> Diplôme obtenu !</> : passed ? <><Icon name="check" size={16} /> Réussi</> : asked.length < 5 ? 'Trop peu de questions' : 'Pas encore'}</span>
                </div>
              )
            })}
          </div>
          {misses.length > 0 && (
            <div className="misses">
              <div className="eyebrow">Tes erreurs</div>
              <ul>{misses.slice(0, 8).map((m, k) => <li key={k}><span className="mono">{m.a} × {m.b} = <b>{m.p}</b></span><small>{m.tip}</small></li>)}</ul>
            </div>
          )}
          <div className="result-actions">
            {misses.length > 0 && <button className="btn btn-primary big" onClick={onTrain}><Icon name="target" /> M’entraîner</button>}
            <button className={`btn ${misses.length ? 'btn-ghost' : 'btn-primary'} big`} onClick={onAgain}><Icon name="refresh" /> Refaire le test</button>
          </div>
          <button className="btn btn-ghost" onClick={onExit}>Retour aux livrets</button>
        </div>
      </div>
    )
  }

  return (
    <div className="screen play">
      <GameBar onExit={onExit}>
        <span className="gb-title">Test<small>{tablesLabel(tables)}</small></span>
        <span className="gb-step">{i + 1} / {N}</span>
        <span className="gb-progress"><i style={{ width: `${(i / N) * 100}%` }} /></span>
        <span className="time-chip"><Icon name="timer" size={16} /> {Math.floor(elapsed)} s</span>
      </GameBar>
      <div className="arena-body">
        <div className={`calc ${flash === 'ok' ? 'calc-ok' : ''} ${flash === 'ko' ? 'calc-shake' : ''}`}>
          <span>{ex.a}</span><span className="op">×</span><span>{ex.b}</span><span className="op">=</span>
          <span className={`slot ${typed ? 'filled' : ''} ${flash === 'ko' ? 'bad' : ''}`}>{flash === 'ko' ? ex.product : typed || '?'}</span>
        </div>
        <Keypad onKey={press} okDisabled={!typed} />
      </div>
    </div>
  )
}
