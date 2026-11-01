import { useEffect, useMemo, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import type { Competitor, GameMode, GameSession, RoundInput, RoundResult, Suit } from '../types/game'
import {
  calculatePrimiera, calculateRoundPoints, calculateTotals, getGameWinner, getPrimieraCardValue,
  validateRound, type ConfirmedRoundWinners, type PrimieraCards, type RoundWinnerSelections
} from '../features/scoring/scoring'
import { deleteSavedGame, loadGame, loadGames, saveGame } from '../lib/storage'

type SetupDraft = {
  gameName: string
  mode: GameMode
  targetScore: string
  playerNames: string[]
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

function todayForInput(): string {
  const now = new Date()
  return now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0')
}

function formatGameDate(value: string): string {
  const date = new Date(value + 'T12:00:00')
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })
}

function makeDefaultDraft(): SetupDraft {
  return {
    gameName: '',
    mode: 'two-players',
    targetScore: '11',
    playerNames: ['', '', '', '']
  }
}

function createCompetitors(draft: SetupDraft): Competitor[] {
  if (draft.mode === 'four-player-teams') {
    return [
      { id: 'team-a', name: 'Team 1', members: draft.playerNames.slice(0, 2).map((name, index) => name.trim() || 'Player ' + (index + 1)) },
      { id: 'team-b', name: 'Team 2', members: draft.playerNames.slice(2, 4).map((name, index) => name.trim() || 'Player ' + (index + 3)) }
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
  return competitors.map((competitor) => ({ competitorId: competitor.id, scope: 0 }))
}

function newId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

function roundTotals(rounds: RoundResult[], competitors: Competitor[]) {
  return calculateTotals(rounds, competitors.map((competitor) => competitor.id))
}

function competitorTone(index: number): string {
  return 'competitor-tone-' + (index % 3 + 1)
}

function competitorDisplayName(competitor: Competitor, mode: GameMode): string {
  return mode === 'four-player-teams' && competitor.members.length > 1
    ? competitor.members.join(' + ')
    : competitor.name
}

function App() {
  const [game, setGame] = useState<GameSession | null>(() => loadGame())
  const [savedGames, setSavedGames] = useState<GameSession[]>(() => loadGames())
  const [manageSavedGames, setManageSavedGames] = useState(false)
  const [draft, setDraft] = useState<SetupDraft>(() => makeDefaultDraft())
  const [entries, setEntries] = useState<RoundInput[]>(() => game ? emptyEntries(game.competitors) : [])
  const [cardsWinnerId, setCardsWinnerId] = useState<string | null | undefined>(undefined)
  const [denariWinnerId, setDenariWinnerId] = useState<string | null | undefined>(undefined)
  const [settebelloWinnerId, setSettebelloWinnerId] = useState<string | null | undefined>(undefined)
  const [primieraWinnerId, setPrimieraWinnerId] = useState<string | null | undefined>(undefined)
  const [primieraCards, setPrimieraCards] = useState<Record<string, PrimieraCards>>({})
  const [primieraOpen, setPrimieraOpen] = useState(false)
  const [roundOpen, setRoundOpen] = useState(false)
  const [roundReviewOpen, setRoundReviewOpen] = useState(false)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    saveGame(game)
    setSavedGames(loadGames())
  }, [game])

  const totals = useMemo(
    () => game ? roundTotals(game.rounds, game.competitors) : {},
    [game]
  )
  const selections: RoundWinnerSelections = { cardsWinnerId, denariWinnerId, settebelloWinnerId, primieraWinnerId }
  const competitorIds = game?.competitors.map((competitor) => competitor.id) ?? []
  const issues = useMemo(() => game ? validateRound(entries, selections, competitorIds) : [], [game, entries, cardsWinnerId, denariWinnerId, settebelloWinnerId, primieraWinnerId])
  const winnerId = game ? getGameWinner(totals, game.targetScore) : null
  const roundPreview = calculateRoundPoints(entries, {
    cardsWinnerId: cardsWinnerId ?? null,
    denariWinnerId: denariWinnerId ?? null,
    settebelloWinnerId: settebelloWinnerId ?? null,
    primieraWinnerId: primieraWinnerId ?? null
  })

  function startGame(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const targetScore = Number(draft.targetScore)
    if (!Number.isInteger(targetScore) || targetScore < 1 || targetScore > 999) {
      setNotice('Enter a target score from 1 to 999.')
      return
    }
    const competitors = createCompetitors(draft)
    const nextGame: GameSession = {
      schemaVersion: 1, id: newId(), name: draft.gameName.trim() || 'Scopa Game',
      date: todayForInput(), mode: draft.mode, targetScore, competitors,
      rounds: [], status: 'playing', createdAt: new Date().toISOString()
    }
    setGame(nextGame)
    setEntries(emptyEntries(competitors))
    setRoundOpen(false)
    setNotice('')
  }

  function updateScope(competitorId: string, value: number) {
    setEntries((current) => current.map((entry) =>
      entry.competitorId === competitorId ? { ...entry, scope: value } : entry
    ))
  }

  function openRound() {
    if (!game) return
    setEntries(emptyEntries(game.competitors))
    setCardsWinnerId(undefined)
    setDenariWinnerId(undefined)
    setSettebelloWinnerId(undefined)
    setPrimieraWinnerId(undefined)
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
    setPrimieraCards((current) => {
      const next = { ...current }
      if (rank !== null) {
        for (const otherId of Object.keys(next)) {
          if (otherId !== competitorId && next[otherId]?.[suit] === rank) {
            next[otherId] = { ...(next[otherId] ?? EMPTY_PRIMIERA), [suit]: null }
          }
        }
      }
      next[competitorId] = { ...(next[competitorId] ?? EMPTY_PRIMIERA), [suit]: rank }
      return next
    })
  }

  function reviewRound() {
    if (!game) return
    if (issues.length > 0) {
      setNotice('Please select a result for every category before reviewing.')
      return
    }
    setRoundReviewOpen(true)
  }

  function confirmRound() {
    if (!game) return
    const winners: ConfirmedRoundWinners = {
      cardsWinnerId: cardsWinnerId ?? null,
      denariWinnerId: denariWinnerId ?? null,
      settebelloWinnerId: settebelloWinnerId ?? null,
      primieraWinnerId: primieraWinnerId ?? null
    }
    const result = calculateRoundPoints(entries, winners)
    const round: RoundResult = {
      id: newId(), playedAt: new Date().toISOString(),
      entries: entries.map((entry) => ({ ...entry })),
      primieraWinnerId: winners.primieraWinnerId, points: result.points, breakdown: result.breakdown
    }
    const rounds = [...game.rounds, round]
    const nextWinner = getGameWinner(roundTotals(rounds, game.competitors), game.targetScore)
    setGame({ ...game, rounds, status: nextWinner ? 'finished' : 'playing' })
    setRoundOpen(false)
    setRoundReviewOpen(false)
    setPrimieraOpen(false)
    setNotice('')
  }

  function undoLastRound() {
    if (!game || game.rounds.length === 0) return
    if (!window.confirm('Remove the most recent round and recalculate the score?')) return
    const rounds = game.rounds.slice(0, -1)
    const nextWinner = getGameWinner(roundTotals(rounds, game.competitors), game.targetScore)
    setGame({ ...game, rounds, status: nextWinner ? 'finished' : 'playing' })
    setRoundOpen(false)
    setNotice('')
  }

  function deleteArchivedGame(gameId: string) {
    const savedGame = savedGames.find((item) => item.id === gameId)
    if (!savedGame) return
    if (!window.confirm('Delete "' + savedGame.name + '" permanently from this device?')) return
    deleteSavedGame(gameId)
    const remaining = loadGames()
    setSavedGames(remaining)
    if (remaining.length === 0) setManageSavedGames(false)
  }

  function goHome() {
    if (game) saveGame(game)
    setGame(null)
    setEntries([])
    setRoundOpen(false)
    setRoundReviewOpen(false)
    setPrimieraOpen(false)
    setDraft(makeDefaultDraft())
    setNotice('')
    setSavedGames(loadGames())
    setManageSavedGames(false)
  }

  function openSavedGame(savedGame: GameSession) {
    setGame(savedGame)
    setManageSavedGames(false)
    setEntries(emptyEntries(savedGame.competitors))
    setRoundOpen(false)
    setRoundReviewOpen(false)
    setPrimieraOpen(false)
    setNotice('')
  }

  function startNewGame() {
    if (!window.confirm('Return to the start screen? This game will be saved and can be reopened later.')) return
    goHome()
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
            <div className="game-meta-setup">
              <input aria-label="Game name" value={draft.gameName} onChange={(event) => setDraft({ ...draft, gameName: event.target.value })} placeholder="Scopa Game" />
            </div>
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

            <div className="setup-player-stage">
            {draft.mode === 'four-player-teams' ? (
              <div className="team-setup-grid">
                {[0, 1].map((teamIndex) => (
                  <div className={'team-setup-card team-card-' + (teamIndex + 1)} key={teamIndex}>
                    <p className="team-setup-title">Team {teamIndex + 1}</p>
                    {[teamIndex * 2, teamIndex * 2 + 1].map((playerIndex) => (
                      <label className="team-player-field" key={playerIndex}>
                        <span>Player {playerIndex + 1}</span>
                        <input id={'player-' + (playerIndex + 1)} placeholder={'Player ' + (playerIndex + 1)} value={draft.playerNames[playerIndex]} onChange={(event) => setDraft({ ...draft, playerNames: draft.playerNames.map((name, index) => index === playerIndex ? event.target.value : name) })} />
                      </label>
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <div className="players-setup">
                <div className="section-label">PLAYER NAMES</div>
                {draft.playerNames.slice(0, draft.mode === 'two-players' ? 2 : 3).map((name, index) => (
                  <label className="name-field" key={index}>
                    <span className="player-index">{String(index + 1).padStart(2, '0')}</span>
                    <input aria-label={'Player ' + (index + 1) + ' name'} placeholder={'Player ' + (index + 1)} value={name} onChange={(event) => setDraft({ ...draft, playerNames: draft.playerNames.map((current, nameIndex) => nameIndex === index ? event.target.value : current) })} />
                  </label>
                ))}
              </div>
            )}
            </div>

            <div className="target-row">
              <div><label className="field-label" htmlFor="target-score">Play to</label><p className="field-hint">Default target is 11 points</p></div>
              <div className="target-input-wrap">
                <input id="target-score" type="number" min="1" max="999" value={draft.targetScore} onChange={(event) => setDraft({ ...draft, targetScore: event.target.value })} />
                <span>POINTS</span>
              </div>
            </div>
            {notice && <p className="notice error-notice" role="alert">{notice}</p>}
            <button className="button button-primary button-full" type="submit">Start game <span aria-hidden="true">→</span></button>
            <p className="privacy-note"><span aria-hidden="true">●</span> No account. Just your game.</p>
          </form>
        </section>
        {savedGames.length > 0 && (
          <section className="saved-games-section">
            <div className="saved-games-heading">
              <h2>Previous games</h2>
              <button className="saved-games-manage" type="button" onClick={() => setManageSavedGames((current) => !current)}>
                {manageSavedGames ? 'Done' : 'Manage games'}
              </button>
            </div>
            <div className={'saved-games-list' + (manageSavedGames ? ' managing-saved-games' : '')}>
              {savedGames.map((savedGame) => {
                const savedTotals = roundTotals(savedGame.rounds, savedGame.competitors)
                const result = savedGame.competitors.map((competitor) => competitorDisplayName(competitor, savedGame.mode) + ' ' + (savedTotals[competitor.id] ?? 0)).join(' · ')
                return (
                  <article className="saved-game-card" key={savedGame.id}>
                    <button className="saved-game-open" type="button" disabled={manageSavedGames} onClick={() => openSavedGame(savedGame)}>
                      <span className="saved-game-main"><strong>{savedGame.name}</strong><small>{formatGameDate(savedGame.date)} · {savedGame.rounds.length} {savedGame.rounds.length === 1 ? 'round' : 'rounds'}</small><small className="saved-game-result">{result}</small></span>
                      {!manageSavedGames && <span className="saved-game-arrow" aria-hidden="true">→</span>}
                    </button>
                    {manageSavedGames && (
                      <button className="saved-game-remove" type="button" aria-label={'Delete ' + savedGame.name}
                        title="Delete game" onClick={() => deleteArchivedGame(savedGame.id)}>×</button>
                    )}
                  </article>
                )
              })}
            </div>
          </section>
        )}
      </main>
    )
  }

  const displayCompetitors = game.competitors.map((competitor) => ({ ...competitor, name: competitorDisplayName(competitor, game.mode) }))
  const scoreRows = game.competitors.map((competitor) => ({ competitor, score: totals[competitor.id] ?? 0 }))

  return (
    <main className="page-shell game-shell">
      <BrandHeader gameMode={game.mode} onHome={goHome} />
      <section className="game-topline">
        <div className="game-heading">
          <h1>{game.name}</h1>
        </div>
      </section>

      {winnerId && (
        <section className="winner-banner">
          <div className="winner-star">✦</div>
          <div><p className="eyebrow">WINNER</p><h2>{game.competitors.find((competitor) => competitor.id === winnerId) ? competitorDisplayName(game.competitors.find((competitor) => competitor.id === winnerId)!, game.mode) : ''}</h2><p>Reached {totals[winnerId]} points. Thanks for a great game.</p></div>
        </section>
      )}

      <section className={'score-grid' + (game.competitors.length === 3 ? ' score-grid-three' : '')} aria-label="Current scores">
        {scoreRows.map(({ competitor, score }, index) => (
          <article className={'score-card score-card-' + (index + 1) + ' ' + competitorTone(index)} key={competitor.id}>
            <div className="score-card-top"><span className="score-index">{game.mode === 'four-player-teams' ? 'TEAM ' + (index + 1) : 'PLAYER ' + (index + 1)}</span><span className="score-dot" /></div>
            <h2>{game.mode === 'four-player-teams' && competitor.members.length > 1
              ? competitor.members.map((member) => <span className="score-team-member" key={member}>{member}</span>)
              : competitorDisplayName(competitor, game.mode)}</h2>
            <div className="score-number">{score}<span> pts</span></div>
            <div className="score-progress"><span style={{ width: Math.min(100, (score / game.targetScore) * 100) + '%' }} /></div>
            <p className="score-target">{Math.max(0, game.targetScore - score)} to go</p>
          </article>
        ))}
      </section>

      {!roundOpen && !winnerId && (
        <div className="round-launch">
          <button className="button button-primary" onClick={openRound} type="button">Enter round <span aria-hidden="true">→</span></button>
        </div>
      )}

      {roundOpen && (
        <section className="panel round-panel">
          <div className="panel-heading round-heading">
            <div><h2>Round {game.rounds.length + 1}</h2></div>
            <button className="icon-button" type="button" onClick={() => setRoundOpen(false)} aria-label="Close round entry">×</button>
          </div>

          <div className="round-category-list">
            <div className="winner-category-grid">
              <WinnerSection title="Carte" competitors={displayCompetitors} value={cardsWinnerId} onChange={setCardsWinnerId} allowTie tieLabel="Tie" />
              <WinnerSection title="Denari" competitors={displayCompetitors} value={denariWinnerId} onChange={setDenariWinnerId} allowTie tieLabel="Tie" />
              <WinnerSection title="Settebello" competitors={displayCompetitors} value={settebelloWinnerId} onChange={setSettebelloWinnerId} />
              <WinnerSection title="Primiera" competitors={displayCompetitors} value={primieraWinnerId} onChange={setPrimieraWinnerId} allowTie={!primieraOpen} tieLabel="Tie">
                {!primieraOpen ? (
                  <button className="text-button" type="button" onClick={() => {
                    setPrimieraCards(Object.fromEntries(game.competitors.map((competitor) => [competitor.id, { ...(primieraCards[competitor.id] ?? EMPTY_PRIMIERA) }])))
                    setPrimieraOpen(true)
                  }}>Compare</button>
                ) : null}
                {primieraOpen && (
                  <PrimieraModal competitors={displayCompetitors} cards={primieraCards} onChange={updatePrimieraCard}
                    onApply={applyPrimieraComparison} />
                )}
              </WinnerSection>
            </div>
            <section className="round-category scopa-category">
              <div className="round-category-heading"><h3>Scopa</h3></div>
              <div className="scopa-options">
                {game.competitors.map((competitor) => {
                  const count = entries.find((entry) => entry.competitorId === competitor.id)?.scope ?? 0
                  return (
                    <div className="scopa-option" key={competitor.id}>
                      <span>{competitorDisplayName(competitor, game.mode)}</span>
                      <div className="stepper">
                        <button type="button" aria-label={"Remove Scopa for " + competitor.name} onClick={() => updateScope(competitor.id, Math.max(0, count - 1))}>−</button>
                        <output>{count}</output>
                        <button type="button" aria-label={"Add Scopa for " + competitor.name} onClick={() => updateScope(competitor.id, count + 1)}>+</button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          </div>

          {issues.length > 0 && <div className="validation-box" role="status"><ul>{issues.map((issue) => <li key={issue}>{issue}</li>)}</ul></div>}
          {notice && <p className="notice">{notice}</p>}
          <div className="round-actions">
            <button className="button button-quiet" type="button" onClick={() => setRoundOpen(false)}>Cancel</button>
            <button className="button button-primary" type="button" disabled={issues.length > 0} onClick={reviewRound}>Review round <span aria-hidden="true">→</span></button>
          </div>
        </section>
      )}

      {game.rounds.length > 0 && (
        <section className="history-section">
          <div className="history-heading"><div><p className="eyebrow">GAME RECORD</p><h2>Round history</h2></div><button className="text-button" type="button" onClick={undoLastRound}>Undo last round</button></div>
          <div className="history-list">
            {[...game.rounds].reverse().map((round, index) => (
              <article className="history-row" key={round.id}>
                <div className="history-round">Round {game.rounds.length - index}</div>
                <div className="history-scores">{game.competitors.map((competitor) => <span key={competitor.id}><b>{round.points[competitor.id] ?? 0}</b><small>{competitorDisplayName(competitor, game.mode)}</small></span>)}</div>
              </article>
            ))}
          </div>
        </section>
      )}
      {notice && !roundOpen && <p className="notice success-notice">{notice}</p>}
      <AppFooter onExport={exportGame} onNewGame={startNewGame} />

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
              ].map((category) => {
                const competitor = displayCompetitors.find((item) => item.id === category.id)
                return <div className="review-category" key={category.label}><span>{category.label}</span><strong>{competitor ? competitor.name : 'Tie'}</strong></div>
              })}
            </div>
            <div className="review-points-heading"><span>POINTS ADDED THIS ROUND</span><span>SCOPA INCLUDED</span></div>
            <div className="review-point-list">{displayCompetitors.map((competitor) => {
              const scopaCount = entries.find((entry) => entry.competitorId === competitor.id)?.scope ?? 0
              return <div className="review-point-row" key={competitor.id}><span>{competitor.name}{scopaCount > 0 ? ' (' + scopaCount + ')' : ''}</span><strong>+{roundPreview.points[competitor.id] ?? 0}</strong></div>
            })}</div>
            <div className="modal-actions"><button className="button button-quiet" type="button" onClick={() => setRoundReviewOpen(false)}>Back to entry</button><button className="button button-primary" type="button" onClick={confirmRound}>Confirm round</button></div>
          </section>
        </div>
      )}
    </main>
  )
}

function BrandHeader({ gameMode, onHome }: { gameMode?: GameMode; onHome?: () => void }) {
  return (
    <header className="brand-header">
      <button className="brand-home" type="button" onClick={onHome} disabled={!onHome} aria-label="Back to home">
        <span className="brand-lockup"><span className="brand-symbol">S</span><span className="brand-wordmark"><strong>SCOPA</strong><span>NAPOLETANA</span></span></span>
      </button>
      <div className="header-right"><span className="offline-indicator"><i /> LOCAL SCOREKEEPER</span>{gameMode && <span className="header-mode">{gameMode === 'two-players' ? '2 PLAYERS' : gameMode === 'three-players' ? '3 PLAYERS' : '2 TEAMS'}</span>}</div>
    </header>
  )
}

function ModeButton({ active, onClick, title, detail }: { active: boolean; onClick: () => void; title: string; detail: string }) {
  return <button className={active ? 'mode-button active' : 'mode-button'} type="button" onClick={onClick}><strong>{title}</strong><span>{detail}</span></button>
}

function PrimieraModal({ competitors, cards, onChange, onApply }: {
  competitors: Competitor[]
  cards: Record<string, PrimieraCards>
  onChange: (competitorId: string, suit: Suit, value: string) => void
  onApply: () => void
}) {
  const [activeSlot, setActiveSlot] = useState<{ competitorId: string; suit: Suit } | null>(null)
  const [pickerTop, setPickerTop] = useState(0)
  const primieraOrder = [7, 1, 6, 5, 4, 3, 2, 8, 9, 10]

  return (
    <div className="primiera-inline">
      <div className="primiera-competitor-grid">
        {competitors.map((competitor, competitorIndex) => {
          const selectedCards = cards[competitor.id] ?? EMPTY_PRIMIERA
          return (
            <article className={'primiera-competitor ' + competitorTone(competitorIndex)} key={competitor.id}>
              <h3>{competitor.name}</h3>
              <div className="primiera-card-grid">
                {SUITS.map((suit) => {
                  const rank = selectedCards[suit.id]
                  const isActive = activeSlot?.competitorId === competitor.id && activeSlot.suit === suit.id
                  return (
                    <div className="primiera-card-slot" key={suit.id}>
                                            <button type="button" className={'primiera-card-choice' + (rank === null ? ' unselected' : ' chosen')}
                        aria-label={competitor.name + ' ' + suit.label + ', ' + (rank === null ? 'not selected' : RANK_LABELS[rank])}
                        aria-expanded={isActive}
                        onClick={(event) => {
                          if (isActive) {
                            setActiveSlot(null)
                          } else {
                            setPickerTop(event.currentTarget.getBoundingClientRect().bottom + 6)
                            setActiveSlot({ competitorId: competitor.id, suit: suit.id })
                          }
                        }}
                        onDoubleClick={() => { onChange(competitor.id, suit.id, '7'); setActiveSlot(null) }}>
                        <img src={BASE + 'cards/' + suit.id + '/' + (rank ?? 7) + '.jpg'} alt={rank === null ? 'Unselected 7 of ' + suit.label : RANK_LABELS[rank] + ' of ' + suit.label} />
                      </button>
                      {isActive && (
                        <div className="primiera-card-picker" style={{ top: pickerTop }} aria-label={'Choose ' + suit.label + ' card'}>
                          {primieraOrder.map((optionRank) => (
                            <button type="button" key={optionRank} className={rank === optionRank ? 'active' : ''}
                              onClick={() => { onChange(competitor.id, suit.id, String(optionRank)); setActiveSlot(null) }}>
                              <img src={BASE + 'cards/' + suit.id + '/' + optionRank + '.jpg'} alt="" />
                              <span>{RANK_LABELS[optionRank]}</span>
                              <strong>{getPrimieraCardValue(optionRank)}</strong>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
              <div className="primiera-player-score">
                <strong>Text {calculatePrimiera(selectedCards)}</strong>
              </div>
            </article>
          )
        })}
      </div>
      <button className="button button-primary primiera-compare-action" type="button" onClick={onApply}>Compare</button>
    </div>
  )
}

function WinnerSection({ title, competitors, value, onChange, allowTie = false, tieLabel = 'Tie', children }: {
  title: string
  competitors: Competitor[]
  value: string | null | undefined
  onChange: (value: string | null) => void
  allowTie?: boolean
  tieLabel?: string
  children?: ReactNode
}) {
  return (
    <section className="round-category">
      <div className="round-category-heading">
        <h3>{title}</h3>
        <div className="round-category-tools">
          {children}
          {allowTie && (
            <button type="button" aria-pressed={value === null} aria-label={tieLabel} title={tieLabel}
              className="tie-selector"
              onClick={() => onChange(null)}><span aria-hidden="true" className="tie-symbol">＝</span><span className="sr-only">{tieLabel}</span></button>
          )}
        </div>
      </div>
      <div className={value === null ? 'winner-options tie-selected' : 'winner-options'}>
        {competitors.map((competitor, index) => (
          <button key={competitor.id} type="button" aria-pressed={value === competitor.id}
            className={'winner-option ' + competitorTone(index) + (value === competitor.id ? ' selected' : '')}
            onClick={() => onChange(competitor.id)}>{competitor.name}</button>
        ))}
      </div>
    </section>
  )
}

function AppFooter({ onExport, onNewGame }: { onExport?: () => void; onNewGame?: () => void } = {}) {
  return (
    <footer className="app-footer">
      {onExport && onNewGame && (
        <div className="footer-actions">
          <button type="button" onClick={onExport}>Export game</button>
          <button type="button" onClick={onNewGame}>New game</button>
        </div>
      )}
    </footer>
  )
}

export default App