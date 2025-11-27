import { TileType, Meld } from './types';

export const shuffleDeck = (deck: TileType[]): TileType[] => {
  const newDeck = [...deck];
  for (let i = newDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
  }
  return newDeck;
};

export const sortHand = (hand: TileType[]): TileType[] => {
  const suitOrder: Record<string, number> = {
    'character': 1,
    'bamboo': 2,
    'dot': 3,
    'wind': 4,
    'dragon': 5
  };

  return [...hand].sort((a, b) => {
    if (a.suit !== b.suit) {
      return suitOrder[a.suit] - suitOrder[b.suit];
    }
    return a.value - b.value;
  });
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


