import { TileType, Meld } from './types';

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
    // Strategy:
    // 1. Identify complete sets (Triplets first, then Sequences)
    // 2. Move them to a "formed" list
    // 3. Remaining tiles are sorted normally
    // 4. Combine Formed + Remaining

    let remaining = sortHand([...hand]);
    const formed: TileType[] = [];
    
    const removeAndAdd = (tiles: TileType[]) => {
        tiles.forEach(t => {
            const idx = remaining.findIndex(x => x.id === t.id); // Use ID for exact match
            if (idx !== -1) {
                remaining.splice(idx, 1);
                formed.push(t);
            }
        });
    };

    // 1. Find Triplets (Pong candidates)
    // Iterate unique tiles to find triplets
    // We need to be careful not to break a sequence that might be more valuable? 
    // Usually triplets are clearer.
    const uniqueKeys = Array.from(new Set(remaining.map(t => `${t.suit}-${t.value}`)));
    
    for (const key of uniqueKeys) {
        const [s, v] = key.split('-');
        const matches = remaining.filter(t => t.suit === s && t.value === parseInt(v));
        if (matches.length >= 3) {
            // Found a triplet, move 3 of them
            removeAndAdd(matches.slice(0, 3));
        }
    }

    // 2. Find Sequences (Chow candidates)
    // Only numerics
    // Need to restart search because remaining changed
    // We'll just iterate through remaining sorted tiles
    // This is a greedy approach: Find first possible sequence and take it.
    
    let foundSequence = true;
    while (foundSequence && remaining.length >= 3) {
        foundSequence = false;
        // Sort remaining to ensure we scan in order
        remaining = sortHand(remaining);
        
        for (let i = 0; i < remaining.length; i++) {
            const first = remaining[i];
            if (['wind', 'dragon'].includes(first.suit)) continue;
            
            const v = first.value;
            // Look for v+1, v+2
            const second = remaining.find(t => t.suit === first.suit && t.value === v + 1);
            const third = remaining.find(t => t.suit === first.suit && t.value === v + 2);
            
            if (second && third) {
                removeAndAdd([first, second, third]);
                foundSequence = true;
                break; // Restart scan
            }
        }
    }
    
    // 3. Final sort of the formed groups? 
    // Formed groups are just pushed in order. Maybe we want to sort the groups by suit?
    // The prompt says "sequences... left", implies structure.
    // Let's just keep them in discovery order (Triplets then Sequences) or sort them too?
    // "Sequences in left, others in right".
    // Actually, usually people want sets (melds) together.
    
    // Let's sort the formed part by suit again so it looks neat
    // But wait, if we sort, we might break the visual grouping of a sequence (e.g. 1,2,3).
    // `sortHand` keeps 1,2,3 together. So calling sortHand on formed is fine.
    
    // However, if we have 1,1,1 (bamboo) and 1,2,3 (bamboo), sorting mixes them: 1,1,1,1,2,3.
    // It becomes indistinguishable from a Quad + sequence.
    // Maybe the user just wants standard sort? 
    // User said: "sequences on left... others on right".
    // This implies separating "Completed Sets" from "Loose Tiles".
    
    // So: Formed (Sorted but kept as groups? No, standard UI just sorts everything).
    // If we return a flat array, standard rendering just renders them.
    // If we want to visually separate them, we might need UI changes (gaps).
    // But the request is just "arrange order".
    
    // If I return [1,2,3, 5,5,5, ...rest], they will render as such.
    // But standard sort [1,2,3,5,5,5] is the same as [1,5,2,5,3,5] sorted.
    // Wait, sortHand [1,5,2,5,3,5] -> [1,2,3,5,5,5].
    
    // So actually, standard `sortHand` ALREADY puts sequences and triplets "together" because of value sorting.
    // Example: 2,3,4 bamboo -> sorted is 2,3,4.
    // Example: 5,5,5 bamboo -> sorted is 5,5,5.
    
    // The user might mean: "Prioritize identifying sets and putting them first".
    // Example Hand: 1,2,3,5,8 (Bamboo). 
    // Standard Sort: 1,2,3,5,8.
    // This is already "Sequence left".
    
    // Maybe user means: If I have 1,4,7 and 2,5,8 and 3,6,9.
    // Standard: 1,2,3,4,5,6,7,8,9.
    // This looks like 3 sequences: 123, 456, 789. 
    // Or 147... (Wait 147 is not sequence).
    
    // Let's assume the user wants the standard "sort by suit then value" which effectively groups sequences.
    // BUT, maybe they mean "Put completed sets to the far left, and incomplete junk to the right".
    // E.g. Hand: 1,2,3, 8, 9 (Bamboo). 8,9 is waiting for 7.
    // 1,2,3 is complete.
    // If I have 1,2,3 (Bamboo) and 5,5,5 (Dot) and 1 (Wind).
    // Standard Sort: Bamboo 1,2,3, Dot 5,5,5, Wind 1.
    // This is already good.
    
    // What if: Bamboo 1,2,5,6. (1,2 wait 3; 5,6 wait 4/7).
    // It's sorted.
    
    // I will implement the "Extract Sets" logic and put them first.
    // This helps if you have multiple suits interleaved or complex shapes? 
    // Actually, `sortHand` is usually what "Sort" button does in Mahjong games.
    // Let's stick to the strict "Formed Sets First" approach requested.
    
    // We have `formed` (sets) and `remaining` (junk).
    // We return [...formed, ...remaining].
    // Note: `formed` is currently [triplet1, triplet2, seq1, ...].
    
    return [...formed, ...remaining];
};

