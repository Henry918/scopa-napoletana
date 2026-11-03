import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import type { Competitor, GameMode, GameSession, RoundInput, RoundResult, Suit } from '../types/game'
import {
  calculatePrimiera, calculateRoundPoints, calculateTotals, getGameWinner, getPrimieraCardValue,
  validateRound, type ConfirmedRoundWinners, type PrimieraCards, type RoundWinnerSelections
} from '../features/scoring/scoring'
import { deleteSavedGame, loadGame, loadGames, saveGame } from '../lib/storage'

type SetupDraft = {
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
  1: 'Asso', 2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7',
  8: 'Fante', 9: 'Cavallo', 10: 'Re'
}
const CARD_ORDER = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
const SCORING_INTRO = 'There are four card-based points in each round, plus one point for every Scopa. On a tie, nobody gets that point.'
type RulesCard = { suit?: Suit; rank?: number; background?: boolean }
const SCORING_EXAMPLES: Array<{ id: string; title: string; description: string; cards: RulesCard[] }> = [
  {
    id: 'carte', title: 'Carte · Most cards',
    description: 'One point goes to the player or team that captured the most cards out of the 40-card deck.',
    cards: [{ suit: 'spade', rank: 5 }, { suit: 'bastoni', rank: 4 }, { suit: 'coppe', rank: 10 }]
  },
  {
    id: 'denari', title: 'Denari · Most coins',
    description: 'One point goes to the player or team that captured the most Denari cards. There are 10 Denari cards in the deck.',
    cards: [{ suit: 'denari', rank: 7 }, { suit: 'denari', rank: 6 }, { suit: 'denari', rank: 3 }]
  },
  {
    id: 'settebello', title: 'Settebello · Seven of coins',
    description: 'One point goes to whoever captured the 7 of Denari.',
    cards: [{ suit: 'denari', rank: 7 }]
  },
  {
    id: 'primiera', title: 'Primiera · Best card combination',
    description: 'For each suit, count only the highest-value card captured. Add the four values together. The highest total earns one point.',
    cards: [{ suit: 'bastoni', rank: 7 }, { suit: 'coppe', rank: 7 }, { suit: 'denari', rank: 7 }, { suit: 'spade', rank: 7 }]
  },
  {
    id: 'scopa', title: 'Scopa · Clear the table',
    description: 'Each time a play captures every card on the table, it is a Scopa and earns one point. The final capture of the round does not count as a Scopa.',
    cards: [{ suit: 'coppe', rank: 6 }, { background: true }]
  }
]
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

