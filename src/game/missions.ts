export type SceneKind = 'kitten' | 'tower' | 'train'

export interface MissionDef {
  id: string
  title: string
  emoji: string
  scene: SceneKind
  start: (cat: string) => string
  steps: string[]
  end: (cat: string) => string
}

export const MISSIONS: MissionDef[] = [
  {
    id: 'chaton', title: 'Retrouve Pompon', emoji: '🐾', scene: 'kitten',
    start: (c) => `Pompon, le petit chaton, s’est perdu ! ${c} suit ses traces… chaque bonne réponse nous rapproche.`,
    steps: ['Des traces de pattes !', 'Il est passé par le pont.', 'Un miaulement au loin…', 'On se rapproche !', 'Je vois sa queue !', 'Le voilà !'],
    end: (c) => `Pompon est retrouvé ! ${c} et lui se font un câlin.`,
  },
  {
    id: 'tour', title: 'Répare la tour', emoji: '🗼', scene: 'tower',
    start: (c) => `La tour de l’horloge est cassée. ${c} a besoin de toi pour remettre chaque cube à sa place.`,
    steps: ['Un cube posé !', 'La base tient bon.', 'On monte !', 'Encore un étage.', 'Presque fini…', 'Le toit est posé !'],
    end: (c) => `La tour sonne à nouveau ! ${c} est super fier de toi.`,
  },
  {
    id: 'train', title: 'Fais partir le train', emoji: '🚂', scene: 'train',
    start: (c) => `Le train des chats doit partir à l’heure ! ${c} est le chef de gare aujourd’hui.`,
    steps: ['Les rails sont prêts.', 'Les passagers montent.', 'Tchou tchou !', 'On passe le tunnel.', 'Le pont des nuages !', 'Arrivée en gare !'],
    end: (c) => `Le train est arrivé pile à l’heure. Bravo, ${c} te salue !`,
  },
]

export const CHEERS = ['Bravo !', 'Super !', 'Génial !', 'Trop fort !', 'Parfait !', 'Miaou-gnifique !', 'Exactement !']
export const COMFORT = ['Pas grave, on réessaie !', 'Bien essayé !', 'Tu y es presque !', 'On apprend en se trompant.']
