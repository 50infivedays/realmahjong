import { GameState, PlayerIndex, TileType, Meld, GangOption, ChiOption, Player } from './types';
import { checkWin, checkCanGang, checkCanPong, checkCanChi, calculateShanten, sortHand, getTileCounts, shuffleDeck } from './utils';
import { CURRENT_AI_CONFIG, AiConfig } from './ai-config';
import { generateDeck } from './constants';

export type AiAction = 
  | { type: 'discard'; tileId: string }
  | { type: 'win' }
  | { type: 'pong'; tiles: TileType[] } 
  | { type: 'gang'; tiles: TileType[]; gangType: 'ANGANG' | 'MINGGANG' | 'BUGANG' }
  | { type: 'chow'; tiles: TileType[] }
  | { type: 'pass' };

interface SimResult {
    win: boolean;
    minShanten: number;
    danger: number;
}

// --- Main Entry Points ---

// Called when it is the AI's turn to Draw/Discard
export const decideAiAction = (gameState: GameState, playerIndex: PlayerIndex): AiAction => {
    return decideAiTurn(gameState, playerIndex);
};

// Called when a tile is discarded by someone else
export const decideAiClaim = (gameState: GameState, playerIndex: PlayerIndex, tile: TileType): AiAction => {
    return decideAiClaimInternal(gameState, playerIndex, tile);
};

// --- Logic ---

const decideAiTurn = (gameState: GameState, playerIndex: PlayerIndex): AiAction => {
    const player = gameState.players[playerIndex];
    const { hand, melds } = player;

    // 1. Check Win (Tsumo)
    if (checkWin(hand)) {
        return { type: 'win' };
    }

    // 2. Check Gang (AnGang / BuGang)
    // Simplify: If AnGang doesn't increase Shanten (it usually decreases or keeps same), do it?
    // Design doc says: generate all legal actions.
    
    const gangOptions = checkCanGang(hand, null, 'draw');
    const legalActions: { action: AiAction; score: number }[] = [];

    // Discard actions
    // We can discard any tile in hand
    // Optimization: Only consider unique tiles to reduce search space
    const uniqueTiles = getUniqueTiles(hand);
    
    for (const tile of uniqueTiles) {
        legalActions.push({ 
            action: { type: 'discard', tileId: tile.id }, 
            score: -Infinity 
        });
    }

    // Gang actions
    for (const opt of gangOptions) {
        legalActions.push({
            action: { type: 'gang', tiles: opt.tiles, gangType: opt.type },
            score: -Infinity
        });
    }

    // Evaluate all actions
    let bestAction: AiAction = legalActions[0].action;
    let bestScore = -Infinity;

    const config = CURRENT_AI_CONFIG;

    // Optimization: If we only have 1 unique tile, just discard it (or gang it)
    if (legalActions.length === 1) return legalActions[0].action;

    for (let i = 0; i < legalActions.length; i++) {
        const item = legalActions[i];
        const score = evaluateAction(gameState, playerIndex, item.action, config);
        if (score > bestScore) {
            bestScore = score;
            bestAction = item.action;
        }
    }

    return bestAction;
};

