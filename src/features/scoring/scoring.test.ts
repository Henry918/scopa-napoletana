import { describe, expect, it } from 'vitest'
import { calculatePrimiera, calculateRoundPoints, getGameWinner, getPrimieraCardValue, getUniqueWinner, validateRound } from './scoring'
import type { RoundInput, Suit } from '../../types/game'
import type { RoundWinnerSelections } from './scoring'

const suits: Suit[] = ['coppe', 'denari', 'spade', 'bastoni']
const competitorIds = ['a', 'b']

function makeRound(): RoundInput[] {
  return [
    { competitorId: 'a', scope: 1 },
    { competitorId: 'b', scope: 0 }
  ]
}

function makeSelections(): RoundWinnerSelections {
  return {
    cardsWinnerId: 'a',
    denariWinnerId: 'a',
    settebelloWinnerId: 'a',
    primieraWinnerId: 'b'
  }
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
  it('accepts a fully selected round', () => {
    expect(validateRound(makeRound(), makeSelections(), competitorIds)).toEqual([])
  })

  it('requires a result for Carte, Denari and Primiera', () => {
    const selections = makeSelections()
    selections.cardsWinnerId = undefined
    selections.denariWinnerId = undefined
    selections.primieraWinnerId = undefined
    const issues = validateRound(makeRound(), selections, competitorIds)
    expect(issues).toContain('Select a result for Carte.')
    expect(issues).toContain('Select a result for Denari.')
    expect(issues).toContain('Select a result for Primiera.')
  })

  it('requires exactly one Settebello owner', () => {
    const selections = makeSelections()
    selections.settebelloWinnerId = null
    expect(validateRound(makeRound(), selections, competitorIds)).toContain('Select who has the Settebello.')
  })

  it('allows ties for Cards Taken, Denari and Primiera', () => {
    const selections = makeSelections()
    selections.cardsWinnerId = null
    selections.denariWinnerId = null
    selections.primieraWinnerId = null
    expect(validateRound(makeRound(), selections, competitorIds)).toEqual([])
  })

  it('rejects a selected competitor that is not in the game', () => {
    const selections = makeSelections()
    selections.cardsWinnerId = 'unknown'
    expect(validateRound(makeRound(), selections, competitorIds)).toContain('Select a valid player or team for Carte.')
  })

  it('requires one Scopa count per competitor', () => {
    const entries = makeRound()
    entries[0].scope = -1
    expect(validateRound(entries, makeSelections(), competitorIds)).toContain('Scopa counts must be non-negative whole numbers.')
  })
})

describe('round scoring', () => {
  it('awards selected category points and each Scopa', () => {
    const result = calculateRoundPoints(makeRound(), {
      cardsWinnerId: 'a',
      denariWinnerId: 'a',
      settebelloWinnerId: 'a',
      primieraWinnerId: 'b'
    })
    expect(result.points).toEqual({ a: 4, b: 1 })
    expect(result.breakdown.cardsWinnerId).toBe('a')
    expect(result.breakdown.denariWinnerId).toBe('a')
    expect(result.breakdown.settebelloWinnerId).toBe('a')
    expect(result.breakdown.primieraWinnerId).toBe('b')
  })

  it('awards no points for tied categories', () => {
    const result = calculateRoundPoints(makeRound(), {
      cardsWinnerId: null,
      denariWinnerId: null,
      settebelloWinnerId: 'a',
      primieraWinnerId: null
    })
    expect(result.points).toEqual({ a: 2, b: 0 })
  })

  it('continues after a tied target score', () => {
    expect(getGameWinner({ a: 11, b: 11 }, 11)).toBeNull()
    expect(getGameWinner({ a: 12, b: 10 }, 11)).toBe('a')
  })

  it('does not select a shared high value', () => {
    expect(getUniqueWinner({ a: 3, b: 3, c: 1 })).toBeNull()
  })
})
