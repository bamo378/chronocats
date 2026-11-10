import { useMemo, useState } from 'react'
import { ParentSettings, PROFILES, ProfileId, loadProfile, saveProfile, hashPin, Profile } from '../profiles/store'
import { stats, isDue, newSkillState, hardestFacts, newLearner } from '../engine/learner'
import { SKILLS, SkillId, SKILL_BY_ID } from '../engine/skills'
import { ErrorType } from '../engine/exercises'

const ERR_LABEL: Record<ErrorType, string> = {
  voisin: 'Donne le résultat d’à côté dans le livret (7 × 8 → 49 ou 63)',
  addition: 'Additionne au lieu de multiplier (7 × 8 → 15)',
  chiffres: 'Inverse les chiffres (56 → 65)',
  calcul: 'Petites erreurs de calcul (à 1 ou 2 près)',
  autre: 'Autres erreurs',
}

const ERR_TIP: Record<ErrorType, string> = {
  voisin: 'Réciter le livret à voix haute en comptant sur les doigts, puis repartir d’un calcul connu (7 × 7 = 49, donc 7 × 8 = 49 + 7).',
  addition: 'Revoir le sens : 4 × 3, c’est 4 paquets de 3 (des Lego, des bonbons…).',
  chiffres: 'Faire dire le résultat à voix haute avant de l’écrire.',
  calcul: 'Utiliser les astuces : × 9 = × 10 moins une fois, × 4 = le double du double.',
  autre: 'Reprendre le livret avec la mini-leçon et sans chrono.',
}

export function Parent({ settings, updateSettings, onExit }: { settings: ParentSettings; updateSettings: (fn: (s: ParentSettings) => void) => void; onExit: () => void }) {
  const [ok, setOk] = useState(false)
  const [pin, setPin] = useState('')
  const [pin2, setPin2] = useState('')
  const [err, setErr] = useState('')
  const creating = !settings.pinHash

  async function submit() {
    setErr('')
    if (!/^\d{4,6}$/.test(pin)) { setErr('Code de 4 à 6 chiffres.'); return }
    if (creating) {
      if (pin !== pin2) { setErr('Les deux codes ne correspondent pas.'); return }
      const h = await hashPin(pin)
      updateSettings((s) => { s.pinHash = h })
      setOk(true)
    } else {
      if ((await hashPin(pin)) === settings.pinHash) setOk(true)
      else { setErr('Code incorrect.'); setPin('') }
    }
  }

  if (!ok)
    return (
      <div className="screen parent-gate">
        <div className="sky dusk" />
        <div className="panel gate">
          <h1>🔒 Espace parents</h1>
          <p className="lead">{creating ? 'Choisissez un code parental (4 à 6 chiffres).' : 'Entrez le code parental.'}</p>
          <input className="pin" type="password" inputMode="numeric" autoComplete="off" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} placeholder="••••" maxLength={6} />
          {creating && <input className="pin" type="password" inputMode="numeric" autoComplete="off" value={pin2} onChange={(e) => setPin2(e.target.value.replace(/\D/g, ''))} placeholder="Confirmer" maxLength={6} />}
          {err && <p className="err">{err}</p>}
          <div className="row">
            <button className="btn btn-ghost" onClick={onExit}>Retour</button>
            <button className="btn btn-primary" onClick={submit}>{creating ? 'Créer le code' : 'Entrer'}</button>
          </div>
        </div>
      </div>
    )

  return <Dashboard settings={settings} updateSettings={updateSettings} onExit={onExit} />
}