const decideAiClaimInternal = (gameState: GameState, playerIndex: PlayerIndex, tile: TileType): AiAction => {
    const player = gameState.players[playerIndex];
    const { hand } = player;

    // 1. Check Win (Ron)
    // Try adding tile to hand temporarily
    const testHand = [...hand, tile];
    if (checkWin(testHand)) {
        return { type: 'win' }; // Priority: Always win if possible (unless config says otherwise, but usually YES)
    }

    // 2. Generate Options
    const options: { action: AiAction, score: number }[] = [];
    
    // Always can PASS
    options.push({ action: { type: 'pass' }, score: -Infinity });

    // Pong
    if (checkCanPong(hand, tile)) {
        // Find which tiles to pong
        const pair = hand.filter(t => t.suit === tile.suit && t.value === tile.value).slice(0, 2);
        options.push({ action: { type: 'pong', tiles: [...pair, tile] }, score: -Infinity });
    }

    // Kong (MingGang)
    const gangOpts = checkCanGang(hand, tile, 'discard');
    if (gangOpts.length > 0) {
         options.push({ action: { type: 'gang', tiles: gangOpts[0].tiles, gangType: 'MINGGANG' }, score: -Infinity });
    }

    // Chow (Only if from player to the left: (playerIndex + 3) % 4 === lastDiscardBy)
    // GameStore doesn't pass lastDiscardBy easily here unless we check gameState
    const isLeftPlayer = (gameState.lastDiscardBy === (playerIndex + 3) % 4);
    if (isLeftPlayer) {
        const chiOpts = checkCanChi(hand, tile);
        for (const opt of chiOpts) {
            options.push({ action: { type: 'chow', tiles: opt.tiles }, score: -Infinity });
        }
    }

    // If only PASS available
    if (options.length === 1) return options[0].action;

    const config = CURRENT_AI_CONFIG;
    let bestAction: AiAction = { type: 'pass' };
    let bestScore = -Infinity;

    for (let i = 0; i < options.length; i++) {
        const item = options[i];
        const score = evaluateAction(gameState, playerIndex, item.action, config);
        
        // Bonus for claiming if aggressive
        if (item.action.type !== 'pass') {
            // Simple heuristic boost based on Call Aggressiveness handled in evaluateAction logic usually
            // But let's add it here if evaluateAction doesn't fully cover it
        }
        
        if (score > bestScore) {
            bestScore = score;
            bestAction = item.action;
        }
    }

    return bestAction;
};

// --- Evaluation & Simulation ---

const evaluateAction = (gameState: GameState, playerIndex: PlayerIndex, action: AiAction, config: AiConfig): number => {
    // 1. Apply action to a temporary state
    // We need a lightweight state copy
    const player = gameState.players[playerIndex];
    const initialShanten = calculateShanten(player.hand, player.melds);

    // Sim Stats
    let wins = 0;
    let sumMinShanten = 0;
    let sumDanger = 0;

    // Run Simulations
    // Note: For 'pass', we simulate as if we didn't take the tile.
    // For 'discard', we simulate after discarding.
    
    const N = config.simCount; 
    
    for (let i = 0; i < N; i++) {
        // Create randomized hidden state
        const simState = createSimState(gameState, playerIndex);
        
        // Apply the action to simState
        applyAction(simState, action);

        // Check immediate result
        // If 'win', max score
        if (action.type === 'win') {
            wins += 1;
            sumMinShanten += -1; // Treated as -1
            continue;
        }

        // Run simulation loop
        const result = simulate(simState, config.simDepth);
        
        if (result.win) wins++;
        sumMinShanten += result.minShanten;
        sumDanger += result.danger;
    }

    // Calculate Score
    const estimatedWinRate = wins / N;
    const avgMinShanten = sumMinShanten / N;
    const avgDanger = sumDanger / N;

    const k = 1.0; // Shanten factor
    const c = 0.1; // Danger factor

    // Progress Score: Higher is better (lower shanten)
    // Shanten range: -1 (Win) to 8. 
    // We want to maximize exp(-k * shanten)
    const progressScore = Math.exp(-k * avgMinShanten);
    
    // Safety Score: Higher is better (lower danger)
    const safetyScore = Math.exp(-c * avgDanger);

    const offensePart = (0.5 * estimatedWinRate) + (0.5 * progressScore);
    const defensePart = safetyScore;

    let score = (config.attackBias * offensePart) + (config.defenseBias * defensePart);

    // Call Aggressiveness Bonus
    if (['pong', 'chow', 'gang'].includes(action.type)) {
        // Calculate immediate shanten improvement
        // We need the post-action hand from a single apply
        const tempSim = createSimState(gameState, playerIndex);
        applyAction(tempSim, action);
        const afterShanten = calculateShanten(tempSim.myHand, tempSim.myMelds);
        const delta = initialShanten - afterShanten;
        
        if (delta > 0) {
             score += config.callAggressiveness * (delta * 0.2); 
        } else {
            // Penalize if it doesn't improve shanten (unless needed for Yaku, but we ignore Yaku for now)
             score -= 0.1;
        }
    }

    return score;
};

