import { useState } from 'react'
import { Cat } from '../components/Cat'
import { COATS, CoatId, COAT_UNLOCK } from '../game/catalog'
import { Profile } from '../profiles/store'
import { UpdateProfile } from '../App'
import { sfx } from '../audio/sound'

const IDEAS = ['Moustache', 'Caramel', 'Tic-Tac', 'Nuage', 'Biscuit', 'Pixel', 'Câline', 'Minuit']

export function Setup({ profile, update, onDone, onBack }: { profile: Profile; update: UpdateProfile; onDone: () => void; onBack: () => void }) {
  const [coat, setCoat] = useState<CoatId>(profile.cat.coat)
  const [name, setName] = useState(profile.cat.name)
  const ok = name.trim().length >= 2

  return (
    <div className="screen setup">
      <div className="sky" />
      <button className="btn btn-ghost back" onClick={onBack}>← Retour</button>
      <div className="panel setup-panel">
        <h1>Bonjour {profile.name} !</h1>
        <p className="lead">Voici ton chat compagnon. Choisis son pelage et donne-lui un nom.</p>
        <div className="setup-main">
          <div className="setup-cat">
            <Cat coat={coat} mood="happy" size="100%" />
            <div className="name-tag">{name || '…'}</div>
          </div>
          <div className="setup-form">
            <div className="coats">
              {COATS.map((c) => {
                const locked = !!COAT_UNLOCK[c.id]
                return (
                  <button key={c.id} className={`coat ${coat === c.id ? 'on' : ''}`} disabled={locked} onClick={() => { sfx.tap(); setCoat(c.id) }}>
                    <Cat coat={c.id} size={64} />
                    <span>{locked ? '🔒 ' : ''}{c.name}</span>
                  </button>
                )
              })}
            </div>
            <label className="field">
              <span>Son nom</span>
              <input value={name} maxLength={14} onChange={(e) => setName(e.target.value)} placeholder="Écris un nom" />
            </label>
            <div className="ideas">
              {IDEAS.map((i) => (
                <button key={i} className="chip" onClick={() => setName(i)}>{i}</button>
              ))}
            </div>
            <button
              className="btn btn-primary big"
              disabled={!ok}
              onClick={() => {
                sfx.meow()
                update((p) => { p.cat.coat = coat; p.cat.name = name.trim(); p.setupDone = true })
                onDone()
              }}
            >
              C’est parti !
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
