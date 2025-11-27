import { GameMessage } from './helper';

export type Suit = 'bamboo' | 'character' | 'dot' | 'wind' | 'dragon';

export type TileType = {
  id: string; // Unique identifier for React keys
  suit: Suit;
  value: number; // 1-9 for numerics, 1-4 for winds (E,S,W,N), 1-3 for dragons (Red, Green, White)
};

export type MeldType = 'chow' | 'pong' | 'kong';

export type Meld = {
  type: MeldType;
  tiles: TileType[];
};

export type PlayerIndex = 0 | 1 | 2 | 3; // 0 is human, 1-3 are AI

export type Player = {
  id: PlayerIndex;
  hand: TileType[];
  discards: TileType[];
  melds: Meld[];
  isAi: boolean;
  wind: number; // 1-4 (E, S, W, N)
  score: number;
};

export type GamePhase = 'dealing' | 'playing' | 'finished';

export type TurnPhase = 'draw' | 'discard' | 'claim'; 
// draw: player needs to draw (or just drew and needs to discard)
// discard: player just discarded, waiting for others to claim
// claim: checking if anyone claims the discard

export type GameState = {
  deck: TileType[];
  players: Player[];
  currentPlayer: PlayerIndex;
  turnPhase: TurnPhase;
  lastDiscard: TileType | null;
  lastDiscardBy: PlayerIndex | null;
  winner: PlayerIndex | null;
  winningHand: TileType[] | null;
  gamePhase: GamePhase;
  message: GameMessage; // Changed from string to structured object
};
