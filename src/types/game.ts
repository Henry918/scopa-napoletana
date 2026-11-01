export type GameMode = 'two-players' | 'three-players' | 'four-player-teams'
export type Suit = 'coppe' | 'denari' | 'spade' | 'bastoni'
export interface Competitor { id: string; name: string; members: string[] }
export interface RoundInput { competitorId: string; cards: number; denari: number; settebello: boolean; scope: number }
export interface RoundBreakdown {
  cardsWinnerId: string | null
  denariWinnerId: string | null
  settebelloWinnerId: string | null
  primieraWinnerId: string | null
}
export interface RoundResult {
  id: string
  playedAt: string
  entries: RoundInput[]
  primieraWinnerId: string | null
  points: Record<string, number>
  breakdown: RoundBreakdown
}
export interface GameSession {
  schemaVersion: 1
  id: string
  mode: GameMode
  targetScore: number
  competitors: Competitor[]
  rounds: RoundResult[]
  status: 'playing' | 'finished'
  createdAt: string
}