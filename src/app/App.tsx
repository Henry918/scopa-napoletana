import { useEffect, useMemo, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import type { Competitor, GameMode, GameSession, RoundInput, RoundResult, Suit } from '../types/game'
import {
  calculatePrimiera, calculateRoundPoints, calculateTotals, getGameWinner,
  validateRound, type PrimieraCards
} from '../features/scoring/scoring'
import { loadGame, saveGame } from '../lib/storage'

type SetupDraft = {
  mode: GameMode
  targetScore: string
  playerNames: string[]
  teamNames: string[]
}

const SUITS: Array<{ id: Suit; label: string }> = [
  { id: 'coppe', label: 'Coppe' },
  { id: 'denari', label: 'Denari' },
  { id: 'spade', label: 'Spade' },
  { id: 'bastoni', label: 'Bastoni' }
]
const RANK_LABELS: Record<number, string> = {
  1: 'Ace', 2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7',
  8: 'Jack', 9: 'Knight', 10: 'King'
}
const EMPTY_PRIMIERA: PrimieraCards = { coppe: null, denari: null, spade: null, bastoni: null }
const BASE = import.meta.env.BASE_URL

function makeDefaultDraft(): SetupDraft {
  return {
    mode: 'two-players',
    targetScore: '11',
    playerNames: ['Player 1', 'Player 2', 'Player 3', 'Player 4'],
    teamNames: ['Team A', 'Team B']
  }
}

function createCompetitors(draft: SetupDraft): Competitor[] {
  if (draft.mode === 'four-player-teams') {
    return [
      { id: 'team-a', name: draft.teamNames[0].trim() || 'Team A', members: draft.playerNames.slice(0, 2).map((name) => name.trim()) },
      { id: 'team-b', name: draft.teamNames[1].trim() || 'Team B', members: draft.playerNames.slice(2, 4).map((name) => name.trim()) }
    ]
  }
  const count = draft.mode === 'two-players' ? 2 : 3
  return draft.playerNames.slice(0, count).map((name, index) => ({
    id: 'player-' + (index + 1),
    name: name.trim() || 'Player ' + (index + 1),
    members: [name.trim() || 'Player ' + (index + 1)]
  }))
}

function emptyEntries(competitors: Competitor[]): RoundInput[] {
  return competitors.map((competitor) => ({
    competitorId: competitor.id, cards: 0, denari: 0, settebello: false, scope: 0
  }))
}

function newId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

function roundTotals(rounds: RoundResult[], competitors: Competitor[]) {
  return calculateTotals(rounds, competitors.map((competitor) => competitor.id))
}

function App() {
  const [game, setGame] = useState<GameSession | null>(() => loadGame())
  const [draft, setDraft] = useState<SetupDraft>(() => makeDefaultDraft())
  const [entries, setEntries] = useState<RoundInput[]>(() => game ? emptyEntries(game.competitors) : [])
  const [primieraWinnerId, setPrimieraWinnerId] = useState<string | null>(null)
  const [primieraCards, setPrimieraCards] = useState<Record<string, PrimieraCards>>({})
  const [primieraOpen, setPrimieraOpen] = useState(false)
  const [roundOpen, setRoundOpen] = useState(false)
  const [roundReviewOpen, setRoundReviewOpen] = useState(false)
  const [notice, setNotice] = useState('')

  useEffect(() => { saveGame(game) }, [game])

  const totals = useMemo(
    () => game ? roundTotals(game.rounds, game.competitors) : {},
    [game]
  )
  const issues = useMemo(() => validateRound(entries), [entries])
  const cardsTotal = entries.reduce((sum, entry) => sum + entry.cards, 0)
  const denariTotal = entries.reduce((sum, entry) => sum + entry.denari, 0)
  const winnerId = game ? getGameWinner(totals, game.targetScore) : null
  const roundPreview = calculateRoundPoints(entries, primieraWinnerId)

  function startGame(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const targetScore = Number(draft.targetScore)
    if (!Number.isInteger(targetScore) || targetScore < 1 || targetScore > 999) {
      setNotice('Enter a target score from 1 to 999.')
      return
    }
    const competitors = createCompetitors(draft)
    const nextGame: GameSession = {
      schemaVersion: 1, id: newId(), mode: draft.mode, targetScore, competitors,
      rounds: [], status: 'playing', createdAt: new Date().toISOString()
    }
    setGame(nextGame)
    setEntries(emptyEntries(competitors))
    setRoundOpen(false)
    setNotice('')
  }

  function updateEntry(
    competitorId: string,
    field: keyof Omit<RoundInput, 'competitorId'>,
    value: number | boolean
  ) {
    setEntries((current) => current.map((entry) =>
      entry.competitorId === competitorId ? { ...entry, [field]: value } : entry
    ))
  }

  function openRound() {
    if (!game) return
    setEntries(emptyEntries(game.competitors))
    setPrimieraWinnerId(null)
    setPrimieraCards(Object.fromEntries(game.competitors.map((competitor) => [
      competitor.id, { ...EMPTY_PRIMIERA }
    ])))
    setRoundOpen(true)
    setNotice('')
  }

  function applyPrimieraComparison() {
    if (!game) return
    const scores = Object.fromEntries(game.competitors.map((competitor) => [
      competitor.id, calculatePrimiera(primieraCards[competitor.id] ?? EMPTY_PRIMIERA)
    ]))
    const highScore = Math.max(...Object.values(scores))
    const leaders = Object.entries(scores).filter(([, score]) => score === highScore)
    setPrimieraWinnerId(leaders.length === 1 ? leaders[0][0] : null)
    setPrimieraOpen(false)
  }

  function updatePrimieraCard(competitorId: string, suit: Suit, value: string) {
    const rank = value === '' ? null : Number(value)
    setPrimieraCards((current) => ({
      ...current,
      [competitorId]: { ...(current[competitorId] ?? EMPTY_PRIMIERA), [suit]: rank }
    }))
  }

  function reviewRound() {
    if (!game) return
    if (issues.length > 0) {
      setNotice('Please fix the round totals before reviewing.')
      return
    }
    setRoundReviewOpen(true)
  }

  function confirmRound() {
    if (!game) return
    const result = calculateRoundPoints(entries, primieraWinnerId)
    const round: RoundResult = {
      id: newId(), playedAt: new Date().toISOString(),
      entries: entries.map((entry) => ({ ...entry })),
      primieraWinnerId, points: result.points, breakdown: result.breakdown
    }
    const rounds = [...game.rounds, round]
    const nextWinner = getGameWinner(roundTotals(rounds, game.competitors), game.targetScore)
    setGame({ ...game, rounds, status: nextWinner ? 'finished' : 'playing' })
    setRoundOpen(false)
    setRoundReviewOpen(false)
    setPrimieraOpen(false)
    setNotice('Round saved.')
  }

  function undoLastRound() {
    if (!game || game.rounds.length === 0) return
    if (!window.confirm('Remove the most recent round and recalculate the score?')) return
    setGame({ ...game, rounds: game.rounds.slice(0, -1), status: 'playing' })
    setRoundOpen(false)
    setNotice('Last round removed.')
  }

  function startNewGame() {
    if (!window.confirm('Start a new game? The current game will be replaced on this device.')) return
    setGame(null)
    setEntries([])
    setRoundOpen(false)
    setDraft(makeDefaultDraft())
    setNotice('')
  }

  function exportGame() {
    if (!game) return
    const blob = new Blob([JSON.stringify(game, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'scopa-game-' + game.id + '.json'
    anchor.click()
    URL.revokeObjectURL(url)
  }

  if (!game) {
    return (
      <main className="page-shell">
        <BrandHeader />
        <section className="setup-layout">
          <div className="intro-copy">
            <p className="eyebrow">THE TABLESIDE SCOREKEEPER</p>
            <h1>Keep your game<br /><em>in good hands.</em></h1>
            <p className="intro-description">A calm, simple way to track a real game of Scopa Napoletana. Keep playing with your physical cards. We’ll take care of the score.</p>
            <div className="feature-line"><span className="feature-dot" /> Works offline after the first visit</div>
            <div className="feature-line"><span className="feature-dot" /> Your scores stay on this device</div>
          </div>

          <form className="panel setup-panel" onSubmit={startGame}>
            <div className="panel-heading">
              <div><p className="eyebrow">NEW GAME</p><h2>Set up your table</h2></div>
              <span className="round-mark">♠</span>
            </div>
            <fieldset className="mode-fieldset">
              <legend>Choose your game</legend>
              <div className="mode-grid">
                <ModeButton active={draft.mode === 'two-players'} onClick={() => setDraft({ ...draft, mode: 'two-players' })} title="2 players" detail="1 vs 1" />
                <ModeButton active={draft.mode === 'three-players'} onClick={() => setDraft({ ...draft, mode: 'three-players' })} title="3 players" detail="Free for all" />
                <ModeButton active={draft.mode === 'four-player-teams'} onClick={() => setDraft({ ...draft, mode: 'four-player-teams' })} title="4 players" detail="2 teams" />
              </div>
            </fieldset>

            {draft.mode === 'four-player-teams' ? (
              <div className="team-setup-grid">
                <div className="team-setup-card">
                  <label className="field-label" htmlFor="team-a-name">Team A name</label>
                  <input id="team-a-name" value={draft.teamNames[0]} onChange={(event) => setDraft({ ...draft, teamNames: [event.target.value, draft.teamNames[1]] })} />
                  <label className="field-label" htmlFor="player-1">Player 1</label>
                  <input id="player-1" value={draft.playerNames[0]} onChange={(event) => setDraft({ ...draft, playerNames: draft.playerNames.map((name, index) => index === 0 ? event.target.value : name) })} />
                  <label className="field-label" htmlFor="player-2">Player 2</label>
                  <input id="player-2" value={draft.playerNames[1]} onChange={(event) => setDraft({ ...draft, playerNames: draft.playerNames.map((name, index) => index === 1 ? event.target.value : name) })} />
                </div>
                <div className="team-setup-card team-b">
                  <label className="field-label" htmlFor="team-b-name">Team B name</label>
                  <input id="team-b-name" value={draft.teamNames[1]} onChange={(event) => setDraft({ ...draft, teamNames: [draft.teamNames[0], event.target.value] })} />
                  <label className="field-label" htmlFor="player-3">Player 3</label>
                  <input id="player-3" value={draft.playerNames[2]} onChange={(event) => setDraft({ ...draft, playerNames: draft.playerNames.map((name, index) => index === 2 ? event.target.value : name) })} />
                  <label className="field-label" htmlFor="player-4">Player 4</label>
                  <input id="player-4" value={draft.playerNames[3]} onChange={(event) => setDraft({ ...draft, playerNames: draft.playerNames.map((name, index) => index === 3 ? event.target.value : name) })} />
                </div>
              </div>
            ) : (
              <div className="players-setup">
                <div className="section-label">PLAYER NAMES</div>
                {draft.playerNames.slice(0, draft.mode === 'two-players' ? 2 : 3).map((name, index) => (
                  <label className="name-field" key={index}>
                    <span className="player-index">{String(index + 1).padStart(2, '0')}</span>
                    <input aria-label={'Player ' + (index + 1) + ' name'} value={name} onChange={(event) => setDraft({ ...draft, playerNames: draft.playerNames.map((current, nameIndex) => nameIndex === index ? event.target.value : current) })} />
                  </label>
                ))}
              </div>
            )}

            <div className="target-row">
              <div><label className="field-label" htmlFor="target-score">Play to</label><p className="field-hint">Default target is 11 points</p></div>
              <div className="target-input-wrap">
                <input id="target-score" type="number" min="1" max="999" value={draft.targetScore} onChange={(event) => setDraft({ ...draft, targetScore: event.target.value })} />
                <span>POINTS</span>
              </div>
            </div>
            {notice && <p className="notice error-notice" role="alert">{notice}</p>}
            <button className="button button-primary button-full" type="submit">Start game <span aria-hidden="true">→</span></button>
            <p className="privacy-note"><span aria-hidden="true">●</span> No account. No ads. Just your game.</p>
          </form>
        </section>
        <AppFooter />
      </main>
    )
  }

  const scoreRows = game.competitors.map((competitor) => ({ competitor, score: totals[competitor.id] ?? 0 }))

  return (
    <main className="page-shell game-shell">
      <BrandHeader gameMode={game.mode} />
      <section className="game-topline">
        <div>
          <p className="eyebrow">{winnerId ? 'GAME COMPLETE' : 'CURRENT GAME'}</p>
          <h1>{winnerId ? 'A fine game.' : 'The score at the table.'}</h1>
          <p className="subtle-copy">First to {game.targetScore} points · {game.rounds.length} {game.rounds.length === 1 ? 'round' : 'rounds'} played</p>
        </div>
        <div className="topline-actions">
          <button className="button button-quiet" onClick={exportGame} type="button">Export game ↓</button>
          <button className="button button-quiet" onClick={startNewGame} type="button">New game +</button>
        </div>
      </section>

      {winnerId && (
        <section className="winner-banner">
          <div className="winner-star">✦</div>
          <div><p className="eyebrow">WINNER</p><h2>{game.competitors.find((competitor) => competitor.id === winnerId)?.name}</h2><p>Reached {totals[winnerId]} points. Grazie for a great game.</p></div>
        </section>
      )}

      <section className="score-grid" aria-label="Current scores">
        {scoreRows.map(({ competitor, score }, index) => (
          <article className={'score-card score-card-' + (index + 1)} key={competitor.id}>
            <div className="score-card-top"><span className="score-index">{game.mode === 'four-player-teams' ? 'TEAM ' + (index + 1) : 'PLAYER ' + (index + 1)}</span><span className="score-dot" /></div>
            <h2>{competitor.name}</h2>
            {competitor.members.length > 1 && <p className="member-names">{competitor.members.join(' + ')}</p>}
            <div className="score-number">{score}<span> pts</span></div>
            <div className="score-progress"><span style={{ width: Math.min(100, (score / game.targetScore) * 100) + '%' }} /></div>
            <p className="score-target">{Math.max(0, game.targetScore - score)} to go</p>
          </article>
        ))}
      </section>

      {!roundOpen && !winnerId && (
        <section className="action-strip">
          <div><p className="eyebrow">AFTER THE HAND</p><h2>Ready to count?</h2><p>Enter the cards and points for everyone on one page.</p></div>
          <button className="button button-primary" onClick={openRound} type="button">Enter round <span aria-hidden="true">→</span></button>
        </section>
      )}

      {roundOpen && (
        <section className="panel round-panel">
          <div className="panel-heading round-heading">
            <div><p className="eyebrow">ROUND {game.rounds.length + 1}</p><h2>Enter the hand result</h2><p className="field-hint">Count the physical cards on the table, then enter each player’s share.</p></div>
            <button className="icon-button" type="button" onClick={() => setRoundOpen(false)} aria-label="Close round entry">×</button>
          </div>

          <div className="totals-ribbon">
            <div className={cardsTotal === 40 ? 'total-check valid' : 'total-check'}><span>CARTE</span><strong>{cardsTotal}<small> / 40</small></strong></div>
            <div className={denariTotal === 10 ? 'total-check valid' : 'total-check'}><span>DENARI</span><strong>{denariTotal}<small> / 10</small></strong></div>
            <div className="total-note">All cards from this hand must be assigned.</div>
          </div>

          <div className="entry-grid">
            {game.competitors.map((competitor, index) => {
              const entry = entries.find((item) => item.competitorId === competitor.id) ?? emptyEntries([competitor])[0]
              return (
                <article className="entry-card" key={competitor.id}>
                  <div className="entry-card-heading"><span className="entry-number">{String(index + 1).padStart(2, '0')}</span><div><h3>{competitor.name}</h3>{competitor.members.length > 1 && <p>{competitor.members.join(' + ')}</p>}</div></div>
                  <div className="entry-input-grid">
                    <NumberField label="Cards taken" value={entry.cards} min={0} max={40} onChange={(value) => updateEntry(competitor.id, 'cards', value)} />
                    <NumberField label="Denari" value={entry.denari} min={0} max={10} onChange={(value) => updateEntry(competitor.id, 'denari', value)} />
                  </div>
                  <label className="check-row">
                    <input type="checkbox" checked={entry.settebello} onChange={(event) => updateEntry(competitor.id, 'settebello', event.target.checked)} />
                    <span className="custom-check" />
                    <span><strong>Settebello</strong><small>Seven of Denari</small></span>
                  </label>
                  <div className="scope-row"><div><strong>Scopa</strong><small>Number of sweeps</small></div><div className="stepper"><button type="button" aria-label={'Remove Scopa for ' + competitor.name} onClick={() => updateEntry(competitor.id, 'scope', Math.max(0, entry.scope - 1))}>−</button><output>{entry.scope}</output><button type="button" aria-label={'Add Scopa for ' + competitor.name} onClick={() => updateEntry(competitor.id, 'scope', entry.scope + 1)}>+</button></div></div>
                </article>
              )
            })}
          </div>

          <div className="primiera-panel">
            <div className="primiera-copy"><p className="eyebrow">PRIMIERA</p><h3>Who won Primiera?</h3><p>Choose the winner directly. Use the comparison only when you need to check the cards.</p></div>
            <div className="primiera-controls">
              <div className="winner-pills">
                {game.competitors.map((competitor) => <button key={competitor.id} type="button" className={primieraWinnerId === competitor.id ? 'winner-pill selected' : 'winner-pill'} onClick={() => setPrimieraWinnerId(competitor.id)}>{competitor.name}</button>)}
                <button type="button" className={primieraWinnerId === null ? 'winner-pill selected neutral-pill' : 'winner-pill neutral-pill'} onClick={() => setPrimieraWinnerId(null)}>No point</button>
              </div>
              <button className="text-button" type="button" onClick={() => {
                setPrimieraCards(Object.fromEntries(game.competitors.map((competitor) => [competitor.id, { ...(primieraCards[competitor.id] ?? EMPTY_PRIMIERA) }])))
                setPrimieraOpen(true)
              }}>Compare Primiera <span aria-hidden="true">↗</span></button>
            </div>
          </div>

          {issues.length > 0 && <div className="validation-box" role="status"><strong>Check the round totals</strong><ul>{issues.map((issue) => <li key={issue}>{issue}</li>)}</ul></div>}
          {notice && <p className="notice">{notice}</p>}
          <div className="round-actions"><button className="button button-quiet" type="button" onClick={() => setRoundOpen(false)}>Cancel</button><button className="button button-primary" type="button" disabled={issues.length > 0} onClick={reviewRound}>Review round <span aria-hidden="true">→</span></button></div>
        </section>
      )}

      {game.rounds.length > 0 && (
        <section className="history-section">
          <div className="history-heading"><div><p className="eyebrow">GAME RECORD</p><h2>Round history</h2></div><button className="text-button" type="button" onClick={undoLastRound}>Undo last round</button></div>
          <div className="history-list">
            {[...game.rounds].reverse().map((round, index) => (
              <article className="history-row" key={round.id}>
                <div className="history-round">R{game.rounds.length - index}</div>
                <div className="history-details"><strong>{new Date(round.playedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</strong><span>{round.breakdown.cardsWinnerId ? 'Carte' : 'Carte tied'} · {round.breakdown.denariWinnerId ? 'Denari' : 'Denari tied'} · {round.breakdown.primieraWinnerId ? 'Primiera' : 'No Primiera point'}</span></div>
                <div className="history-scores">{game.competitors.map((competitor) => <span key={competitor.id}><b>{round.points[competitor.id] ?? 0}</b><small>{competitor.name}</small></span>)}</div>
              </article>
            ))}
          </div>
        </section>
      )}
      {notice && !roundOpen && <p className="notice success-notice">{notice}</p>}
      <AppFooter />
      {primieraOpen && <PrimieraModal competitors={game.competitors} cards={primieraCards} onChange={updatePrimieraCard} onClose={() => setPrimieraOpen(false)} onApply={applyPrimieraComparison} />}

      {roundReviewOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setRoundReviewOpen(false) }}>
          <section className="primiera-modal review-modal" role="dialog" aria-modal="true" aria-labelledby="round-review-title">
            <div className="modal-heading"><div><p className="eyebrow">ROUND SUMMARY</p><h2 id="round-review-title">Review the points</h2><p>Check the category results before saving this hand.</p></div><button className="icon-button" type="button" onClick={() => setRoundReviewOpen(false)} aria-label="Close round review">×</button></div>
            <div className="review-categories">
              {[
                { label: 'Carte', id: roundPreview.breakdown.cardsWinnerId },
                { label: 'Denari', id: roundPreview.breakdown.denariWinnerId },
                { label: 'Settebello', id: roundPreview.breakdown.settebelloWinnerId },
                { label: 'Primiera', id: roundPreview.breakdown.primieraWinnerId }
              ].map((category) => <div className="review-category" key={category.label}><span>{category.label}</span><strong>{category.id ? game.competitors.find((competitor) => competitor.id === category.id)?.name : 'No point'}</strong></div>)}
            </div>
            <div className="review-points-heading"><span>POINTS ADDED THIS ROUND</span><span>SCOPA INCLUDED</span></div>
            <div className="review-point-list">{game.competitors.map((competitor) => <div className="review-point-row" key={competitor.id}><span>{competitor.name}</span><strong>+{roundPreview.points[competitor.id] ?? 0}</strong></div>)}</div>
            <div className="modal-actions"><button className="button button-quiet" type="button" onClick={() => setRoundReviewOpen(false)}>Back to entry</button><button className="button button-primary" type="button" onClick={confirmRound}>Confirm round</button></div>
          </section>
        </div>
      )}
    </main>
  )
}

function BrandHeader({ gameMode }: { gameMode?: GameMode }) {
  return (
    <header className="brand-header">
      <div className="brand-lockup"><span className="brand-symbol">S</span><div><strong>SCOPA</strong><span>NAPOLETANA</span></div></div>
      <div className="header-right"><span className="offline-indicator"><i /> LOCAL SCOREKEEPER</span>{gameMode && <span className="header-mode">{gameMode === 'two-players' ? '2 PLAYERS' : gameMode === 'three-players' ? '3 PLAYERS' : '2 TEAMS'}</span>}</div>
    </header>
  )
}

function ModeButton({ active, onClick, title, detail }: { active: boolean; onClick: () => void; title: string; detail: string }) {
  return <button className={active ? 'mode-button active' : 'mode-button'} type="button" onClick={onClick}><strong>{title}</strong><span>{detail}</span></button>
}

function NumberField({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (value: number) => void }) {
  return (
    <label className="number-field"><span>{label}</span>
      <input type="number" inputMode="numeric" min={min} max={max} value={value}
        onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value === '' ? 0 : Number(event.target.value))} />
    </label>
  )
}

function PrimieraModal({ competitors, cards, onChange, onClose, onApply }: {
  competitors: Competitor[]
  cards: Record<string, PrimieraCards>
  onChange: (competitorId: string, suit: Suit, value: string) => void
  onClose: () => void
  onApply: () => void
}) {
  const scoreById = Object.fromEntries(competitors.map((competitor) => [
    competitor.id, calculatePrimiera(cards[competitor.id] ?? EMPTY_PRIMIERA)
  ]))
  const scores = Object.values(scoreById)
  const highScore = Math.max(...scores)
  const leaders = competitors.filter((competitor) => scoreById[competitor.id] === highScore)
  const hasTied = leaders.length > 1

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className="primiera-modal" role="dialog" aria-modal="true" aria-labelledby="primiera-title">
        <div className="modal-heading"><div><p className="eyebrow">OPTIONAL CARD CHECK</p><h2 id="primiera-title">Compare Primiera</h2><p>Select the highest card held in each suit.</p></div><button className="icon-button" type="button" onClick={onClose} aria-label="Close Primiera comparison">×</button></div>
        <div className="primiera-competitor-grid">
          {competitors.map((competitor) => {
            const selectedCards = cards[competitor.id] ?? EMPTY_PRIMIERA
            return (
              <article className="primiera-competitor" key={competitor.id}>
                <h3>{competitor.name}</h3>
                <div className="suit-select-list">
                  {SUITS.map((suit) => {
                    const rank = selectedCards[suit.id]
                    return (
                      <div className="suit-select-row" key={suit.id}>
                        <span>{suit.label}</span>
                        <select aria-label={competitor.name + ' highest ' + suit.label} value={rank ?? ''} onChange={(event) => onChange(competitor.id, suit.id, event.target.value)}>
                          <option value="">Not held</option>
                          {Array.from({ length: 10 }, (_, index) => index + 1).map((value) => <option value={value} key={value}>{RANK_LABELS[value]}</option>)}
                        </select>
                        {rank !== null && rank !== undefined ? <img className="primiera-card-thumb" src={BASE + 'cards/' + suit.id + '/' + rank + '.jpg'} alt={suit.label + ' ' + RANK_LABELS[rank]} /> : <span className="card-placeholder" />}
                      </div>
                    )
                  })}
                </div>
                <div className="primiera-score"><span>PRIMIERA TOTAL</span><strong>{scoreById[competitor.id]}</strong></div>
              </article>
            )
          })}
        </div>
        <div className={hasTied ? 'primiera-result tied' : 'primiera-result'}>
          {hasTied ? 'Current comparison is tied. No Primiera point will be awarded.' : 'Current leader: ' + leaders[0].name + ' (' + highScore + ' points).'}
        </div>
        <div className="modal-actions"><button className="button button-quiet" type="button" onClick={onClose}>Cancel</button><button className="button button-primary" type="button" onClick={onApply}>Use comparison</button></div>
        <p className="modal-footnote">Values: 7 = 21 · 6 = 18 · Ace = 16 · 5 = 15 · 4 = 14 · 3 = 13 · 2 = 12 · face cards = 10.</p>
      </section>
    </div>
  )
}

function AppFooter() {
  return <footer className="app-footer"><span>SCOPA NAPOLETANA SCOREKEEPER</span><span>Made for the table, not the screen.</span></footer>
}

export default App