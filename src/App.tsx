import { useCallback, useEffect, useState } from 'react'
import { Profile, ProfileId, loadProfile, saveProfile, loadParent, ParentSettings, saveParent } from './profiles/store'
import { setSound } from './audio/sound'
import { SkillId } from './engine/skills'
import { Home } from './screens/Home'
import { Setup } from './screens/Setup'
import { Diagnostic } from './screens/Diagnostic'
import { Village } from './screens/Village'
import { MissionScreen } from './screens/Mission'
import { MapScreen } from './screens/MapScreen'
import { Parent } from './screens/Parent'
import { MISSIONS } from './game/missions'

export type Screen =
  | { name: 'home' }
  | { name: 'setup' }
  | { name: 'diagnostic' }
  | { name: 'village' }
  | { name: 'mission'; missionId: string; focus?: SkillId }
  | { name: 'map' }
  | { name: 'parent' }

export type UpdateProfile = (fn: (p: Profile) => void) => void

export default function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'home' })
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

  function choose(id: ProfileId) {
    const p = loadProfile(id)
    setProfile(p)
    if (!p.setupDone) setScreen({ name: 'setup' })
    else if (!p.learner.diagnosticDone) setScreen({ name: 'diagnostic' })
    else setScreen({ name: 'village' })
  }

  const go = (s: Screen) => {
    window.scrollTo(0, 0)
    setScreen(s)
  }

  if (screen.name === 'parent') return <Parent settings={parent} updateSettings={updateParent} onExit={() => go({ name: 'home' })} />
  if (screen.name === 'home' || !profile) return <Home onChoose={choose} onParent={() => go({ name: 'parent' })} sound={parent.sound} toggleSound={() => updateParent((s) => { s.sound = !s.sound })} />

  switch (screen.name) {
    case 'setup':
      return <Setup profile={profile} update={update} onDone={() => go({ name: 'diagnostic' })} onBack={() => go({ name: 'home' })} />
    case 'diagnostic':
      return <Diagnostic profile={profile} update={update} onDone={() => go({ name: 'village' })} />
    case 'mission':
      return <MissionScreen key={screen.missionId + (screen.focus ?? '')} profile={profile} update={update} missionId={screen.missionId} focus={screen.focus} onExit={() => go({ name: 'village' })} />
    case 'map':
      return <MapScreen profile={profile} onBack={() => go({ name: 'village' })} onPlay={(skill) => go({ name: 'mission', missionId: MISSIONS[Math.floor(Math.random() * MISSIONS.length)].id, focus: skill })} />
    default:
      return <Village profile={profile} update={update} parent={parent} go={go} />
  }
}
