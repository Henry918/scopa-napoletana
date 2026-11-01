import type { RoundInput, Suit } from '../../types/game'

const PRIMIERA_VALUES: Record<number, number> = {
  1: 16, 2: 12, 3: 13, 4: 14, 5: 15, 6: 18, 7: 21, 8: 10, 9: 10, 10: 10
}
export type PrimieraCards = Record<Suit, number | null>

export function getPrimieraCardValue(rank: number): number {
  return PRIMIERA_VALUES[rank] ?? 0
}

export function calculatePrimiera(cards: PrimieraCards): number {
  return (Object.values(cards) as Array<number | null>).reduce<number>(
    (total, rank) => total + (rank === null ? 0 : getPrimieraCardValue(rank)), 0
  )
}

export function getUniqueWinner(values: Record<string, number>): string | null {
  const entries = Object.entries(values)
  if (entries.length === 0) return null
  const highest = Math.max(...entries.map(([, value]) => value))
  const leaders = entries.filter(([, value]) => value === highest)
  return leaders.length === 1 ? leaders[0][0] : null
}

export function validateRound(entries: RoundInput[]): string[] {
  const issues: string[] = []
  const cardsTotal = entries.reduce((sum, entry) => sum + entry.cards, 0)
  const denariTotal = entries.reduce((sum, entry) => sum + entry.denari, 0)
  const settebelloCount = entries.filter((entry) => entry.settebello).length
  if (entries.some((entry) => !Number.isInteger(entry.cards) || entry.cards < 0 || entry.cards > 40)) issues.push('Cards must be whole numbers from 0 to 40.')
  if (entries.some((entry) => !Number.isInteger(entry.denari) || entry.denari < 0 || entry.denari > 10)) issues.push('Denari must be whole numbers from 0 to 10.')
  if (entries.some((entry) => entry.denari > entry.cards)) issues.push('A competitor cannot have more Denari than cards.')
  if (entries.some((entry) => !Number.isInteger(entry.scope) || entry.scope < 0)) issues.push('Scopa counts must be non-negative whole numbers.')
  if (cardsTotal !== 40) issues.push('The cards total must be exactly 40. Current total: ' + cardsTotal + '.')
  if (denariTotal !== 10) issues.push('The Denari total must be exactly 10. Current total: ' + denariTotal + '.')
  if (settebelloCount !== 1) issues.push('The Settebello must belong to exactly one competitor.')
  return issues
}

export function calculateRoundPoints(entries: RoundInput[], primieraWinnerId: string | null): {
  points: Record<string, number>
  breakdown: { cardsWinnerId: string | null; denariWinnerId: string | null; settebelloWinnerId: string | null; primieraWinnerId: string | null }
} {
  const points: Record<string, number> = {}
  for (const entry of entries) points[entry.competitorId] = entry.scope
  const cardsWinnerId = getUniqueWinner(Object.fromEntries(entries.map((entry) => [entry.competitorId, entry.cards])))
  const denariWinnerId = getUniqueWinner(Object.fromEntries(entries.map((entry) => [entry.competitorId, entry.denari])))
  const settebelloWinnerId = entries.find((entry) => entry.settebello)?.competitorId ?? null
  if (cardsWinnerId) points[cardsWinnerId] += 1
  if (denariWinnerId) points[denariWinnerId] += 1
  if (settebelloWinnerId) points[settebelloWinnerId] += 1
  if (primieraWinnerId && points[primieraWinnerId] !== undefined) points[primieraWinnerId] += 1
  return {
    points,
    breakdown: {
      cardsWinnerId, denariWinnerId, settebelloWinnerId,
      primieraWinnerId: primieraWinnerId && points[primieraWinnerId] !== undefined ? primieraWinnerId : null
    }
  }
}

export function getGameWinner(totals: Record<string, number>, targetScore: number): string | null {
  const leaderId = getUniqueWinner(totals)
  if (!leaderId) return null
  return totals[leaderId] >= targetScore ? leaderId : null
}

export function calculateTotals(rounds: Array<{ points: Record<string, number> }>, competitorIds: string[]): Record<string, number> {
  const totals: Record<string, number> = Object.fromEntries(competitorIds.map((id) => [id, 0]))
  for (const round of rounds) {
    for (const id of competitorIds) totals[id] += round.points[id] ?? 0
  }
  return totals
}