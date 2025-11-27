import { TileType, Suit } from './types';

export const SUITS: Suit[] = ['bamboo', 'character', 'dot', 'wind', 'dragon'];

export const WIND_NAMES = ['East', 'South', 'West', 'North'];
export const DRAGON_NAMES = ['Red', 'Green', 'White']; // Zhong, Fa, Bai

export const generateDeck = (): TileType[] => {
  const deck: TileType[] = [];
  let idCounter = 0;

  // Helper to add tiles
  const addTiles = (suit: Suit, count: number, maxValues: number) => {
    for (let val = 1; val <= maxValues; val++) {
      for (let i = 0; i < 4; i++) {
        deck.push({
          id: `${suit}-${val}-${i}-${idCounter++}`,
          suit,
          value: val,
        });
      }
    }
  };

  // Numerics (1-9)
  addTiles('bamboo', 4, 9);
  addTiles('character', 4, 9);
  addTiles('dot', 4, 9);

  // Winds (1-4: East, South, West, North)
  addTiles('wind', 4, 4);

  // Dragons (1-3: Red, Green, White)
  addTiles('dragon', 4, 3);

  return deck;
};

export const TILES_COUNT = 136;


