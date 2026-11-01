import type { GameSession, RoundInput, RoundResult } from '../types/game'

const STORAGE_KEY = 'scopa-napoletana:game:v1'

function localDateFrom(value: string | undefined): string {
  if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  const date = value ? new Date(value) : new Date()
  if (Number.isNaN(date.getTime())) return new Date().toISOString().slice(0, 10)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return year + '-' + month + '-' + day
}

export function loadGame(): GameSession | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null
    const candidate = parsed as Partial<GameSession> & { rounds?: Array<Record<string, unknown>> }
    if (candidate.schemaVersion !== 1 || typeof candidate.id !== 'string' ||
      !Array.isArray(candidate.competitors) || !Array.isArray(candidate.rounds) ||
      !['playing', 'finished'].includes(String(candidate.status))) return null

    const rounds = candidate.rounds.map((rawRound) => {
      const round = rawRound as unknown as RoundResult & { entries?: Array<Record<string, unknown>> }
      const entries: RoundInput[] = (Array.isArray(round.entries) ? round.entries : []).map((entry) => ({
        competitorId: String(entry.competitorId),
        scope: Number.isInteger(entry.scope) && Number(entry.scope) >= 0 ? Number(entry.scope) : 0
      }))
      const breakdown = round.breakdown ?? {
        cardsWinnerId: null,
        denariWinnerId: null,
        settebelloWinnerId: null,
        primieraWinnerId: round.primieraWinnerId ?? null
      }
      return { ...round, entries, breakdown } as RoundResult
    })

    return {
      ...candidate,
      name: typeof candidate.name === 'string' && candidate.name.trim() ? candidate.name : 'Scopa Game',
      date: localDateFrom(candidate.date ?? candidate.createdAt),
      rounds
    } as GameSession
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
