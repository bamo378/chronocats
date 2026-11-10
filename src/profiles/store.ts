// Profils et sauvegardes. Chaque enfant a sa propre clé : les données ne se mélangent jamais.
// Phase 1 : sauvegarde locale sur l'appareil. Le format est prêt pour une synchro cloud (Supabase) plus tard.

import { LearnerState, newLearner } from '../engine/learner'
import { AccessoryId, CoatId } from '../game/catalog'
import { SKILL_ORDER } from '../engine/skills'

export type ProfileId = 'anaelle' | 'alice'

export interface Placed {
  id: string // identifiant unique
  item: string
  x: number
  y: number
}

export interface CatData {
  name: string
  coat: CoatId
  accessory: AccessoryId
}

export interface Profile {
  version: 1
  id: ProfileId
  name: string
  color: string
  createdAt: number
  setupDone: boolean
  cat: CatData
  coins: number
  cubes: number
  stars: number
  learner: LearnerState
  /** Sol : grille de N×N identifiants d'objets de sol. */
  ground: string[][]
  objects: Placed[]
  badges: string[]
  missionsDone: number
  /** Temps de jeu par jour (AAAA-MM-JJ → ms). */
  playByDay: Record<string, number>
  lastPlayed?: number
}

export const GRID = 10

export const PROFILES: { id: ProfileId; name: string; color: string; coat: CoatId }[] = [
  { id: 'anaelle', name: 'Anaëlle', color: '#b48cff', coat: 'roux' },
  { id: 'alice', name: 'Alice', color: '#ff8fc0', coat: 'gris' },
]

const KEY = (id: ProfileId) => `chronocats.v1.profile.${id}`

function starterGround(): string[][] {
  const g = Array.from({ length: GRID }, () => Array.from({ length: GRID }, () => 'grass'))
  // Un petit chemin et un étang pour démarrer.
  for (let i = 2; i < 8; i++) g[5][i] = 'path'
  g[2][7] = 'water'; g[2][8] = 'water'; g[3][8] = 'water'; g[3][7] = 'water'
  return g
}

function starterObjects(): Placed[] {
  return [
    { id: 'o1', item: 'cathouse', x: 3, y: 3 },
    { id: 'o2', item: 'tree', x: 1, y: 1 },
    { id: 'o3', item: 'tree', x: 8, y: 6 },
    { id: 'o4', item: 'flowers', x: 4, y: 7 },
    { id: 'o5', item: 'lantern', x: 6, y: 4 },
  ]
}

export function newProfile(id: ProfileId): Profile {
  const p = PROFILES.find((x) => x.id === id)!
  return {
    version: 1,
    id,
    name: p.name,
    color: p.color,
    createdAt: Date.now(),
    setupDone: false,
    cat: { name: '', coat: p.coat, accessory: 'none' },
    coins: 60,
    cubes: 4,
    stars: 0,
    learner: newLearner(),
    ground: starterGround(),
    objects: starterObjects(),
    badges: [],
    missionsDone: 0,
    playByDay: {},
  }
}

/** Complète une sauvegarde ancienne avec les nouveaux champs. */
function migrate(p: Profile): Profile {
  const fresh = newProfile(p.id)
  const out = { ...fresh, ...p, learner: { ...fresh.learner, ...p.learner } }
  for (const id of SKILL_ORDER) out.learner.skills[id] = { ...fresh.learner.skills[id], ...(p.learner?.skills?.[id] ?? {}) }
  return out
}

export function loadProfile(id: ProfileId): Profile {
  try {
    const raw = localStorage.getItem(KEY(id))
    if (raw) {
      const p = JSON.parse(raw) as Profile
      if (p && p.id === id) return migrate(p)
    }
  } catch {
    /* stockage indisponible : on repart d'un profil neuf */
  }
  return newProfile(id)
}

export function saveProfile(p: Profile): void {
  try {
    localStorage.setItem(KEY(p.id), JSON.stringify(p))
  } catch {
    /* rien */
  }
}

export function today(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function addPlayTime(p: Profile, ms: number): void {
  const k = today()
  p.playByDay[k] = (p.playByDay[k] ?? 0) + ms
  p.lastPlayed = Date.now()
}

// ---- Réglages parents (partagés, protégés par code) ----

export interface ParentSettings {
  pinHash?: string
  sessionMinutes: number
  sound: boolean
}

const PKEY = 'chronocats.v1.parent'

export function loadParent(): ParentSettings {
  try {
    const raw = localStorage.getItem(PKEY)
    if (raw) return { sessionMinutes: 15, sound: true, ...JSON.parse(raw) }
  } catch { /* rien */ }
  return { sessionMinutes: 15, sound: true }
}

export function saveParent(s: ParentSettings): void {
  try { localStorage.setItem(PKEY, JSON.stringify(s)) } catch { /* rien */ }
}

export async function hashPin(pin: string): Promise<string> {
  const data = new TextEncoder().encode('chronocats:' + pin)
  if (crypto?.subtle) {
    const buf = await crypto.subtle.digest('SHA-256', data)
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
  }
  // Repli (contexte non sécurisé) : hachage simple.
  let h = 0
  for (const b of data) h = (h * 31 + b) | 0
  return 'x' + (h >>> 0).toString(16)
}
