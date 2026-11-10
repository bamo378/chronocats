// Catalogue des objets de construction et des accessoires.
// Les déblocages suivent la maîtrise des chapitres (récompense pédagogique).

import { SkillId } from '../engine/skills'

export type ItemLayer = 'ground' | 'object'

export interface Item {
  id: string
  name: string
  layer: ItemLayer
  coins: number
  cubes: number
  /** Chapitre à maîtriser pour débloquer l'objet. */
  unlock?: SkillId
  /** Objet pouvant être posé sur l'eau (pont). */
  onWater?: boolean
  category: 'Sol' | 'Nature' | 'Maisons' | 'Déco' | 'Chats' | 'Blocs'
}

export const ITEMS: Item[] = [
  // Sols
  { id: 'grass', name: 'Herbe', layer: 'ground', coins: 0, cubes: 0, category: 'Sol' },
  { id: 'path', name: 'Chemin', layer: 'ground', coins: 4, cubes: 0, category: 'Sol' },
  { id: 'water', name: 'Eau', layer: 'ground', coins: 6, cubes: 0, category: 'Sol' },
  { id: 'sand', name: 'Sable', layer: 'ground', coins: 4, cubes: 0, category: 'Sol' },
  { id: 'meadow', name: 'Prairie fleurie', layer: 'ground', coins: 8, cubes: 0, category: 'Sol', unlock: 'minutes' },
  // Nature
  { id: 'tree', name: 'Arbre', layer: 'object', coins: 12, cubes: 0, category: 'Nature' },
  { id: 'flowers', name: 'Fleurs', layer: 'object', coins: 6, cubes: 0, category: 'Nature' },
  { id: 'bush', name: 'Buisson', layer: 'object', coins: 8, cubes: 0, category: 'Nature' },
  { id: 'mushroom', name: 'Champignon', layer: 'object', coins: 10, cubes: 1, category: 'Nature', unlock: 'aiguilles' },
  { id: 'cherry', name: 'Cerisier', layer: 'object', coins: 30, cubes: 3, category: 'Nature', unlock: 'quart' },
  // Maisons
  { id: 'cathouse', name: 'Maison du chat', layer: 'object', coins: 25, cubes: 2, category: 'Chats' },
  { id: 'cushion', name: 'Coussin douillet', layer: 'object', coins: 10, cubes: 0, category: 'Chats' },
  { id: 'cattree', name: 'Arbre à chat', layer: 'object', coins: 30, cubes: 3, category: 'Chats', unlock: 'demi' },
  { id: 'house', name: 'Maison', layer: 'object', coins: 60, cubes: 5, category: 'Maisons', unlock: 'heures' },
  { id: 'market', name: 'Petit marché', layer: 'object', coins: 70, cubes: 6, category: 'Maisons', unlock: 'cinq' },
  { id: 'tower', name: 'Tour de l’horloge', layer: 'object', coins: 120, cubes: 10, category: 'Maisons', unlock: 'moinsquart' },
  // Déco
  { id: 'lantern', name: 'Lanterne', layer: 'object', coins: 10, cubes: 0, category: 'Déco' },
  { id: 'fence', name: 'Barrière', layer: 'object', coins: 5, cubes: 0, category: 'Déco' },
  { id: 'bench', name: 'Banc', layer: 'object', coins: 12, cubes: 0, category: 'Déco' },
  { id: 'table', name: 'Table de pique-nique', layer: 'object', coins: 15, cubes: 1, category: 'Déco', unlock: 'minutes' },
  { id: 'bridge', name: 'Pont', layer: 'object', coins: 20, cubes: 2, category: 'Déco', onWater: true, unlock: 'demi' },
  { id: 'crystal', name: 'Fontaine de cristal', layer: 'object', coins: 80, cubes: 8, category: 'Déco', unlock: 'toutes' },
  // Blocs
  { id: 'block-pink', name: 'Cube rose', layer: 'object', coins: 0, cubes: 1, category: 'Blocs' },
  { id: 'block-blue', name: 'Cube bleu', layer: 'object', coins: 0, cubes: 1, category: 'Blocs' },
  { id: 'block-mint', name: 'Cube menthe', layer: 'object', coins: 0, cubes: 1, category: 'Blocs' },
  { id: 'block-sun', name: 'Cube soleil', layer: 'object', coins: 0, cubes: 1, category: 'Blocs' },
  { id: 'block-star', name: 'Cube étoilé', layer: 'object', coins: 0, cubes: 3, category: 'Blocs', unlock: 'quart' },
]

export const ITEM_BY_ID: Record<string, Item> = Object.fromEntries(ITEMS.map((i) => [i.id, i]))

export type CoatId = 'roux' | 'noir' | 'blanc' | 'tigre' | 'gris' | 'fantastique'

export const COATS: { id: CoatId; name: string }[] = [
  { id: 'roux', name: 'Roux' },
  { id: 'noir', name: 'Noir' },
  { id: 'blanc', name: 'Blanc' },
  { id: 'tigre', name: 'Tigré' },
  { id: 'gris', name: 'Gris' },
  { id: 'fantastique', name: 'Fantastique' },
]

export type AccessoryId = 'none' | 'bow' | 'scarf' | 'flower' | 'glasses' | 'wizard' | 'crown' | 'bell'

export const ACCESSORIES: { id: AccessoryId; name: string; unlock?: SkillId }[] = [
  { id: 'none', name: 'Rien' },
  { id: 'bell', name: 'Clochette' },
  { id: 'bow', name: 'Nœud', unlock: 'aiguilles' },
  { id: 'scarf', name: 'Foulard', unlock: 'heures' },
  { id: 'flower', name: 'Fleur', unlock: 'minutes' },
  { id: 'glasses', name: 'Lunettes', unlock: 'demi' },
  { id: 'wizard', name: 'Chapeau du temps', unlock: 'moinsquart' },
  { id: 'crown', name: 'Couronne', unlock: 'toutes' },
]

/** Pelage « fantastique » : à débloquer, comme une rareté. */
export const COAT_UNLOCK: Partial<Record<CoatId, SkillId>> = { fantastique: 'quart' }

/** Les îles de l'archipel : 2 chapitres chacune. */
export const ISLANDS: { id: string; name: string; skills: SkillId[]; color: string; emoji: string }[] = [
  { id: 'village', name: 'Village des Chatons', skills: ['aiguilles', 'heures'], color: '#9be37c', emoji: '🏡' },
  { id: 'foret', name: 'Forêt des Horloges', skills: ['minutes', 'demi'], color: '#6fcf97', emoji: '🌳' },
  { id: 'port', name: 'Port des Minutes', skills: ['quart', 'moinsquart'], color: '#7cc8ff', emoji: '⛵' },
  { id: 'montagne', name: 'Montagne des Cadrans', skills: ['cinq', 'toutes'], color: '#c3b1ff', emoji: '⛰️' },
  { id: 'chateau', name: 'Château du Temps', skills: ['moins', 'regler'], color: '#ffb3d1', emoji: '🏰' },
  { id: 'etoiles', name: 'Île des Étoiles', skills: ['quotidien', 'defi'], color: '#ffd76f', emoji: '✨' },
]
