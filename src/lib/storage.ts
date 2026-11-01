import type { GameSession, RoundInput, RoundResult } from '../types/game'

const STORAGE_KEY = 'scopa-napoletana:game:v1'
const GAMES_KEY = 'scopa-napoletana:games:v1'

function localDateFrom(value: string | undefined): string {
  if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  const date = value ? new Date(value) : new Date()
  if (Number.isNaN(date.getTime())) return new Date().toISOString().slice(0, 10)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return year + '-' + month + '-' + day
}

function normalizeGame(value: unknown): GameSession | null {
  if (!value || typeof value !== 'object') return null
  const candidate = value as Partial<GameSession> & { rounds?: Array<Record<string, unknown>> }
  if (candidate.schemaVersion !== 1 || typeof candidate.id !== 'string' ||
    !Array.isArray(candidate.competitors) || !Array.isArray(candidate.rounds) ||
    !['playing', 'finished'].includes(String(candidate.status))) return null

  const competitors = candidate.competitors.filter((item) =>
    item && typeof item.id === 'string' && typeof item.name === 'string' && Array.isArray(item.members)
  )
  if (competitors.length !== candidate.competitors.length || competitors.length < 2) return null

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
    createdAt: typeof candidate.createdAt === 'string' ? candidate.createdAt : new Date().toISOString(),
    rounds
  } as GameSession
}

function readStoredGames(): GameSession[] {
  try {
    const raw = window.localStorage.getItem(GAMES_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.map(normalizeGame).filter((game): game is GameSession => game !== null)
  } catch {
    return []
  }
}

export function loadGames(): GameSession[] {
  const games = readStoredGames()
  const active = loadGame()
  const all = active ? [...games.filter((game) => game.id !== active.id), active] : games
  return all.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
}

export function loadGame(): GameSession | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return normalizeGame(JSON.parse(raw))
  } catch {
    return null
  }
}

export function saveGame(game: GameSession | null): void {
  try {
    const games = loadGames()
    if (game) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(game))
      const next = [...games.filter((item) => item.id !== game.id), game]
      window.localStorage.setItem(GAMES_KEY, JSON.stringify(next))
    } else {
      window.localStorage.setItem(GAMES_KEY, JSON.stringify(games))
      window.localStorage.removeItem(STORAGE_KEY)
    }
  } catch {
    // Keep the in-memory game usable if browser storage is unavailable.
  }
}
