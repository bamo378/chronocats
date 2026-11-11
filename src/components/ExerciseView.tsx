import { useEffect, useRef, useState } from 'react'
import { Exercise, ErrorType, checkTyped, explain, hint as hintText } from '../engine/exercises'
import { sfx } from '../audio/sound'
import { Icon } from './Icon'
import { Keypad } from './ui'

const CHEERS = ['Bravo !', 'Exact !', 'Parfait !', 'Bien vu !', 'Impeccable !', 'Juste !', 'Excellent !']
const COMFORT = ['Pas grave, réessaie.', 'Presque !', 'Bien tenté.', 'On réessaie.']
import { CubeArray } from './CubeArray'
import { fx } from './Fx'

export interface ExerciseOutcome {
  /** Réussi du premier coup. */
  firstTry: boolean
  /** Réussi finalement (après un nouvel essai). */
  eventually: boolean
  hint: boolean
  error?: ErrorType
  ms: number
}

interface Props {
  ex: Exercise
  onDone: (o: ExerciseOutcome) => void
  /** Diagnostic : pas d'indice ni de second essai, ton neutre et encourageant. */
  diagnostic?: boolean
  onCatMood?: (m: 'happy' | 'think' | 'cheer' | 'wow') => void
}

type Feedback = { ok: boolean; text: string; final: boolean } | null

const rand = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)]