interface SimState {
    myHand: TileType[];
    myMelds: Meld[];
    wallCount: number;
    // We don't track opponents perfectly in sim, just assume random draws
    // or simplified opponent turn
}

const createSimState = (gameState: GameState, playerIndex: PlayerIndex): SimState => {
    const p = gameState.players[playerIndex];
    // Randomize unknown:
    // We know: My Hand, My Melds, All Discards, All Melds of others.
    // Unknown: Wall + Opponents Hands.
    // For simulation, we just need to know "Tiles remaining in Wall". 
    // We don't explicitly model opponent hands in detail for this simplified Sim,
    // unless we want to simulate them discarding dangerous tiles.
    // Design doc says: "Randomly fill wall and opponent hands".
    
    // Simplification: 
    // Just track `myHand` and assume I draw from an infinite bag of "Unknown Tiles" based on probabilities?
    // Or construct a real deck of remaining tiles.
    
    // Let's construct "remaining tiles" list.
    const visibleTiles = new Map<string, number>();
    // Add own hand
    p.hand.forEach(t => {
        const key = `${t.suit}-${t.value}`;
        visibleTiles.set(key, (visibleTiles.get(key) || 0) + 1);
    });
    // Add all discards and melds
    gameState.players.forEach(pl => {
        pl.discards.forEach(t => {
            const key = `${t.suit}-${t.value}`;
            visibleTiles.set(key, (visibleTiles.get(key) || 0) + 1);
        });
        pl.melds.forEach(m => {
            m.tiles.forEach(t => {
                const key = `${t.suit}-${t.value}`;
                visibleTiles.set(key, (visibleTiles.get(key) || 0) + 1);
            });
        });
    });

    // We just simulate "Me drawing and discarding". 
    // Simulating opponents is hard without full state.
    // Design doc: "Opponent actions: random or simple rules".
    
    // We will use a "Wall Count" and assume draws come from distribution of unrevealed tiles.
    // But constructing the deck every time is expensive. 
    // Optimization: We just assume random draw from "unknowns".
    
    return {
        myHand: [...p.hand],
        myMelds: [...p.melds],
        wallCount: gameState.deck.length // Approximation
    };
};

const applyAction = (state: SimState, action: AiAction) => {
    if (action.type === 'discard') {
        const idx = state.myHand.findIndex(t => t.id === action.tileId);
        if (idx !== -1) state.myHand.splice(idx, 1);
    } else if (action.type === 'pong' || action.type === 'chow' || action.type === 'gang') {
        // Remove used tiles
        // For Sim, we just need to remove matching tiles from hand
        // The action.tiles contains the full set (including the claimed one).
        // We need to remove the ones that were in hand.
        // But wait, `action.tiles` usually has all 3/4.
        // In `decideAiClaimInternal`, we constructed `action.tiles` combining hand tiles + claimed tile.
        // We need to remove `action.tiles` MINUS one (the claimed one).
        // Actually, since we don't track the exact "claimed tile" in the `action` struct for Pon/Chow easily
        // (it's implicit), let's just remove the tiles we have in hand that match.
        
        const tilesInMeld = action.tiles;
        // We need to keep one tile (the one claimed) effectively "added" to meld but not removed from hand (it wasn't in hand).
        // So we remove `tilesInMeld.length - 1` tiles from hand.
        
        // Heuristic: Remove matching tiles from hand.
        let removedCount = 0;
        const neededToRemove = action.type === 'gang' ? (action.gangType === 'ANGANG' ? 4 : 3) : 2; 
        // Wait, for Gang:
        // AnGang: Remove 4 from hand.
        // MingGang: Remove 3 from hand.
        // BuGang: Remove 1 from hand.
        
        if (action.type === 'gang' && action.gangType === 'ANGANG') {
             const target = action.tiles[0];
             state.myHand = state.myHand.filter(t => !(t.suit === target.suit && t.value === target.value));
        } else {
            // Pon/Chow/MingGang
             // We remove tiles from hand that match the meld tiles.
             // But `action.tiles` includes the discard.
             // Simulating this is tricky without knowing WHICH was the discard.
             // Simplification: Just remove the first N matching tiles found in hand.
             
             const toRemove = [...action.tiles];
             // We assume the last one in `action.tiles` might be the discard, or we just remove intersection.
             
             // Better: logic in `decideAiClaim` sets `tiles` correctly.
             // Let's blindly remove tiles from hand that appear in `action.tiles`.
             // But we only remove `length - 1` of them (except AnGang).
             
             let removed = 0;
             const limit = tilesInMeld.length - 1;
             
             for (const t of tilesInMeld) {
                 if (removed >= limit) break;
                 const idx = state.myHand.findIndex(h => h.suit === t.suit && h.value === t.value);
                 if (idx !== -1) {
                     state.myHand.splice(idx, 1);
                     removed++;
                 }
             }
        }
        
        state.myMelds.push({ type: action.type === 'gang' ? 'kong' : action.type, tiles: action.tiles });
    }
};

