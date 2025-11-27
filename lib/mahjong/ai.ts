import { GameState, PlayerIndex, TileType } from './types';
import { checkWin } from './utils';

export type AiAction = 
  | { type: 'discard'; tileId: string }
  | { type: 'win' }
  | { type: 'pong' } 
  | { type: 'gang' }
  | { type: 'chow' }
  | { type: 'pass' };

export const decideAiAction = (gameState: GameState, playerIndex: PlayerIndex): AiAction => {
    const player = gameState.players[playerIndex];
    const { hand } = player;

    // 1. Check Tsumo (Self Win) - Priority: Highest
    if (checkWin(hand)) {
        return { type: 'win' };
    }
    
    // Note: AI Gang/Pong/Chow logic is usually handled during "Claim" phase (when others discard).
    // This function `decideAiAction` is currently called during AI's *Turn* (after draw).
    // So we only check for Tsumo, AnGang, BuGang here.
    // For now, we simplify AI turn to just Discard or Tsumo.
    // Implementing AI Gang during turn would require checkCanGang(hand, null, 'draw').
    
    // 2. Discard Logic
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

    return hand[0];
};
