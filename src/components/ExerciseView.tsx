import { useEffect, useRef, useState } from 'react'
import { Clock } from './Clock'
import { Exercise, ErrorType, checkSetClock, explain, hint as hintText } from '../engine/exercises'
import { Time, digital } from '../engine/clock'
import { sfx } from '../audio/sound'
import { CHEERS, COMFORT } from '../game/missions'

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
  const [time, setTime] = useState<Time>(ex.start ?? ex.target)
  const [tries, setTries] = useState(0)
  const [disabled, setDisabled] = useState<number[]>([])
  const [picked, setPicked] = useState<number | null>(null)
  const [fb, setFb] = useState<Feedback>(null)
  const [ghost, setGhost] = useState<Time | undefined>()
  const [hintOn, setHintOn] = useState(false)
  const firstError = useRef<ErrorType | undefined>()
  const t0 = useRef(Date.now())

  useEffect(() => {
    setTime(ex.start ?? ex.target)
    setTries(0); setDisabled([]); setPicked(null); setFb(null); setGhost(undefined); setHintOn(false)
    firstError.current = undefined
    t0.current = Date.now()
  }, [ex.id])

  const finish = (eventually: boolean) => {
    onDone({ firstTry: eventually && tries === 0, eventually, hint: hintOn, error: firstError.current, ms: Date.now() - t0.current })
  }

  function resolve(ok: boolean, error: ErrorType | undefined) {
    const attempt = tries + 1
    setTries(attempt)
    if (ok) {
      sfx.good()
      onCatMood?.('cheer')
      setFb({ ok: true, text: attempt > 1 ? 'Bravo, tu as persévéré !' : rand(CHEERS), final: true })
      setTimeout(() => onDone({ firstTry: attempt === 1, eventually: true, hint: hintOn, error: firstError.current, ms: Date.now() - t0.current }), 1100)
      return
    }
    sfx.soft()
    onCatMood?.('think')
    if (attempt === 1) firstError.current = error
    if (diagnostic) {
      setFb({ ok: false, text: 'Merci ! On va apprendre ça ensemble.', final: true })
      return
    }
    const final = attempt >= 2
    // Aide visuelle : à la 2e erreur, les aiguilles fantômes montrent la bonne position.
    if (final && (ex.kind === 'setClock' || ex.kind === 'fixClock')) setGhost(ex.target)
    setFb({ ok: false, text: final ? explain(error, ex.target) : `${rand(COMFORT)} ${explain(error, ex.target, false)}`, final })
  }

  // --- vérifications ---
  function choose(i: number) {
    if (fb?.ok || (fb?.final)) return
    sfx.tap()
    const c = ex.choices![i]
    setPicked(i)
    if (!c.correct) setDisabled((d) => [...d, i])
    resolve(c.correct, c.error)
  }

  function tapHand(h: 'hour' | 'minute') {
    if (fb?.ok || fb?.final) return
    const ok = h === ex.hand
    if (!ok) setDisabled((d) => [...d, h === 'hour' ? 0 : 1])
    resolve(ok, ok ? undefined : 'aiguilles')
  }

  function validateClock() {
    if (fb?.ok || fb?.final) return
    const r = checkSetClock(ex.target, time)
    resolve(r.correct, r.error)
  }

  const isSet = ex.kind === 'setClock' || ex.kind === 'fixClock'
  const showClockBig = ex.kind !== 'pickClock'
  const highlight = ex.kind === 'handRole' ? (ex.prompt.includes('grande') ? 'minute' : 'hour') : undefined
  const correctLabel = ex.choices?.find((c) => c.correct)?.label

  return (
    <div className={`exercise kind-${ex.kind}`}>
      {showClockBig && (
        <div className="ex-clock">
          <Clock
            time={isSet ? time : ex.target}
            onChange={isSet && !fb?.ok && !fb?.final ? setTime : undefined}
            snap={ex.snap}
            showMinuteLabels={ex.showMinuteLabels || hintOn}
            ghost={ghost}
            onTapHand={ex.kind === 'tapHand' ? tapHand : undefined}
            highlight={fb?.final && !fb.ok && ex.kind === 'tapHand' ? ex.hand : highlight}
            size="100%"
          />
          {isSet && !fb && <div className="drag-help">Fais glisser les aiguilles avec ton doigt</div>}
        </div>
      )}

      <div className="ex-side">
        {ex.context && <div className="ex-context">{ex.context}</div>}
        <h2 className="ex-prompt">{ex.prompt}</h2>

        {ex.choices && ex.kind !== 'pickClock' && (
          <div className={`choices ${ex.choices.length > 2 ? 'grid2' : ''}`}>
            {ex.choices.map((c, i) => (
              <button
                key={i}
                className={`choice ${disabled.includes(i) ? 'wrong' : ''} ${(fb?.ok && picked === i) || (fb?.final && c.correct) ? 'right' : ''}`}
                disabled={disabled.includes(i) || !!fb?.ok || !!fb?.final}
                onClick={() => choose(i)}
              >
                {c.label}
              </button>
            ))}
          </div>
        )}

        {ex.kind === 'pickClock' && (
          <div className="clock-picks">
            {ex.choices!.map((c, i) => (
              <button
                key={i}
                className={`pick ${disabled.includes(i) ? 'wrong' : ''} ${(fb?.ok && picked === i) || (fb?.final && c.correct) ? 'right' : ''}`}
                disabled={disabled.includes(i) || !!fb?.ok || !!fb?.final}
                onClick={() => choose(i)}
                aria-label={`horloge ${i + 1}`}
              >
                <Clock time={c.time!} size="100%" ears={false} showMinuteLabels={ex.showMinuteLabels} />
              </button>
            ))}
          </div>
        )}

        {isSet && (
          <button className="btn btn-primary big" onClick={validateClock} disabled={!!fb?.ok || !!fb?.final}>
            ✔ Valider
          </button>
        )}

        {fb && (
          <div className={`feedback ${fb.ok ? 'ok' : 'ko'}`}>
            <p>{fb.text}</p>
            {!fb.ok && fb.final && (
              <button className="btn btn-primary" onClick={() => finish(false)}>
                {diagnostic ? 'Continuer' : ex.kind === 'tapHand' ? `C’était ${ex.hand === 'hour' ? 'la petite aiguille rose' : 'la grande aiguille violette'} · Continuer` : correctLabel ? `C’était « ${correctLabel} » · Continuer` : `C’était ${digital(ex.target)} · Continuer`}
              </button>
            )}
            {!fb.ok && !fb.final && <p className="retry">Essaie encore une fois !</p>}
          </div>
        )}

        {!diagnostic && !fb?.ok && !fb?.final && !hintOn && (
          <button className="btn btn-ghost hint-btn" onClick={() => { setHintOn(true); onCatMood?.('wow') }}>
            💡 Un indice
          </button>
        )}
        {hintOn && !fb?.ok && <div className="hint">💡 {hintText(ex)}</div>}
      </div>
    </div>
  )
}
