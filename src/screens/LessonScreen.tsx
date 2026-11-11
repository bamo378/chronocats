import { Lesson } from '../components/Lesson'
import { GameBar } from '../components/ui'
import { skillForTable, SKILL_BY_ID } from '../engine/skills'

/** Revoir un livret en entier, puis s'entraîner dessus. */
export function LessonScreen({ table, onExit, onPractice }: { table: number; onExit: () => void; onPractice: () => void }) {
  const skill = skillForTable(table)
  return (
    <div className="screen lesson-screen">
      <GameBar onExit={onExit}><span className="gb-title">{SKILL_BY_ID[skill].title}</span></GameBar>
      <Lesson skill={skill} onDone={onPractice} startTable={table} cta="S’entraîner sur ce livret" />
    </div>
  )
}