export function ExerciseView({ ex, onDone, diagnostic, onCatMood }: Props) {
  const [tries, setTries] = useState(0)
  const [disabled, setDisabled] = useState<number[]>([])
  const [picked, setPicked] = useState<number | null>(null)
  const [typed, setTyped] = useState('')
  const [fb, setFb] = useState<Feedback>(null)
  const [hintOn, setHintOn] = useState(false)
  const firstError = useRef<ErrorType | undefined>()
  const t0 = useRef(Date.now())
  const visual = useRef<HTMLDivElement>(null)
  const [shake, setShake] = useState(0)
  const locked = !!fb?.ok || !!fb?.final

  useEffect(() => {
    setTries(0); setDisabled([]); setPicked(null); setTyped(''); setFb(null); setHintOn(false)
    firstError.current = undefined
    t0.current = Date.now()
  }, [ex.id])

  function resolve(ok: boolean, error: ErrorType | undefined) {
    const attempt = tries + 1
    setTries(attempt)
    if (ok) {
      sfx.good()
      fx.at(visual.current, 'stars', 26)
      onCatMood?.('cheer')
      setFb({ ok: true, text: attempt > 1 ? 'Bravo, tu as persévéré !' : rand(CHEERS), final: true })
      setTimeout(() => onDone({ firstTry: attempt === 1, eventually: true, hint: hintOn, error: firstError.current, ms: Date.now() - t0.current }), 1000)
      return
    }
    sfx.soft()
    setShake((k) => k + 1)
    onCatMood?.('think')
    if (attempt === 1) firstError.current = error
    if (diagnostic) {
      setFb({ ok: false, text: 'Merci ! On va travailler ce livret ensemble.', final: true })
      return
    }
    const final = attempt >= 2
    setFb({ ok: false, text: final ? explain(error, ex) : `${rand(COMFORT)} ${explain(error, ex, false)}`, final })
    if (!final) setTyped('')
  }

  function choose(i: number) {
    if (locked) return
    sfx.tap()
    const c = ex.choices![i]
    setPicked(i)
    if (!c.correct) setDisabled((d) => [...d, i])
    resolve(c.correct, c.error)
  }

  function submitTyped() {
    if (locked || !typed) return
    const r = checkTyped(ex, Number(typed))
    resolve(r.correct, r.error)
  }

  function press(k: string) {
    if (locked) return
    if (k === '⌫') { setTyped((t) => t.slice(0, -1)); return }
    if (k === 'OK') { submitTyped(); return }
    sfx.tap()
    setTyped((t) => (t.length >= 3 ? t : (t === '0' ? k : t + k)))
    if (fb && !fb.ok) setFb(null)
  }

  // Clavier physique (ordinateur, clavier d'iPad).
  useEffect(() => {
    if (!(ex.kind === 'type' || ex.kind === 'missing')) return
    const onKey = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) press(e.key)
      else if (e.key === 'Backspace') press('⌫')
      else if (e.key === 'Enter') press('OK')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const isTyping = ex.kind === 'type' || ex.kind === 'missing'
  const showAnswer = fb?.final && !fb.ok

  // Énoncé visuel : le calcul en grand, le nombre caché en surbrillance.
  const card = (
    <div key={shake} className={`calc ${fb?.ok ? 'calc-ok' : ''} ${shake && !fb?.ok ? 'calc-shake' : ''}`}>
      {ex.kind === 'missing' ? (
        <>
          <span>{ex.a}</span><span className="op">×</span>
          <span className={`slot ${typed ? 'filled' : ''}`}>{fb?.ok || showAnswer ? ex.answer as number : typed || '?'}</span>
          <span className="op">=</span><span>{ex.product}</span>
        </>
      ) : (
        <>
          <span>{ex.a}</span><span className="op">×</span><span>{ex.b}</span><span className="op">=</span>
          {ex.kind === 'trueFalse' ? (
            <span className={`claimed ${fb?.ok || showAnswer ? (ex.answer ? 'yes' : 'no') : ''}`}>{ex.claimed}</span>
          ) : (
            <span className={`slot ${typed ? 'filled' : ''}`}>{fb?.ok || showAnswer ? ex.product : isTyping ? typed || '?' : '?'}</span>
          )}
        </>
      )}
    </div>
  )

  return (
    <div className={`exercise kind-${ex.kind}`}>
      <div className="ex-visual" ref={visual}>
        {ex.kind === 'array' ? (
          <>
            <CubeArray rows={ex.a} cols={ex.b} />
            <div className="calc small">{ex.a} × {ex.b} = {fb?.ok || showAnswer ? ex.product : '?'}</div>
          </>
        ) : card}
        {ex.kind === 'trueFalse' && <p className="ex-question">Vrai ou faux ?</p>}
      </div>

      <div className="ex-side">
        {ex.kind === 'array' && <h2 className="ex-prompt">{ex.prompt}</h2>}
        {ex.kind === 'missing' && <h2 className="ex-prompt">Quel nombre est caché ?</h2>}

        {ex.choices && (
          <div className={`choices ${ex.choices.length > 2 ? 'grid2' : 'grid2'}`}>
            {ex.choices.map((c, i) => (
              <button
                key={i}
                className={`choice ${disabled.includes(i) ? 'wrong' : ''} ${(fb?.ok && picked === i) || (showAnswer && c.correct) ? 'right' : ''} ${c.label === 'Vrai' ? 'tf-true' : c.label === 'Faux' ? 'tf-false' : ''}`}
                disabled={disabled.includes(i) || locked}
                onClick={() => choose(i)}
              >
                {c.label}
              </button>
            ))}
          </div>
        )}

        {isTyping && <Keypad onKey={press} disabled={locked} okDisabled={!typed} />}

        {fb && (
          <div className={`feedback ${fb.ok ? 'ok' : 'ko'}`}>
            <p>{fb.text}</p>
            {showAnswer && (
              <button className="btn btn-primary" onClick={() => onDone({ firstTry: false, eventually: false, hint: hintOn, error: firstError.current, ms: Date.now() - t0.current })}>
                Continuer
              </button>
            )}
            {!fb.ok && !fb.final && <p className="retry">Essaie encore une fois !</p>}
          </div>
        )}

        {!diagnostic && !locked && !hintOn && (
          <button className="btn btn-ghost hint-btn" onClick={() => { setHintOn(true); onCatMood?.('wow') }}>
            <Icon name="bulb" size={18} /> Une astuce
          </button>
        )}
        {hintOn && !fb?.ok && <div className="hint"><Icon name="bulb" size={18} /> {hintText(ex)}</div>}
      </div>
    </div>
  )
}
