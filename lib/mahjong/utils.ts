import { TileType, ChiOption, GangOption, Meld } from './types';

export const shuffleDeck = (deck: TileType[]): TileType[] => {
  const newDeck = [...deck];
  for (let i = newDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
  }
  return newDeck;
};

// Simplified internal helper for sort order
const getSuitOrder = (suit: string) => {
  const order: Record<string, number> = {
    'character': 1,
    'bamboo': 2,
    'dot': 3,
    'wind': 4,
    'dragon': 5
  };
  return order[suit] || 99;
};

export const sortHand = (hand: TileType[]): TileType[] => {
  return [...hand].sort((a, b) => {
    if (a.suit !== b.suit) {
      return getSuitOrder(a.suit) - getSuitOrder(b.suit);
    }
    return a.value - b.value;
  });
};

// Advanced Sort: Group complete sets (sequences/triplets) to the left
export const sortHandAdvanced = (hand: TileType[]): TileType[] => {
    let remaining = sortHand([...hand]);
    const formed: TileType[] = [];
    
    const removeAndAdd = (tiles: TileType[]) => {
        tiles.forEach(t => {
            const idx = remaining.findIndex(x => x.id === t.id); 
            if (idx !== -1) {
                remaining.splice(idx, 1);
                formed.push(t);
            }
        });
    };

    // 1. Find Triplets (Pong candidates)
    const uniqueKeys = Array.from(new Set(remaining.map(t => `${t.suit}-${t.value}`)));
    
    for (const key of uniqueKeys) {
        const [s, v] = key.split('-');
        const matches = remaining.filter(t => t.suit === s && t.value === parseInt(v));
        if (matches.length >= 3) {
            removeAndAdd(matches.slice(0, 3));
        }
    }

    // 2. Find Sequences (Chow candidates)
    let foundSequence = true;
    while (foundSequence && remaining.length >= 3) {
        foundSequence = false;
        remaining = sortHand(remaining);
        
        for (let i = 0; i < remaining.length; i++) {
            const first = remaining[i];
            if (['wind', 'dragon'].includes(first.suit)) continue;
            
            const v = first.value;
            const second = remaining.find(t => t.suit === first.suit && t.value === v + 1);
            const third = remaining.find(t => t.suit === first.suit && t.value === v + 2);
            
            if (second && third) {
                removeAndAdd([first, second, third]);
                foundSequence = true;
                break; 
            }
        }
    }
    
    return [...formed, ...remaining];
};

export const getTileCounts = (tiles: TileType[]) => {
  const counts: Record<string, number> = {};
  tiles.forEach(t => {
    const key = `${t.suit}-${t.value}`;
    counts[key] = (counts[key] || 0) + 1;
  });
  return counts;
};

export const checkWin = (tiles: TileType[]): boolean => {
  if (tiles.length === 0) return true;
  if (tiles.length === 2) {
    return tiles[0].suit === tiles[1].suit && tiles[0].value === tiles[1].value;
  }
  const sorted = sortHand(tiles);
  const uniqueTiles = Array.from(new Set(sorted.map(t => `${t.suit}-${t.value}`)));
  for (const key of uniqueTiles) {
    const [s, v] = key.split('-');
    const suit = s as any;
    const value = parseInt(v);
    const pairTiles = sorted.filter(t => t.suit === suit && t.value === value);
    if (pairTiles.length >= 2) {
      const remaining = removeTiles(sorted, [{suit, value} as TileType, {suit, value} as TileType]);
      if (canFormSets(remaining)) return true;
    }
  }
  return false;
};

const removeTiles = (source: TileType[], toRemove: TileType[]): TileType[] => {
  const result = [...source];
  toRemove.forEach(rem => {
    const idx = result.findIndex(t => t.suit === rem.suit && t.value === rem.value);
    if (idx !== -1) result.splice(idx, 1);
  });
  return result;
};

const canFormSets = (tiles: TileType[]): boolean => {
  if (tiles.length === 0) return true;
  const first = tiles[0];
  const triplet = tiles.filter(t => t.suit === first.suit && t.value === first.value);
  if (triplet.length >= 3) {
    const remaining = removeTiles(tiles, [first, first, first]);
    if (canFormSets(remaining)) return true;
  }
  if (['character', 'bamboo', 'dot'].includes(first.suit)) {
    const v = first.value;
    const p1 = tiles.find(t => t.suit === first.suit && t.value === v + 1);
    const p2 = tiles.find(t => t.suit === first.suit && t.value === v + 2);
    if (p1 && p2) {
      const remaining = removeTiles(tiles, [first, p1, p2]);
      if (canFormSets(remaining)) return true;
    }
  }
  return false;
};

