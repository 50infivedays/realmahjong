import { GameState, PlayerIndex, TileType } from './types';
import { checkWin, canPong, canKong, sortHand } from './utils';

export type AiAction = 
  | { type: 'discard'; tileId: string }
  | { type: 'win' }
  | { type: 'pong' } // Simplified, usually needs to specify which tiles
  | { type: 'pass' };

export const decideAiAction = (gameState: GameState, playerIndex: PlayerIndex): AiAction => {
    const player = gameState.players[playerIndex];
    const { hand } = player;

    // 1. Check Tsumo (Self Win)
    if (checkWin(hand)) {
        return { type: 'win' };
    }

    // 2. Discard Logic
    // Simple heuristic: Discard winds/dragons first if single, then isolated numerics
    
    const tileToDiscard = findBestDiscard(hand);
    return { type: 'discard', tileId: tileToDiscard.id };
};

const findBestDiscard = (hand: TileType[]): TileType => {
    // Strategy:
    // 1. Single Winds/Dragons
    // 2. Isolated Numerics (1 or 9, then others)
    // 3. Just pick random
    
    const counts = new Map<string, number>();
    hand.forEach(t => {
        const key = `${t.suit}-${t.value}`;
        counts.set(key, (counts.get(key) || 0) + 1);
    });

    // Check single honors
    const singleHonors = hand.filter(t => 
        (t.suit === 'wind' || t.suit === 'dragon') && 
        counts.get(`${t.suit}-${t.value}`) === 1
    );
    if (singleHonors.length > 0) return singleHonors[0];

    // Check isolated numerics
    // Simplification: Filter tiles that don't have neighbors
    const isolated = hand.filter(t => {
        if (t.suit === 'wind' || t.suit === 'dragon') return false;
        if (counts.get(`${t.suit}-${t.value}`)! > 1) return false; // Pair or Triplet
        
        const hasNeighbor = hand.some(n => 
            n.suit === t.suit && Math.abs(n.value - t.value) === 1
        );
        const hasGapNeighbor = hand.some(n => 
             n.suit === t.suit && Math.abs(n.value - t.value) === 2
        );
        return !hasNeighbor && !hasGapNeighbor;
    });

    if (isolated.length > 0) return isolated[0];

    // Fallback: Discard first tile (usually sorted, so worst tile)
    // Actually, sort puts characters first. Random might be better or last.
    // Let's discard the one with least value? No.
    // Just discard the first one if nothing else.
    return hand[0];
};


