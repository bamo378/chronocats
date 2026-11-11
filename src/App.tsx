import { useCallback, useEffect, useState } from 'react'
import { Profile, ProfileId, loadProfile, saveProfile, loadParent, ParentSettings, saveParent } from './profiles/store'
import { setSound } from './audio/sound'
import { Home } from './screens/Home'
import { Setup } from './screens/Setup'
import { Diagnostic } from './screens/Diagnostic'
import { Parent } from './screens/Parent'
import { Hub, Tab } from './screens/hub/Hub'
import { Session, SessionMode } from './screens/Session'
import { LessonScreen } from './screens/LessonScreen'
import { Train } from './screens/Train'
import { Test } from './screens/Test'
import { Speed } from './games/Speed'
import { Memory } from './games/Memory'
import { Bubbles } from './games/Bubbles'
import { TrueFalse } from './games/TrueFalse'
import { Duel } from './games/Duel'
import { Daily } from './games/Daily'
import { FxLayer } from './components/Fx'
import { SvgDefs } from './components/ui'
import { GameDef } from './game/games'

export type Screen =
  | { name: 'home' }
  | { name: 'setup' }
  | { name: 'diagnostic' }
  | { name: 'hub' }
  | { name: 'session'; mode: SessionMode; tables: number[] }
  | { name: 'lesson'; table: number }
  | { name: 'train'; tables: number[]; n?: number }
  | { name: 'test'; tables: number[]; n?: number }
  | { name: 'game'; id: GameDef['id']; n?: number }
  | { name: 'duel'; a: string; b: string; n?: number }
  | { name: 'daily' }
  | { name: 'parent' }

export type UpdateProfile = (fn: (p: Profile) => void) => void
export type Go = (s: Screen) => void

export default function App() {
  return (
    <>
      <SvgDefs />
      <Game />
      <FxLayer />
    </>
  )
}

function Game() {
  const [screen, setScreen] = useState<Screen>({ name: 'home' })
  const [tab, setTab] = useState<Tab>('today')
  const [profile, setProfile] = useState<Profile | null>(null)
  const [parent, setParent] = useState<ParentSettings>(() => loadParent())

  useEffect(() => setSound(parent.sound), [parent.sound])

  const update: UpdateProfile = useCallback((fn) => {
    setProfile((prev) => {
      if (!prev) return prev
      const next: Profile = structuredClone(prev)
      fn(next)
      saveProfile(next)
      return next
    })
  }, [])

  const updateParent = (fn: (s: ParentSettings) => void) => {
    setParent((prev) => {
      const n = { ...prev }
      fn(n)
      saveParent(n)
      return n
    })
  }

  const go: Go = (s) => {
    window.scrollTo(0, 0)
    setScreen(s)
  }
  const back = () => go({ name: 'hub' })

  function choose(id: ProfileId) {
    const p = loadProfile(id)
    setProfile(p)
    setTab('today')
    if (!p.setupDone) setScreen({ name: 'setup' })
    else if (!p.learner.diagnosticDone) setScreen({ name: 'diagnostic' })
    else setScreen({ name: 'hub' })
  }

  const toggleSound = () => updateParent((s) => { s.sound = !s.sound })

  if (screen.name === 'parent') return <Parent settings={parent} updateSettings={updateParent} onExit={() => go({ name: 'home' })} />
  if (screen.name === 'home' || !profile) return <Home onChoose={choose} onParent={() => go({ name: 'parent' })} sound={parent.sound} toggleSound={toggleSound} />

  const common = { profile, update, onExit: back }
  switch (screen.name) {
    case 'setup':
      return <Setup profile={profile} update={update} onDone={() => go({ name: 'diagnostic' })} onBack={() => go({ name: 'home' })} />
    case 'diagnostic':
      return <Diagnostic profile={profile} update={update} onDone={back} />
    case 'session':
      return <Session key={JSON.stringify(screen)} {...common} mode={screen.mode} tables={screen.tables} onAgain={() => go({ ...screen })} />
    case 'train':
      return <Train key={screen.n ?? 0} {...common} tables={screen.tables} onAgain={() => go({ ...screen, n: Date.now() })} onTest={() => go({ name: 'test', tables: screen.tables })} />
    case 'test':
      return <Test key={screen.n ?? 0} {...common} tables={screen.tables} onAgain={() => go({ ...screen, n: Date.now() })} onTrain={() => go({ name: 'train', tables: screen.tables })} />
    case 'lesson':
      return <LessonScreen table={screen.table} onExit={back} onPractice={() => go({ name: 'train', tables: [screen.table] })} />
    case 'game': {
      const again = () => go({ ...screen, n: Date.now() })
      const k = `${screen.id}-${screen.n ?? 0}`
      if (screen.id === 'eclair' || screen.id === 'survie') return <Speed key={k} {...common} mode={screen.id} onAgain={again} />
      if (screen.id === 'memory') return <Memory key={k} {...common} onAgain={again} />
      if (screen.id === 'bulles') return <Bubbles key={k} {...common} onAgain={again} />
      return <TrueFalse key={k} {...common} onAgain={again} />
    }
    case 'duel':
      return <Duel key={screen.n ?? 0} {...common} a={screen.a} b={screen.b} onAgain={() => go({ ...screen, n: Date.now() })} />
    case 'daily':
      return <Daily {...common} />
    default:
      return <Hub profile={profile} update={update} parent={parent} go={go} tab={tab} setTab={setTab} onSwitch={() => go({ name: 'home' })} sound={parent.sound} toggleSound={toggleSound} />
  }
}