export const checkCanPong = (hand: TileType[], tile: TileType): boolean => {
  const count = hand.filter(t => t.suit === tile.suit && t.value === tile.value).length;
  return count >= 2;
};

export const checkCanGang = (hand: TileType[], tile: TileType | null, type: 'draw' | 'discard'): GangOption[] => {
    const options: GangOption[] = [];
    const counts = getTileCounts(hand);

    if (type === 'discard' && tile) {
        // Ming Gang (Point Gang)
        const key = `${tile.suit}-${tile.value}`;
        if (counts[key] === 3) {
            const tiles = hand.filter(t => t.suit === tile.suit && t.value === tile.value);
            options.push({ type: 'MINGGANG', tiles });
        }
    } else if (type === 'draw') {
        // An Gang (Dark Gang)
        Object.entries(counts).forEach(([key, count]) => {
            if (count === 4) {
                const [s, v] = key.split('-');
                const suit = s as any;
                const value = parseInt(v);
                const tiles = hand.filter(t => t.suit === suit && t.value === value);
                options.push({ type: 'ANGANG', tiles });
            }
        });
        // Bu Gang (Add Gang) - requires checking Melds (passed separately or check logic elsewhere)
        // Note: Standard logic usually checks melds in Store
    }

    return options;
};

export const checkCanChi = (hand: TileType[], tile: TileType): ChiOption[] => {
    if (!['character', 'bamboo', 'dot'].includes(tile.suit)) return [];
    
    const v = tile.value;
    const s = tile.suit;
    const options: ChiOption[] = [];
    
    // Logic: We need to find 2 other tiles from hand to form a sequence with `tile` (v).
    
    const find = (val: number) => hand.find(t => t.suit === s && t.value === val);

    // Option 1: [v-2, v-1, v] (Eat as the last tile)
    // Valid if v-2 >= 1 and v-1 >= 1 (Implicit by value check > 0, but tiles are 1-9)
    if (v - 2 >= 1) {
        const m2 = find(v - 2);
        const m1 = find(v - 1);
        if (m2 && m1) options.push({ tiles: [m2, m1, tile] });
    }

    // Option 2: [v-1, v, v+1] (Eat as the middle tile)
    if (v - 1 >= 1 && v + 1 <= 9) {
        const m1 = find(v - 1);
        const p1 = find(v + 1);
        if (m1 && p1) options.push({ tiles: [m1, tile, p1] });
    }

    // Option 3: [v, v+1, v+2] (Eat as the first tile)
    if (v + 2 <= 9) {
        const p1 = find(v + 1);
        const p2 = find(v + 2);
        if (p1 && p2) options.push({ tiles: [tile, p1, p2] });
    }

    // Sort internal tiles for display consistnecy
    options.forEach(opt => {
        opt.tiles.sort((a, b) => a.value - b.value);
    });

    return options;
};

// Deprecated simple checks (kept for compatibility if needed, or remove)
export const canPong = checkCanPong;
export const canKong = (hand: TileType[], tile: TileType) => checkCanGang(hand, tile, 'discard').length > 0;
export const canChow = (hand: TileType[], tile: TileType) => checkCanChi(hand, tile).length > 0;

// --- Shanten Calculation ---

const removeItems = (arr: number[], items: number[]) => {
    const res = [...arr];
    for (const item of items) {
        const idx = res.indexOf(item);
        if (idx !== -1) res.splice(idx, 1);
    }
    return res;
};

