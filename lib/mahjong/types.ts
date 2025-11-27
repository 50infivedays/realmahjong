import { GameMessage } from './helper';

export type Suit = 'bamboo' | 'character' | 'dot' | 'wind' | 'dragon';

export type TileType = {
  id: string;
  suit: Suit;
  value: number; 
};

export type MeldType = 'chow' | 'pong' | 'kong';

export type Meld = {
  type: MeldType;
  tiles: TileType[];
};

export type PlayerIndex = 0 | 1 | 2 | 3; 

export type Player = {
  id: PlayerIndex;
  hand: TileType[];
  discards: TileType[];
  melds: Meld[];
  isAi: boolean;
  wind: number; 
  score: number;
};

export type GamePhase = 'dealing' | 'playing' | 'finished';

export type TurnPhase = 'draw' | 'discard' | 'claim'; 

export type GangType = 'ANGANG' | 'MINGGANG' | 'BUGANG';

export type GangOption = {
    type: GangType;
    tiles: TileType[];
};

export type ChiOption = {
    tiles: TileType[]; // The 3 tiles forming the sequence
};

export type ActionOptions = {
    canHu: boolean;
    canGang: GangOption[];
    canPeng: boolean;
    canChi: ChiOption[];
};

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
  message: GameMessage;
  
  // Current available actions for the human player
  actionOptions: ActionOptions;
};
