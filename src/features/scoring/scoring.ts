import type { RoundBreakdown, RoundInput, Suit } from '../../types/game'

const PRIMIERA_VALUES: Record<number, number> = {
  1: 16, 2: 12, 3: 13, 4: 14, 5: 15, 6: 18, 7: 21, 8: 10, 9: 10, 10: 10
}
export type PrimieraCards = Record<Suit, number | null>

export interface RoundWinnerSelections {
  cardsWinnerId: string | null | undefined
  denariWinnerId: string | null | undefined
  settebelloWinnerId: string | null | undefined
  primieraWinnerId: string | null | undefined
}

export type ConfirmedRoundWinners = RoundBreakdown

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

export function validateRound(
  entries: RoundInput[],
  selections: RoundWinnerSelections,
  competitorIds: string[]
): string[] {
  const issues: string[] = []
  const validIds = new Set(competitorIds)

  if (entries.length !== competitorIds.length ||
    new Set(entries.map((entry) => entry.competitorId)).size !== entries.length ||
    entries.some((entry) => !validIds.has(entry.competitorId))) {
    issues.push('Every player or team must be included exactly once.')
  }
  if (entries.some((entry) => !Number.isInteger(entry.scope) || entry.scope < 0)) {
    issues.push('Scopa counts must be non-negative whole numbers.')
  }

  const requiredChoices: Array<[string, string | null | undefined]> = [
    ['Cards Taken', selections.cardsWinnerId],
    ['Denari', selections.denariWinnerId],
    ['Primiera', selections.primieraWinnerId]
  ]
  for (const [label, value] of requiredChoices) {
    if (value === undefined) issues.push('Select a result for ' + label + '.')
    else if (value !== null && !validIds.has(value)) issues.push('Select a valid player or team for ' + label + '.')
  }

  if (selections.settebelloWinnerId === undefined || selections.settebelloWinnerId === null) {
    issues.push('Select who has the Settebello.')
  } else if (!validIds.has(selections.settebelloWinnerId)) {
    issues.push('Select a valid player or team for Settebello.')
  }

  return issues
}

export function calculateRoundPoints(
  entries: RoundInput[],
  winners: ConfirmedRoundWinners
): {
  points: Record<string, number>
  breakdown: RoundBreakdown
} {
  const points: Record<string, number> = {}
  for (const entry of entries) points[entry.competitorId] = entry.scope

  const award = (competitorId: string | null) => {
    if (competitorId && points[competitorId] !== undefined) points[competitorId] += 1
  }

  award(winners.cardsWinnerId)
  award(winners.denariWinnerId)
  award(winners.settebelloWinnerId)
  award(winners.primieraWinnerId)

  return {
    points,
    breakdown: {
      cardsWinnerId: winners.cardsWinnerId,
      denariWinnerId: winners.denariWinnerId,
      settebelloWinnerId: winners.settebelloWinnerId,
      primieraWinnerId: winners.primieraWinnerId
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
