import { describe, expect, it } from 'vitest'
import { calculatePrimiera, calculateRoundPoints, getGameWinner, getPrimieraCardValue, getUniqueWinner, validateRound } from './scoring'
import type { RoundInput, Suit } from '../../types/game'
const suits: Suit[] = ['coppe', 'denari', 'spade', 'bastoni']

function makeValidRound(): RoundInput[] {
  return [
    { competitorId: 'a', cards: 22, denari: 6, settebello: true, scope: 1 },
    { competitorId: 'b', cards: 18, denari: 4, settebello: false, scope: 0 }
  ]
}

describe('Primiera values', () => {
  it('uses traditional card values', () => {
    expect(getPrimieraCardValue(7)).toBe(21)
    expect(getPrimieraCardValue(6)).toBe(18)
    expect(getPrimieraCardValue(1)).toBe(16)
    expect(getPrimieraCardValue(10)).toBe(10)
  })
  it('adds the four suit values', () => {
    const cards = Object.fromEntries(suits.map((suit, index) => [suit, [7, 6, 1, 5][index]])) as Record<Suit, number>
    expect(calculatePrimiera(cards)).toBe(70)
  })
})

describe('round validation', () => {
  it('accepts 40 cards and 10 Denari', () => expect(validateRound(makeValidRound())).toEqual([]))
  it('rejects incomplete totals', () => {
    const entries = makeValidRound()
    entries[0].cards = 20
    expect(validateRound(entries).some((issue) => issue.includes('exactly 40'))).toBe(true)
  })
  it('requires exactly one Settebello owner', () => {
    const entries = makeValidRound()
    entries[0].settebello = false
    expect(validateRound(entries).some((issue) => issue.includes('exactly one'))).toBe(true)
  })
  it('rejects duplicate Settebello ownership', () => {
    const entries = makeValidRound()
    entries[1].settebello = true
    expect(validateRound(entries).some((issue) => issue.includes('exactly one'))).toBe(true)
  })
})

describe('round scoring', () => {
  it('awards category points and each Scopa', () => {
    const result = calculateRoundPoints(makeValidRound(), 'b')
    expect(result.points).toEqual({ a: 4, b: 1 })
    expect(result.breakdown.cardsWinnerId).toBe('a')
    expect(result.breakdown.denariWinnerId).toBe('a')
    expect(result.breakdown.settebelloWinnerId).toBe('a')
    expect(result.breakdown.primieraWinnerId).toBe('b')
  })
  it('awards no Carte or Denari point for tied categories', () => {
    const entries: RoundInput[] = [
      { competitorId: 'a', cards: 20, denari: 5, settebello: false, scope: 0 },
      { competitorId: 'b', cards: 20, denari: 5, settebello: false, scope: 0 }
    ]
    const result = calculateRoundPoints(entries, null)
    expect(result.points).toEqual({ a: 0, b: 0 })
    expect(result.breakdown.cardsWinnerId).toBeNull()
    expect(result.breakdown.denariWinnerId).toBeNull()
  })
  it('continues after a tied target score', () => {
    expect(getGameWinner({ a: 11, b: 11 }, 11)).toBeNull()
    expect(getGameWinner({ a: 12, b: 10 }, 11)).toBe('a')
  })
  it('does not select a shared high value', () => expect(getUniqueWinner({ a: 3, b: 3, c: 1 })).toBeNull())
})