function competitorTone(index: number, mode: GameMode): string {
  return mode === 'four-player-teams'
    ? 'team-tone-' + (index + 1)
    : 'competitor-tone-' + (index + 1)
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
  const [homeView, setHomeView] = useState<'new' | 'history' | 'rules'>('new')
  const [renameGameOpen, setRenameGameOpen] = useState(false)
  const [renameGameDraft, setRenameGameDraft] = useState('')
  const renameInputRef = useRef<HTMLInputElement | null>(null)
  const [draft, setDraft] = useState<SetupDraft>(() => makeDefaultDraft())
  const [entries, setEntries] = useState<RoundInput[]>(() => game ? emptyEntries(game.competitors) : [])
  const [cardsWinnerId, setCardsWinnerId] = useState<string | null | undefined>(undefined)
  const [denariWinnerId, setDenariWinnerId] = useState<string | null | undefined>(undefined)
  const [settebelloWinnerId, setSettebelloWinnerId] = useState<string | null | undefined>(undefined)
  const [primieraWinnerId, setPrimieraWinnerId] = useState<string | null | undefined>(undefined)
  const [primieraCards, setPrimieraCards] = useState<Record<string, PrimieraCards>>({})
  const [primieraOpen, setPrimieraOpen] = useState(false)
  const primieraSectionRef = useRef<HTMLElement | null>(null)
  const [roundOpen, setRoundOpen] = useState(false)
  const [scoringHelpOpen, setScoringHelpOpen] = useState(false)
  const [roundReviewOpen, setRoundReviewOpen] = useState(false)
  const [skipRoundReview, setSkipRoundReview] = useState(() => window.localStorage.getItem('scopa-napoletane:skip-round-review') === 'true')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    const root = document.documentElement
    const page = document.querySelector('.page-shell')
    let frame = 0

    const updateScrollLock = () => {
      window.cancelAnimationFrame(frame)
      frame = window.requestAnimationFrame(() => {
        const viewportHeight = window.visualViewport?.height ?? window.innerHeight
        const contentHeight = Math.max(root.scrollHeight, document.body.scrollHeight)
        const isAtTop = window.scrollY <= 1
        root.classList.toggle('viewport-content-fits', contentHeight <= viewportHeight + 1 && isAtTop)
      })
    }

    const resizeObserver = new ResizeObserver(updateScrollLock)
    resizeObserver.observe(root)
    resizeObserver.observe(document.body)
    if (page) resizeObserver.observe(page)

    window.addEventListener('resize', updateScrollLock)
    window.addEventListener('scroll', updateScrollLock, { passive: true })
    window.visualViewport?.addEventListener('resize', updateScrollLock)
    window.visualViewport?.addEventListener('scroll', updateScrollLock)

    updateScrollLock()

    return () => {
      window.cancelAnimationFrame(frame)
      resizeObserver.disconnect()
      window.removeEventListener('resize', updateScrollLock)
      window.removeEventListener('scroll', updateScrollLock)
      window.visualViewport?.removeEventListener('resize', updateScrollLock)
      window.visualViewport?.removeEventListener('scroll', updateScrollLock)
      root.classList.remove('viewport-content-fits')
    }
  }, [])


  useEffect(() => {
    if (!renameGameOpen) return
    renameInputRef.current?.focus()
    renameInputRef.current?.select()
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setRenameGameOpen(false)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [renameGameOpen])

  useEffect(() => {
    if (!primieraOpen || !window.matchMedia('(max-width: 800px)').matches) return

    // Allow the expanded Primiera section to scroll even if the previous view was locked.
    document.documentElement.classList.remove('viewport-content-fits')

    let firstFrame = 0
    let secondFrame = 0
    firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => {
        primieraSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    })

    return () => {
      window.cancelAnimationFrame(firstFrame)
      window.cancelAnimationFrame(secondFrame)
    }
  }, [primieraOpen])

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
    const playerCount = draft.mode === 'four-player-teams' ? 4 : draft.mode === 'two-players' ? 2 : 3
    if (draft.playerNames.slice(0, playerCount).some((name) => !name.trim())) {
      setNotice('Enter a name for every player.')
      return
    }
    const targetScore = Number(draft.targetScore)
    if (!Number.isInteger(targetScore) || targetScore < 1 || targetScore > 999) {
      setNotice('Enter a target score from 1 to 999.')
      return
    }
    const competitors = createCompetitors(draft)
    const nextGame: GameSession = {
      schemaVersion: 1, id: newId(), name: 'Scopa Game',
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
    if (issues.length > 0) return
    if (skipRoundReview) {
      confirmRound()
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
    setHomeView('new')
    if (game) saveGame(game)
    saveGame(null)
    setGame(null)
    setEntries([])
    setCardsWinnerId(undefined)
    setDenariWinnerId(undefined)
    setSettebelloWinnerId(undefined)
    setPrimieraWinnerId(undefined)
    setPrimieraCards({})
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
    if (!game) return
    if (!window.confirm('Save this game and start a new one with the same players and settings?')) return
    saveGame(game)
    saveGame(null)
    const nextGame: GameSession = {
      schemaVersion: 1,
      id: newId(),
      name: game.name,
      date: todayForInput(),
      mode: game.mode,
      targetScore: game.targetScore,
      competitors: game.competitors.map((competitor) => ({ ...competitor, members: [...competitor.members] })),
      rounds: [],
      status: 'playing',
      createdAt: new Date().toISOString()
    }
    setGame(nextGame)
    setEntries(emptyEntries(nextGame.competitors))
    setCardsWinnerId(undefined)
    setDenariWinnerId(undefined)
    setSettebelloWinnerId(undefined)
    setPrimieraWinnerId(undefined)
    setPrimieraCards(Object.fromEntries(nextGame.competitors.map((competitor) => [competitor.id, { ...EMPTY_PRIMIERA }])))
    setRoundOpen(false)
    setRoundReviewOpen(false)
    setPrimieraOpen(false)
    setScoringHelpOpen(false)
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
        <BrandHeader homeView={homeView} manageSavedGames={manageSavedGames}
          onHome={() => { setHomeView('new'); setManageSavedGames(false) }}
          onToggleManageSavedGames={() => setManageSavedGames((current) => !current)}
          onShowHomeView={(view) => { setHomeView(view); setManageSavedGames(false) }} />
        <div className={"home-view-content home-view-content-" + homeView}>
        {homeView === 'new' && <section className="setup-layout">
          <div className="intro-copy">
            <p className="eyebrow">THE TABLESIDE SCOREKEEPER</p>
            <h1>Keep your game<br /><em>in good hands.</em></h1>
            <p className="intro-description">A calm, simple way to track a real game of Scopa Napoletane. Keep playing with your physical cards. We’ll take care of the score.</p>
            <div className="feature-line"><span className="feature-dot" /> Works offline after the first visit</div>
            <div className="feature-line"><span className="feature-dot" /> Your scores stay on this device</div>
          </div>

          <form className="panel setup-panel" onSubmit={startGame}>
            <div className="panel-heading">
              <div><p className="eyebrow">NEW GAME</p><h2>Set up your table</h2></div>
            </div>
            <fieldset className="mode-fieldset">
              <legend>Choose your game</legend>
              <div className="mode-grid">
                <ModeButton active={draft.mode === 'two-players'} onClick={() => setDraft({ ...draft, mode: 'two-players' })} title="2 players" />
                <ModeButton active={draft.mode === 'three-players'} onClick={() => setDraft({ ...draft, mode: 'three-players' })} title="3 players" />
                <ModeButton active={draft.mode === 'four-player-teams'} onClick={() => setDraft({ ...draft, mode: 'four-player-teams' })} title="4 players" />
              </div>
            </fieldset>

            <div className="setup-player-stage">
            {draft.mode === 'four-player-teams' ? (
              <div className="team-setup-grid">
                {[0, 1].map((teamIndex) => (
                  <div className={'team-setup-card team-card-' + (teamIndex + 1)} key={teamIndex}>
                    <div className="section-label team-setup-title">Team {teamIndex + 1}</div>
                    {[teamIndex * 2, teamIndex * 2 + 1].map((playerIndex) => (
                      <label className="name-field team-player-name-field" key={playerIndex}>
                        <span className="player-index">{String(playerIndex + 1).padStart(2, '0')}</span>
                        <input id={'player-' + (playerIndex + 1)} aria-label={'Player ' + (playerIndex + 1) + ' name'} placeholder={'Player ' + (playerIndex + 1)} value={draft.playerNames[playerIndex]} required onChange={(event) => setDraft({ ...draft, playerNames: draft.playerNames.map((name, index) => index === playerIndex ? event.target.value : name) })} />
                      </label>
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <div className={'players-setup' + (draft.mode === 'three-players' ? ' players-setup-three' : '')}>
                <div className="section-label">PLAYER NAMES</div>
                {draft.playerNames.slice(0, draft.mode === 'two-players' ? 2 : 3).map((name, index) => (
                  <label className={'name-field player-name-field-' + (index + 1)} key={index}>
                    <span className="player-index">{String(index + 1).padStart(2, '0')}</span>
                    <input aria-label={'Player ' + (index + 1) + ' name'} placeholder={'Player ' + (index + 1)} value={name} required onChange={(event) => setDraft({ ...draft, playerNames: draft.playerNames.map((current, nameIndex) => nameIndex === index ? event.target.value : current) })} />
                  </label>
                ))}
              </div>
            )}
            </div>

            <div className="target-row">
              <div><label className="field-label" htmlFor="target-score">Target score</label></div>
              <div className="target-input-wrap">
                <input id="target-score" type="number" min="1" max="999" value={draft.targetScore} onChange={(event) => setDraft({ ...draft, targetScore: event.target.value })} />
                <span>POINTS</span>
              </div>
            </div>
            {notice && <p className="notice error-notice" role="alert">{notice}</p>}
            <button className="button button-primary button-full" type="submit">Start game</button>
          </form>
        </section>}
        {homeView === 'rules' && <RulesPage />}
        {homeView === 'history' && (
          <section className="saved-games-section">
            {savedGames.length > 0 ? <div className={'saved-games-list' + (manageSavedGames ? ' managing-saved-games' : '')}>
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
            </div> : <p className="saved-games-empty">No previous games yet. Start a new game to begin your history.</p>}
          </section>
        )}
        </div>
        {homeView === 'new' && (
          <nav className="home-bottom-nav" aria-label="Main navigation">
            <button className="saved-games-manage" type="button" onClick={() => setHomeView('history')}>History</button>
            <button className="saved-games-manage" type="button" onClick={() => setHomeView('rules')}>Rules</button>
          </nav>
        )}
      </main>
    )
  }

  const displayCompetitors = game.competitors.map((competitor) => ({ ...competitor, name: competitorDisplayName(competitor, game.mode) }))
  const scoreRows = game.competitors.map((competitor) => ({ competitor, score: totals[competitor.id] ?? 0 }))

  return (
    <main className={'page-shell game-shell' + (roundOpen ? ' round-entry-active' : '')}>
      <BrandHeader gameMode={game.mode} onHome={goHome} gameName={game.name} gameDate={formatGameDate(game.date)} onRename={() => { setRenameGameDraft(game.name); setRenameGameOpen(true) }} />

      {!roundOpen && (
        <>
      <div className="game-results">
        {winnerId && (
          <section className={'winner-banner ' + competitorTone(game.competitors.findIndex((competitor) => competitor.id === winnerId), game.mode)}>
            <div className="winner-star">✦</div>
            <div><p className="eyebrow">WINNER</p><h2>{game.competitors.find((competitor) => competitor.id === winnerId) ? competitorDisplayName(game.competitors.find((competitor) => competitor.id === winnerId)!, game.mode) : ''}</h2><p>Reached {totals[winnerId]} points. Thanks for a great game.</p></div>
          </section>
        )}

        <section className={'score-grid' + (game.competitors.length === 3 ? ' score-grid-three' : '')} aria-label="Current scores">
        {scoreRows.map(({ competitor, score }, index) => (
          <article className={'score-card score-card-' + (index + 1) + ' ' + competitorTone(index, game.mode)} key={competitor.id}>
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
      </div>

      {!roundOpen && !winnerId && (
        <div className="round-launch">
          <button className="button button-primary" onClick={openRound} type="button">Enter round</button>
        </div>
      )}

        </>
      )}

      {roundOpen && (
        <section className="panel round-panel">
          <div className="panel-heading round-heading">
            <div><h2>Round {game.rounds.length + 1}</h2></div>
            <div className="round-heading-actions">
              <button className="icon-button round-help-trigger" type="button" onClick={() => setScoringHelpOpen(true)} aria-label="How to score points" title="How to score points"><span aria-hidden="true">i</span></button>
              <button className="icon-button round-cancel-trigger" type="button" onClick={() => { setRoundOpen(false); setRoundReviewOpen(false); setPrimieraOpen(false); setScoringHelpOpen(false) }} aria-label="Cancel round entry" title="Cancel round entry"><span aria-hidden="true">×</span></button>
            </div>
          </div>

          <div className="round-category-list">
            <div className="winner-category-grid">
              <WinnerSection title="Carte" mode={game.mode} competitors={displayCompetitors} value={cardsWinnerId} onChange={setCardsWinnerId} allowTie tieLabel="Tie" />
              <WinnerSection title="Denari" mode={game.mode} competitors={displayCompetitors} value={denariWinnerId} onChange={setDenariWinnerId} allowTie tieLabel="Tie" />
              <WinnerSection title="Settebello" mode={game.mode} competitors={displayCompetitors} value={settebelloWinnerId} onChange={setSettebelloWinnerId} />
              <WinnerSection sectionRef={primieraSectionRef} title="Primiera" mode={game.mode} competitors={displayCompetitors} value={primieraWinnerId} onChange={setPrimieraWinnerId}
                allowTie={!primieraOpen} tieLabel="Tie" hideCompetitors={primieraOpen}
                headingAction={!primieraOpen ? (
                  <button className="text-button primiera-heading-compare" type="button" onClick={() => {
                    setPrimieraCards(Object.fromEntries(game.competitors.map((competitor) => [competitor.id, { ...(primieraCards[competitor.id] ?? EMPTY_PRIMIERA) }])))
                    setPrimieraOpen(true)
                  }}>Compare</button>
                ) : null}>
                {primieraOpen && (
                  <PrimieraModal mode={game.mode} competitors={displayCompetitors} cards={primieraCards} onChange={updatePrimieraCard}
                    onApply={applyPrimieraComparison} />
                )}
              </WinnerSection>
            </div>
            <section className="round-category scopa-category">
              <div className="round-category-heading"><h3>Scopa</h3></div>
              <div className={'scopa-options' + (game.mode === 'three-players' ? ' scopa-options-three' : '')}>
                {game.competitors.map((competitor, index) => {
                  const count = entries.find((entry) => entry.competitorId === competitor.id)?.scope ?? 0
                  return (
                    <div className={'scopa-option ' + competitorTone(index, game.mode) + (count > 0 ? ' has-scope' : '')} key={competitor.id}>
                      <span className="scopa-option-name">{competitorDisplayName(competitor, game.mode)}</span>
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

          {notice && <p className="notice">{notice}</p>}
          <div className="round-actions">
            <button className="button button-primary" type="button" disabled={issues.length > 0} onClick={reviewRound}>Confirm round</button>
          </div>
        </section>
      )}

      {!roundOpen && (
        <>
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
      {game.status === 'finished' && <AppFooter onExport={exportGame} onNewGame={startNewGame} />}

      </>
      )}

      {renameGameOpen && game && (
        <div className="modal-backdrop rename-game-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setRenameGameOpen(false) }}>
          <form className="primiera-modal rename-game-modal" role="dialog" aria-modal="true" aria-labelledby="rename-game-title" onSubmit={(event) => {
            event.preventDefault()
            const name = renameGameDraft.trim() || 'Scopa Game'
            setGame((current) => current ? { ...current, name } : current)
            setRenameGameOpen(false)
          }}>
            <div className="modal-heading">
              <div><p className="eyebrow">GAME DETAILS</p><h2 id="rename-game-title">Rename game</h2><p>Give this game a name. You can change it at any time.</p></div>
              <button className="icon-button" type="button" onClick={() => setRenameGameOpen(false)} aria-label="Close rename dialog">×</button>
            </div>
            <label className="rename-game-label" htmlFor="rename-game-input">Game name</label>
            <input ref={renameInputRef} id="rename-game-input" className="rename-game-input" type="text" maxLength={60} value={renameGameDraft} onChange={(event) => setRenameGameDraft(event.target.value)} placeholder="Scopa Game" />
            <div className="modal-actions">
              <button className="button button-quiet" type="button" onClick={() => setRenameGameOpen(false)}>Cancel</button>
              <button className="button button-primary" type="submit">Save</button>
            </div>
          </form>
        </div>
      )}

      {scoringHelpOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setScoringHelpOpen(false) }}>
          <section className="primiera-modal scoring-help-modal" role="dialog" aria-modal="true" aria-labelledby="scoring-help-title">
            <div className="modal-heading">
              <div><p className="eyebrow">SCORING GUIDE</p><h2 id="scoring-help-title">How to score points</h2><p>{SCORING_INTRO}</p></div>
              <button className="icon-button" type="button" onClick={() => setScoringHelpOpen(false)} aria-label="Close scoring guide">×</button>
            </div>
            <ScoringExamplesList className="rules-scoring-list scoring-help-list" />
            <div className="scoring-help-footer"><button className="button button-primary" type="button" onClick={() => setScoringHelpOpen(false)}>Got it</button></div>
          </section>
        </div>
      )}

      {roundReviewOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setRoundReviewOpen(false) }}>
          <section className="primiera-modal review-modal" role="dialog" aria-modal="true" aria-labelledby="round-review-title">
            <div className="modal-heading"><div><p className="eyebrow">ROUND SUMMARY</p><h2 id="round-review-title">Review the points</h2></div><button className="icon-button" type="button" onClick={() => setRoundReviewOpen(false)} aria-label="Close round review">×</button></div>
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
            <div className="modal-actions"><button className="button button-quiet" type="button" onClick={() => {
                window.localStorage.setItem('scopa-napoletane:skip-round-review', 'true')
                setSkipRoundReview(true)
                confirmRound()
              }}>Don't ask again</button><button className="button button-primary" type="button" onClick={confirmRound}>Accept round</button></div>
          </section>
        </div>
      )}
    </main>
  )
}

function BrandHeader({ gameMode, onHome, gameName, gameDate, onRename, homeView, manageSavedGames, onToggleManageSavedGames, onShowHomeView }: { gameMode?: GameMode; onHome?: () => void; gameName?: string; gameDate?: string; onRename?: () => void; homeView?: 'new' | 'history' | 'rules'; manageSavedGames?: boolean; onToggleManageSavedGames?: () => void; onShowHomeView?: (view: 'new' | 'history' | 'rules') => void }) {
  return (
    <header className="brand-header">
      <button className="brand-home" type="button" onClick={onHome} disabled={!onHome} aria-label="Go to new game">
        <span className="brand-lockup"><img className="brand-symbol" src={BASE + 'icons/scopa.svg'} alt="" /><span className="brand-wordmark"><strong>SCOPA</strong><span>NAPOLETANE</span></span></span>
      </button>
      <div className="header-right">
        {onShowHomeView && homeView !== 'new' && <div className="home-header-actions">
          {homeView === 'history' && onToggleManageSavedGames && <button className="saved-games-manage home-manage-toggle" type="button" onClick={onToggleManageSavedGames}>{manageSavedGames ? 'Done' : 'Manage games'}</button>}
          <button className="saved-games-manage home-new-game-button" type="button" onClick={() => onShowHomeView('new')}>New Game</button>
        </div>}
        <span className="offline-indicator"><i /> LOCAL SCOREKEEPER</span>
        {gameMode && <span className="header-mode">{gameMode === 'two-players' ? '2 PLAYERS' : gameMode === 'three-players' ? '3 PLAYERS' : '2 TEAMS'}</span>}
        {gameName && <div className="game-header-meta"><button className="game-name-trigger" type="button" onClick={onRename} aria-label={'Rename game, current name ' + gameName} title="Rename game"><strong>{gameName}</strong></button>{gameDate && <time>{gameDate}</time>}</div>}
      </div>
    </header>
  )
}

function RulesCardStack({ cards, variant }: { cards: RulesCard[]; variant: string }) {
  return (
    <div className={'rules-card-stack rules-card-stack-' + variant} aria-hidden="true">
      {cards.map((card, index) => (
        <img
          key={card.background ? 'background-' + index : card.suit + '-' + card.rank}
          className="rules-card-stack-image"
          src={card.background ? BASE + 'cards/background/background.jpg' : BASE + 'cards/' + card.suit + '/' + card.rank + '.jpg'}
          alt=""
          style={{ zIndex: index + 1 }}
        />
      ))}
    </div>
  )
}

function ScoringExamplesList({ className }: { className: string }) {
  return (
    <div className={className}>
      {SCORING_EXAMPLES.map((example) => (
        <article className="rules-scoring-item" key={example.id}>
          <RulesCardStack cards={example.cards} variant={example.id} />
          <div className="rules-scoring-copy">
            <h3>{example.title}</h3>
            <p>{example.description}</p>
            {example.id === 'primiera' && <>
              <p className="rules-primiera-label">Primiera values</p>
              <p className="rules-primiera-values">7 = 21 · 6 = 18 · Asso = 16 · 5 = 15 · 4 = 14 · 3 = 13 · 2 = 12 · Fante, Cavallo and Re = 10 each.</p>
            </>}
          </div>
        </article>
      ))}
    </div>
  )
}

function RulesPage() {
  const [activeSuit, setActiveSuit] = useState<Suit>('coppe')
  const activeSuitLabel = SUITS.find((suit) => suit.id === activeSuit)?.label ?? 'Coppe'

  return (
    <section className="rules-page" aria-labelledby="rules-page-title">
      <section className="panel setup-panel rules-container rules-nutshell-container" aria-labelledby="rules-page-title">
        <header className="rules-page-heading">
          <p className="eyebrow">THE GAME IN A NUTSHELL</p>
          <h1 id="rules-page-title">How to play Scopa</h1>
        </header>

        <section className="rules-section rules-intro-section" aria-labelledby="rules-setup-title">
          <h2 id="rules-setup-title">Players and setup</h2>
          <p>Scopa is played by 2 to 4 players. With 4 players, form two teams and sit opposite your teammate.</p>
          <p><strong>At the start of each round:</strong></p>
          <ol>
            <li>Choose a dealer.</li>
            <li>The dealer shuffles the deck.</li>
            <li>Deal three cards to each player.</li>
            <li>Place four cards face up on the table.</li>
            <li>Place the remaining cards face down beside the table.</li>
          </ol>
        </section>

        <section className="rules-section rules-playing-section" aria-labelledby="rules-playing-title">
          <h2 id="rules-playing-title">Playing a round</h2>
          <p>The player to the dealer's left starts. Turns continue clockwise.</p>

          <div className="rules-turn-guide">
            <h3 className="rules-turn-guide-title">On your turn, play one card from your hand:</h3>
            <ul className="rules-turn-actions">
              <li><strong>Take a matching card</strong> from the table, if available.</li>
              <li><strong>Or combine cards</strong> whose values add up to the value of your card.</li>
              <li><strong>No match?</strong> Place your card face up on the table.</li>
              <li><strong>Single card takes priority.</strong> If both a single card and a combination are possible, you must take the single card.</li>
            </ul>
          </div>

          <p className="rules-deal-continuation">After everyone has played their three cards, the dealer deals another three to each player. Repeat until all cards have been dealt and played. The same dealer deals throughout the round.</p>

          <section className="rules-subsection" aria-labelledby="rules-scopa-title">
            <h3 id="rules-scopa-title">Scopa</h3>
            <p>Capture every card on the table in a single play to score a Scopa.</p>
            <p>After a Scopa, the next player starts with an empty table by placing one card face up. Play then continues as usual.</p>
            <p><em>The final capture of the round does not count as a Scopa.</em></p>
          </section>

          <section className="rules-subsection" aria-labelledby="rules-end-title">
            <h3 id="rules-end-title">End of the round</h3>
            <p>The round ends when everyone has played all their cards.</p>
            <p>Any cards left on the table go to the player or team who made the last capture.</p>
            <p>Count the points, then the next player clockwise becomes dealer and a new round begins.</p>
          </section>
        </section>
      </section>

      <section className="panel setup-panel rules-container rules-scoring-container" aria-labelledby="rules-scoring-title">
        <section className="rules-section rules-scoring-section">
          <h2 id="rules-scoring-title">Scoring</h2>
          <p className="rules-scoring-intro">{SCORING_INTRO}</p>
          <ScoringExamplesList className="rules-scoring-list" />
        </section>
      </section>

      <section className="panel setup-panel rules-container rules-card-container" aria-labelledby="rules-card-overview-title">
        <section className="rules-section rules-card-overview-section">
          <h2 id="rules-card-overview-title">Card overview</h2>
          <p>The game uses a 40-card Neapolitan deck. Each of the four suits contains ten cards. Asso counts as 1, Fante as 8, Cavallo as 9 and Re as 10.</p>
          <div className="rules-card-scroll" id="rules-card-panel" role="tabpanel" aria-labelledby={'rules-tab-' + activeSuit} tabIndex={0}>
            <div className="rules-card-grid">
              {CARD_ORDER.map((rank) => (
                <figure className="rules-overview-card" key={rank}>
                  <img src={BASE + 'cards/' + activeSuit + '/' + rank + '.jpg'} alt={RANK_LABELS[rank] + ' of ' + activeSuitLabel} loading="lazy" />
                  <figcaption>{RANK_LABELS[rank]}</figcaption>
                </figure>
              ))}
            </div>
          </div>
          <div className="rules-suit-tabs" role="tablist" aria-label="Card suits">
            {SUITS.map((suit) => (
              <button key={suit.id} className={'rules-suit-tab' + (activeSuit === suit.id ? ' active' : '')} type="button" role="tab" id={'rules-tab-' + suit.id} aria-selected={activeSuit === suit.id} aria-controls="rules-card-panel" onClick={() => setActiveSuit(suit.id)}>{suit.label}</button>
            ))}
          </div>
        </section>
      </section>
    </section>
  )
}

function ModeButton({ active, onClick, title }: { active: boolean; onClick: () => void; title: string }) {
  return <button className={active ? 'mode-button active' : 'mode-button'} type="button" onClick={onClick}><strong>{title}</strong></button>
}

function PrimieraModal({ mode, competitors, cards, onChange, onApply }: {
  mode: GameMode
  competitors: Competitor[]
  cards: Record<string, PrimieraCards>
  onChange: (competitorId: string, suit: Suit, value: string) => void
  onApply: () => void
}) {
  const [activeSlot, setActiveSlot] = useState<{ competitorId: string; suit: Suit } | null>(null)
  const [pickerClosing, setPickerClosing] = useState(false)
  const pickerRef = useRef<HTMLDivElement | null>(null)
  const cardClickTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null)
  const pickerCloseTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null)
  const primieraOrder = [7, 6, 1, 5, 4, 3, 2, 8, 9, 10]

  function closePicker() {
    if (pickerCloseTimerRef.current !== null) window.clearTimeout(pickerCloseTimerRef.current)
    setPickerClosing(true)
    pickerCloseTimerRef.current = window.setTimeout(() => {
      setActiveSlot(null)
      setPickerClosing(false)
      pickerCloseTimerRef.current = null
    }, 150)
  }

  useEffect(() => () => {
    if (cardClickTimerRef.current !== null) window.clearTimeout(cardClickTimerRef.current)
    if (pickerCloseTimerRef.current !== null) window.clearTimeout(pickerCloseTimerRef.current)
  }, [])

  useEffect(() => {
    const picker = pickerRef.current
    if (!picker) return

    const keepPickerWithinViewport = () => {
      const anchor = picker.parentElement?.querySelector<HTMLElement>('.primiera-card-choice')
      if (!anchor) return

      const anchorRect = anchor.getBoundingClientRect()
      const viewportWidth = document.documentElement.clientWidth
      const edgePadding = 8
      const isMobile = window.matchMedia('(max-width: 800px)').matches
      const pickerWidth = isMobile ? viewportWidth - edgePadding * 2 : picker.getBoundingClientRect().width
      const maxLeft = Math.max(edgePadding, viewportWidth - edgePadding - pickerWidth)
      const left = isMobile
        ? edgePadding
        : Math.min(Math.max(anchorRect.left + anchorRect.width / 2 - pickerWidth / 2, edgePadding), maxLeft)

      picker.style.setProperty('position', 'fixed', 'important')
      picker.style.setProperty('left', left + 'px', 'important')
      if (isMobile) picker.style.setProperty('width', pickerWidth + 'px', 'important')
      else picker.style.removeProperty('width')
      picker.style.setProperty('top', anchorRect.bottom + 4 + 'px', 'important')
      picker.style.setProperty('right', 'auto', 'important')
      picker.style.setProperty('bottom', 'auto', 'important')
      picker.style.setProperty('transform', 'none', 'important')
    }

    keepPickerWithinViewport()
    const pickerResizeObserver = new ResizeObserver(keepPickerWithinViewport)
    pickerResizeObserver.observe(picker)
    window.addEventListener('resize', keepPickerWithinViewport)
    window.addEventListener('scroll', keepPickerWithinViewport, true)
    window.visualViewport?.addEventListener('resize', keepPickerWithinViewport)
    window.visualViewport?.addEventListener('scroll', keepPickerWithinViewport)

    return () => {
      pickerResizeObserver.disconnect()
      window.removeEventListener('resize', keepPickerWithinViewport)
      window.removeEventListener('scroll', keepPickerWithinViewport, true)
      window.visualViewport?.removeEventListener('resize', keepPickerWithinViewport)
      window.visualViewport?.removeEventListener('scroll', keepPickerWithinViewport)
    }
  }, [activeSlot])

  return (
    <div className="primiera-inline">
      <div className="primiera-competitor-grid">
        {competitors.map((competitor, competitorIndex) => {
          const selectedCards = cards[competitor.id] ?? EMPTY_PRIMIERA
          return (
            <article className={'primiera-competitor ' + competitorTone(competitorIndex, mode)} key={competitor.id}>
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
                        onClick={() => {
                          if (cardClickTimerRef.current !== null) {
                            window.clearTimeout(cardClickTimerRef.current)
                            cardClickTimerRef.current = null
                            onChange(competitor.id, suit.id, '7')
                            closePicker()
                            return
                          }

                          cardClickTimerRef.current = window.setTimeout(() => {
                            cardClickTimerRef.current = null
                            if (isActive) {
                              closePicker()
                            } else {
                              if (pickerCloseTimerRef.current !== null) window.clearTimeout(pickerCloseTimerRef.current)
                              pickerCloseTimerRef.current = null
                              setPickerClosing(false)
                              setActiveSlot({ competitorId: competitor.id, suit: suit.id })
                            }
                          }, 180)
                        }}>
                        <img src={BASE + 'cards/' + suit.id + '/' + (rank ?? 7) + '.jpg'} alt={rank === null ? 'Unselected 7 of ' + suit.label : RANK_LABELS[rank] + ' of ' + suit.label} />
                      </button>
                      {isActive && (
                        <div ref={pickerRef} className={'primiera-card-picker' + (pickerClosing ? ' is-closing' : '')} aria-label={'Choose ' + suit.label + ' card'}>
                          {primieraOrder.map((optionRank) => (
                            <button type="button" key={optionRank} className={rank === optionRank ? 'active' : ''}
                              onClick={() => { onChange(competitor.id, suit.id, String(optionRank)); closePicker() }}>
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
                <span>Primiera points</span>
                <strong>{calculatePrimiera(selectedCards)}</strong>
              </div>
            </article>
          )
        })}
      </div>
      <button className="button button-primary primiera-compare-action" type="button" onClick={onApply}>Compare</button>
    </div>
  )
}

function WinnerSection({ title, mode, competitors, value, onChange, allowTie = false, tieLabel = 'Tie', children, hideCompetitors = false, headingAction, sectionRef }: {
  title: string
  mode: GameMode
  competitors: Competitor[]
  value: string | null | undefined
  onChange: (value: string | null) => void
  allowTie?: boolean
  tieLabel?: string
  children?: ReactNode
  hideCompetitors?: boolean
  headingAction?: ReactNode
  sectionRef?: React.Ref<HTMLElement>
}) {
  return (
    <section ref={sectionRef} className="round-category">
      <div className="round-category-heading">
        <h3>{title}</h3>
        <div className="round-category-tools">
          {headingAction}
          {allowTie && (
            <button type="button" aria-pressed={value === null} aria-label={tieLabel} title={tieLabel}
              className="tie-selector"
              onClick={() => onChange(null)}><span aria-hidden="true" className="tie-symbol">＝</span><span className="sr-only">{tieLabel}</span></button>
          )}
        </div>
      </div>
      {!hideCompetitors && <div className={value === null ? 'winner-options tie-selected' : 'winner-options'}>
        {competitors.map((competitor, index) => (
          <button key={competitor.id} type="button" aria-pressed={value === competitor.id}
            className={'winner-option ' + competitorTone(index, mode) + (value === competitor.id ? ' selected' : '')}
            onClick={() => onChange(competitor.id)}>{competitor.name}</button>
        ))}
      </div>}
      {children && <div className="winner-section-content">{children}</div>}
    </section>
  )
}

function AppFooter({ onExport, onNewGame }: { onExport: () => void; onNewGame: () => void }) {
  return (
    <footer className="app-footer">
      <div className="footer-actions">
        <button type="button" onClick={onExport}>Export game</button>
        <button type="button" onClick={onNewGame}>New game</button>
      </div>
    </footer>
  )
}

export default App