const solveSuit = (tiles: number[], isHonor: boolean): {m: number, t: number} => {
    if (tiles.length === 0) return {m: 0, t: 0};
    
    let best = {m: 0, t: 0};
    const update = (m: number, t: number) => {
        if (m * 2 + t > best.m * 2 + best.t) {
            best = {m, t};
        } else if (m * 2 + t === best.m * 2 + best.t && m > best.m) {
            best = {m, t};
        }
    };

    const first = tiles[0];
    
    // 1. Try Mentsu (Triplet)
    if (tiles.filter(x => x === first).length >= 3) {
        const rem = removeItems(tiles, [first, first, first]);
        const res = solveSuit(rem, isHonor);
        update(res.m + 1, res.t);
    }
    
    // 2. Try Mentsu (Sequence) - only for numbers
    if (!isHonor) {
        if (tiles.includes(first + 1) && tiles.includes(first + 2)) {
             const rem = removeItems(tiles, [first, first + 1, first + 2]);
             const res = solveSuit(rem, isHonor);
             update(res.m + 1, res.t);
        }
    }
    
    // 3. Try Taatsu (Pair)
    if (tiles.filter(x => x === first).length >= 2) {
        const rem = removeItems(tiles, [first, first]);
        const res = solveSuit(rem, isHonor);
        update(res.m, res.t + 1);
    }
    
    // 4. Try Taatsu (Protosequence)
    if (!isHonor) {
        // Penchan/Ryanmen
        if (tiles.includes(first + 1)) {
            const rem = removeItems(tiles, [first, first + 1]);
            const res = solveSuit(rem, isHonor);
            update(res.m, res.t + 1);
        }
        // Kanchan
        if (tiles.includes(first + 2)) {
            const rem = removeItems(tiles, [first, first + 2]);
            const res = solveSuit(rem, isHonor);
            update(res.m, res.t + 1);
        }
    }
    
    // 5. Skip
    {
        const rem = tiles.slice(1);
        const res = solveSuit(rem, isHonor);
        update(res.m, res.t);
    }
    
    return best;
};

export const calculateShanten = (hand: TileType[], melds: Meld[] = []): number => {
  const suits = ['character', 'bamboo', 'dot'] as const;
  const honors = ['wind', 'dragon'] as const;

  // Convert to simple number arrays
  const tilesBySuit: Record<string, number[]> = {
    character: [], bamboo: [], dot: [], wind: [], dragon: []
  };
  
  hand.forEach(t => {
    if (tilesBySuit[t.suit]) {
        tilesBySuit[t.suit].push(t.value);
    }
  });
  Object.values(tilesBySuit).forEach(arr => arr.sort((a, b) => a - b));

  let minShanten = 8; 
  const meldCount = melds.length;
  
  const uniqueTiles = Array.from(new Set(hand.map(t => `${t.suit}-${t.value}`)));
  
  const calcWithPair = (pairKey: string | null): number => {
     let currentSuitHands = JSON.parse(JSON.stringify(tilesBySuit)); 
     let hasPair = false;
     
     if (pairKey) {
         const [s, v] = pairKey.split('-');
         const val = parseInt(v);
         // Check availability
         if (currentSuitHands[s].filter((x: number) => x === val).length >= 2) {
             currentSuitHands[s] = removeItems(currentSuitHands[s], [val, val]);
             hasPair = true;
         } else {
             return 8; 
         }
     }
     
     let totalMentsu = meldCount;
     let totalTaatsu = 0;

     for (const suit of [...suits, ...honors]) {
         const values = currentSuitHands[suit];
         const res = solveSuit(values, suit === 'wind' || suit === 'dragon');
         totalMentsu += res.m;
         totalTaatsu += res.t;
     }

     // Constraint: M + T <= 4
     // We need to ensure that we don't count extra Taatsu that we can't convert to Mentsu
     // Max forms = 4 (including Melds)
     
     if (totalMentsu + totalTaatsu > 4) {
         totalTaatsu = 4 - totalMentsu;
     }
     
     // Standard Shanten = 8 - 2M - T - J
     return 8 - 2 * totalMentsu - totalTaatsu - (hasPair ? 1 : 0);
  };

  // 1. Try standard form (find optimal pair)
  // Also try "no pair" (J=0), effectively searching for pair later
  minShanten = Math.min(minShanten, calcWithPair(null));
  
  for (const key of uniqueTiles) {
      minShanten = Math.min(minShanten, calcWithPair(key));
  }
  
  // 2. Check for 7 Pairs (Seven Pairs) - Optional but good for AI
  // 7 Pairs: 6 pairs + 1 pair. Shanten = 6 - pair_count + (needs 7 distinct pairs)
  // Simplified: Shanten = 6 - pair_count + (single tiles needed)
  // Actually standard formula: 6 - pairs. Max shanten 6.
  // If 7 pairs: Shanten = -1 (Win).
  if (meldCount === 0) {
      const counts = getTileCounts(hand);
      let pairs = 0;
      let singles = 0;
      Object.values(counts).forEach(c => {
          if (c >= 2) pairs++;
      });
      // Seven pairs requires 7 *distinct* pairs.
      // Our counts map handles distinct keys.
      const sevenPairsShanten = 6 - pairs; 
      if (sevenPairsShanten < minShanten) {
          minShanten = sevenPairsShanten;
      }
  }
  
  return minShanten;
};