const simulate = (state: SimState, depth: number): SimResult => {
    let currentShanten = calculateShanten(state.myHand, state.myMelds);
    let minShanten = currentShanten;
    let danger = 0;
    
    // Create a virtual deck of unknown tiles (simplified: full deck minus visible)
    // Performance note: doing this inside simulate loop (depth) is bad.
    // But we need to draw.
    // Optimization: generate a small "draw stream" upfront?
    // Let's just use random tiles 1-9, Suits, etc. ignoring card counting for speed in JS.
    // This is "Monte Carlo with Random Sampling".
    
    for (let d = 0; d < depth; d++) {
        if (state.wallCount <= 0) break;
        
        // 1. Draw
        // Generate random tile
        const tile = randomTile();
        state.myHand.push(tile);
        state.wallCount--;
        
        // Check Win
        if (checkWin(state.myHand)) {
            return { win: true, minShanten: -1, danger };
        }
        
        // 2. Discard (Greedy)
        // Find tile that minimizes shanten
        let bestDiscardIndex = -1;
        let bestNextShanten = 99;
        
        // Try discarding each tile
        for (let i = 0; i < state.myHand.length; i++) {
            const t = state.myHand[i];
            const tempHand = [...state.myHand];
            tempHand.splice(i, 1);
            const s = calculateShanten(tempHand, state.myMelds);
            if (s < bestNextShanten) {
                bestNextShanten = s;
                bestDiscardIndex = i;
            }
        }
        
        if (bestDiscardIndex !== -1) {
            const discarded = state.myHand.splice(bestDiscardIndex, 1)[0];
            // Heuristic Danger: Simple tables (e.g. 4-6 are more dangerous than 1,9, honors)
            danger += getDangerLevel(discarded);
        }
        
        currentShanten = bestNextShanten;
        if (currentShanten < minShanten) minShanten = currentShanten;
    }

    return { win: false, minShanten, danger };
};

// Helpers

const getUniqueTiles = (hand: TileType[]): TileType[] => {
    const seen = new Set<string>();
    const res: TileType[] = [];
    hand.forEach(t => {
        const key = `${t.suit}-${t.value}`;
        if (!seen.has(key)) {
            seen.add(key);
            res.push(t);
        }
    });
    return res;
};

const randomTile = (): TileType => {
    // Generate a completely random tile (ignoring remaining count for speed)
    const suits = ['character', 'bamboo', 'dot', 'wind', 'dragon'];
    const suit = suits[Math.floor(Math.random() * suits.length)];
    let value = 1;
    if (suit === 'wind') value = Math.floor(Math.random() * 4) + 1;
    else if (suit === 'dragon') value = Math.floor(Math.random() * 3) + 1;
    else value = Math.floor(Math.random() * 9) + 1;
    
    return { id: 'sim', suit: suit as any, value };
};

const getDangerLevel = (tile: TileType): number => {
    if (tile.suit === 'wind' || tile.suit === 'dragon') return 1; // Honors usually safe early, dangerous late? Simplified: Low
    if (tile.value === 1 || tile.value === 9) return 2;
    if (tile.value === 2 || tile.value === 8) return 3;
    return 5; // Middle tiles most dangerous
};
