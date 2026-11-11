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
  /** Offert par l'objectif commun (pas par la maîtrise). */
  bonus?: boolean
  category: 'Sol' | 'Nature' | 'Maisons' | 'Déco' | 'Chats' | 'Blocs'
}

export const ITEMS: Item[] = [
  // Sols
  { id: 'grass', name: 'Herbe', layer: 'ground', coins: 0, cubes: 0, category: 'Sol' },
  { id: 'path', name: 'Chemin', layer: 'ground', coins: 4, cubes: 0, category: 'Sol' },
  { id: 'water', name: 'Eau', layer: 'ground', coins: 6, cubes: 0, category: 'Sol' },
  { id: 'sand', name: 'Sable', layer: 'ground', coins: 4, cubes: 0, category: 'Sol' },
  { id: 'meadow', name: 'Prairie fleurie', layer: 'ground', coins: 8, cubes: 0, category: 'Sol', unlock: 'x5' },
  // Nature
  { id: 'tree', name: 'Arbre', layer: 'object', coins: 12, cubes: 0, category: 'Nature' },
  { id: 'flowers', name: 'Fleurs', layer: 'object', coins: 6, cubes: 0, category: 'Nature' },
  { id: 'bush', name: 'Buisson', layer: 'object', coins: 8, cubes: 0, category: 'Nature' },
  { id: 'mushroom', name: 'Champignon', layer: 'object', coins: 10, cubes: 1, category: 'Nature', unlock: 'x1x10' },
  { id: 'cherry', name: 'Cerisier', layer: 'object', coins: 30, cubes: 3, category: 'Nature', unlock: 'x4' },
  // Maisons
  { id: 'cathouse', name: 'Maison du chat', layer: 'object', coins: 25, cubes: 2, category: 'Chats' },
  { id: 'cushion', name: 'Coussin douillet', layer: 'object', coins: 10, cubes: 0, category: 'Chats' },
  { id: 'cattree', name: 'Arbre à chat', layer: 'object', coins: 30, cubes: 3, category: 'Chats', unlock: 'x3' },
  { id: 'house', name: 'Maison', layer: 'object', coins: 60, cubes: 5, category: 'Maisons', unlock: 'x2' },
  { id: 'market', name: 'Petit marché', layer: 'object', coins: 70, cubes: 6, category: 'Maisons', unlock: 'x6' },
  { id: 'tower', name: 'Tour de l’horloge', layer: 'object', coins: 120, cubes: 10, category: 'Maisons', unlock: 'x7' },
  // Déco
  { id: 'lantern', name: 'Lanterne', layer: 'object', coins: 10, cubes: 0, category: 'Déco' },
  { id: 'fence', name: 'Barrière', layer: 'object', coins: 5, cubes: 0, category: 'Déco' },
  { id: 'bench', name: 'Banc', layer: 'object', coins: 12, cubes: 0, category: 'Déco' },
  { id: 'table', name: 'Table de pique-nique', layer: 'object', coins: 15, cubes: 1, category: 'Déco', unlock: 'x5' },
  { id: 'bridge', name: 'Pont', layer: 'object', coins: 20, cubes: 2, category: 'Déco', onWater: true, unlock: 'x3' },
  { id: 'statue', name: 'Statue dorée', layer: 'object', coins: 0, cubes: 0, category: 'Déco', bonus: true },
  { id: 'crystal', name: 'Fontaine de cristal', layer: 'object', coins: 80, cubes: 8, category: 'Déco', unlock: 'x12' },
  // Blocs
  { id: 'block-pink', name: 'Cube rose', layer: 'object', coins: 0, cubes: 1, category: 'Blocs' },
  { id: 'block-blue', name: 'Cube bleu', layer: 'object', coins: 0, cubes: 1, category: 'Blocs' },
  { id: 'block-mint', name: 'Cube menthe', layer: 'object', coins: 0, cubes: 1, category: 'Blocs' },
  { id: 'block-sun', name: 'Cube soleil', layer: 'object', coins: 0, cubes: 1, category: 'Blocs' },
  { id: 'block-star', name: 'Cube étoilé', layer: 'object', coins: 0, cubes: 3, category: 'Blocs', unlock: 'x4' },
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
  { id: 'bow', name: 'Nœud', unlock: 'x1x10' },
  { id: 'scarf', name: 'Foulard', unlock: 'x2' },
  { id: 'flower', name: 'Fleur', unlock: 'x5' },
  { id: 'glasses', name: 'Lunettes', unlock: 'x3' },
  { id: 'wizard', name: 'Chapeau de magicien', unlock: 'x8' },
  { id: 'crown', name: 'Couronne', unlock: 'x11' },
]

/** Pelage « fantastique » : à débloquer, comme une rareté. */
export const COAT_UNLOCK: Partial<Record<CoatId, SkillId>> = { fantastique: 'x4' }

/** Les îles de l'archipel : 2 chapitres chacune. */
export const ISLANDS: { id: string; name: string; skills: SkillId[]; color: string; emoji: string }[] = [
  { id: 'village', name: 'Village des Chatons', skills: ['x1x10', 'x2'], color: '#9be37c', emoji: '🏡' },
  { id: 'foret', name: 'Forêt des Cinq', skills: ['x5', 'x3'], color: '#6fcf97', emoji: '🌳' },
  { id: 'port', name: 'Port des Doubles', skills: ['x4', 'x9'], color: '#7cc8ff', emoji: '⛵' },
  { id: 'montagne', name: 'Montagne des Six', skills: ['x6', 'x11'], color: '#c3b1ff', emoji: '⛰️' },
  { id: 'chateau', name: 'Château des Sept', skills: ['x7', 'x8'], color: '#ffb3d1', emoji: '🏰' },
  { id: 'etoiles', name: 'Île des Étoiles', skills: ['x12', 'defi'], color: '#ffd76f', emoji: '✨' },
]
