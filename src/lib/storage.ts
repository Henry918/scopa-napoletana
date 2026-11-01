import type { GameSession } from '../types/game'
const STORAGE_KEY = 'scopa-napoletana:game:v1'

export function loadGame(): GameSession | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null
    const candidate = parsed as Partial<GameSession>
    if (candidate.schemaVersion !== 1 || typeof candidate.id !== 'string' ||
      !Array.isArray(candidate.competitors) || !Array.isArray(candidate.rounds) ||
      !['playing', 'finished'].includes(String(candidate.status))) return null
    return candidate as GameSession
  } catch {
    return null
  }
}

export function saveGame(game: GameSession | null): void {
  try {
    if (game) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(game))
    else window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Keep the in-memory game usable if browser storage is unavailable.
  }
}