function Dashboard({ settings, updateSettings, onExit }: { settings: ParentSettings; updateSettings: (fn: (s: ParentSettings) => void) => void; onExit: () => void }) {
  const [who, setWho] = useState<ProfileId>('anaelle')
  const [tick, setTick] = useState(0)
  const p = useMemo(() => loadProfile(who), [who, tick])
  const s7 = stats(p.learner, 7)
  const hard = hardestFacts(p.learner)
  const s30 = stats(p.learner, 30)
  const now = Date.now()
  const masteredList = SKILLS.filter((s) => p.learner.skills[s.id].mastered)
  const inProgress = SKILLS.filter((s) => !p.learner.skills[s.id].mastered && p.learner.skills[s.id].attempts > 0)
  const [resetSkill, setResetSkill] = useState<SkillId>('x1x10')

  const days7 = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(now - (6 - i) * 86400000)
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    return { label: d.toLocaleDateString('fr-CH', { weekday: 'short' }), min: Math.round((p.playByDay[k] ?? 0) / 60000) }
  })
  const maxMin = Math.max(10, ...days7.map((d) => d.min))

  function save(next: Profile) { saveProfile(next); setTick((t) => t + 1) }

  function resetChapter() {
    if (!confirm(`Réinitialiser le chapitre « ${SKILL_BY_ID[resetSkill].title} » pour ${p.name} ? La ville et les récompenses sont conservées.`)) return
    const n = structuredClone(p)
    n.learner.skills[resetSkill] = newSkillState()
    save(n)
  }

  function redoDiagnostic() {
    if (!confirm(`Refaire le diagnostic de ${p.name} à la prochaine connexion ? La ville est conservée.`)) return
    const n = structuredClone(p)
    n.learner = newLearner()
    save(n)
  }

  const recs: string[] = []
  for (const [e] of s30.errors.slice(0, 2)) recs.push(ERR_TIP[e])
  if (s7.minutes < 20) recs.push('Quelques séances courtes (10–15 min) dans la semaine suffisent : la régularité compte plus que la durée.')
  if (hard.length) recs.push(`À revoir en priorité : ${hard.slice(0, 3).map((h) => h.fact.replace('x', ' × ')).join(', ')}. Le jeu les repropose automatiquement plus souvent.`)
  if (s7.accuracy > 0.9 && s7.answers > 20) recs.push('Très bonne précision : elle est prête pour les livrets suivants.')
  if (!recs.length) recs.push('Pas encore assez de données : laissez-la jouer quelques missions.')

  return (
    <div className="screen parent">
      <header className="parent-top">
        <h1>Tableau de bord parents</h1>
        <button className="btn btn-ghost" onClick={onExit}>Quitter</button>
      </header>
      <div className="tabs">
        {PROFILES.map((x) => <button key={x.id} className={`tab ${who === x.id ? 'on' : ''}`} onClick={() => setWho(x.id)}>{x.name}</button>)}
      </div>

      {!p.setupDone ? (
        <div className="card"><p>{p.name} n’a pas encore commencé l’aventure.</p></div>
      ) : (
        <div className="pgrid">
          <div className="card">
            <h3>Cette semaine</h3>
            <div className="kpis">
              <div><b>{s7.minutes}</b><span>minutes</span></div>
              <div><b>{s7.answers}</b><span>réponses</span></div>
              <div><b>{Math.round(s7.accuracy * 100)}%</b><span>précision</span></div>
            </div>
            <div className="bars">
              {days7.map((d, i) => (
                <div key={i} className="bar-col"><i style={{ height: `${(d.min / maxMin) * 100}%` }} /><span>{d.label}</span></div>
              ))}
            </div>
            <p className="muted">30 jours : {s30.minutes} min · {s30.answers} réponses · {Math.round(s30.accuracy * 100)} % · révisions : {s30.reviewAccuracy === undefined ? '—' : Math.round(s30.reviewAccuracy * 100) + ' %'} ({s30.reviews})</p>
          </div>

          <div className="card">
            <h3>Compétences</h3>
            <ul className="skill-list">
              {SKILLS.map((s) => {
                const st = p.learner.skills[s.id]
                const acc = st.attempts ? Math.round((st.correct / st.attempts) * 100) : null
                return (
                  <li key={s.id} className={st.mastered ? 'm' : st.attempts ? 'p' : ''}>
                    <span>{s.chapter}. {s.title}</span>
                    <span className="muted">
                      {st.mastered ? (isDue(st, now) ? 'à réviser' : `maîtrisé · révision ${st.due ? new Date(st.due).toLocaleDateString('fr-CH') : ''}`) : st.attempts ? `en cours · ${acc} %` : '—'}
                    </span>
                  </li>
                )
              })}
            </ul>
            <p className="muted">{masteredList.length} maîtrisé(s), {inProgress.length} en cours.</p>
          </div>

          <div className="card">
            <h3>Erreurs fréquentes (30 jours)</h3>
            {s30.errors.length ? (
              <ul className="err-list">{s30.errors.map(([e, n]) => <li key={e}><span>{ERR_LABEL[e]}</span><b>{n}</b></li>)}</ul>
            ) : <p className="muted">Aucune erreur récurrente.</p>}
            <h3>Calculs les plus difficiles</h3>
            {hard.length ? (
              <div className="hard-facts">{hard.map((h) => <span key={h.fact} className="hf">{h.fact.replace('x', ' × ')} <small>{h.ko} erreur{h.ko > 1 ? 's' : ''}</small></span>)}</div>
            ) : <p className="muted">Aucun pour l’instant.</p>}
            <h3>Recommandations</h3>
            <ul className="recs">{recs.map((r) => <li key={r}>{r}</li>)}</ul>
          </div>

          <div className="card">
            <h3>Réglages</h3>
            <label className="field">
              <span>Durée de séance conseillée</span>
              <select value={settings.sessionMinutes} onChange={(e) => updateSettings((s) => { s.sessionMinutes = +e.target.value })}>
                {[10, 15, 20, 30].map((m) => <option key={m} value={m}>{m} minutes</option>)}
              </select>
            </label>
            <p className="muted">Au-delà, un message propose gentiment une pause. Rien n’est bloqué ni perdu.</p>
            <label className="check"><input type="checkbox" checked={settings.sound} onChange={(e) => updateSettings((s) => { s.sound = e.target.checked })} /> Sons activés</label>
            <h3>Réinitialiser un chapitre</h3>
            <div className="row">
              <select value={resetSkill} onChange={(e) => setResetSkill(e.target.value as SkillId)}>
                {SKILLS.map((s) => <option key={s.id} value={s.id}>{s.chapter}. {s.title}</option>)}
              </select>
              <button className="btn btn-ghost" onClick={resetChapter}>Réinitialiser</button>
            </div>
            <button className="btn btn-ghost" onClick={redoDiagnostic}>Refaire le diagnostic</button>
            <button className="btn btn-ghost" onClick={() => { if (confirm('Changer le code parental ?')) updateSettings((s) => { s.pinHash = undefined }); onExit() }}>Changer le code</button>
            <p className="muted">Les données restent sur cet appareil, sans publicité ni contact extérieur.</p>
          </div>
        </div>
      )}
    </div>
  )
}