// Helper to count tiles by key (suit-value)
export const getTileCounts = (tiles: TileType[]) => {
  const counts: Record<string, number> = {};
  tiles.forEach(t => {
    const key = `${t.suit}-${t.value}`;
    counts[key] = (counts[key] || 0) + 1;
  });
  return counts;
};

// Check if tiles can form a win (4 sets + 1 pair)
// Simple recursive backtracking
export const checkWin = (tiles: TileType[]): boolean => {
  if (tiles.length === 0) return true;
  
  // We need 14 tiles usually for a standard win check (including the claimed one)
  // But recursively we remove sets.
  // Base case: 2 tiles left must be a pair
  if (tiles.length === 2) {
    return tiles[0].suit === tiles[1].suit && tiles[0].value === tiles[1].value;
  }

  const sorted = sortHand(tiles);

  // Try to find a pair first? No, usually standard algorithm is:
  // 1. Remove a pair (eyes).
  // 2. Check if rest form sets.
  // However, inside the recursion, we just need to remove sets. 
  // The "eyes" must be identified at the top level or handled as the last 2.
  
  // Let's try a different approach:
  // Iterate all unique tiles to be the "eyes".
  // If we remove eyes, can the rest form sets?
  
  const uniqueTiles = Array.from(new Set(sorted.map(t => `${t.suit}-${t.value}`)));
  
  for (const key of uniqueTiles) {
    const [s, v] = key.split('-');
    const suit = s as any;
    const value = parseInt(v);
    
    // Check if we have at least 2 of this tile
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
  
  // Try Triplet (Pong)
  const triplet = tiles.filter(t => t.suit === first.suit && t.value === first.value);
  if (triplet.length >= 3) {
    const remaining = removeTiles(tiles, [first, first, first]);
    if (canFormSets(remaining)) return true;
  }
  
  // Try Sequence (Chow) - only for suits (not winds/dragons generally, though some rules differ. Standard: only numerics)
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

export const canPong = (hand: TileType[], tile: TileType): boolean => {
  const count = hand.filter(t => t.suit === tile.suit && t.value === tile.value).length;
  return count >= 2;
};

export const canKong = (hand: TileType[], tile: TileType): boolean => {
  const count = hand.filter(t => t.suit === tile.suit && t.value === tile.value).length;
  return count >= 3;
};

export const canChow = (hand: TileType[], tile: TileType): boolean => {
  if (!['character', 'bamboo', 'dot'].includes(tile.suit)) return false;
  
  const v = tile.value;
  // Combinations: (v-2, v-1), (v-1, v+1), (v+1, v+2)
  const has = (offset: number) => hand.some(t => t.suit === tile.suit && t.value === v + offset);
  
  if (has(-2) && has(-1)) return true;
  if (has(-1) && has(1)) return true;
  if (has(1) && has(2)) return true;
  
  return false;
};
