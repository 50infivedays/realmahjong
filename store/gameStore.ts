import { create } from 'zustand';
import { TileType, GameState, Player, PlayerIndex, TurnPhase, Meld } from '@/lib/mahjong/types';
import { generateDeck, TILES_COUNT } from '@/lib/mahjong/constants';
import { shuffleDeck, sortHand, checkWin, canPong, canKong, canChow } from '@/lib/mahjong/utils';
import { decideAiAction } from '@/lib/mahjong/ai';

interface GameStore extends GameState {
  initGame: () => void;
  drawTile: () => void;
  discardTile: (tileId: string) => void;
  playerAction: (action: 'pong' | 'kong' | 'chow' | 'win' | 'pass', selectedTiles?: string[]) => void; // Added selectedTiles for Chow if needed (simplified to auto-detect for now)
  resetGame: () => void;
}

const INITIAL_PLAYER_STATE: Omit<Player, 'id'> = {
  hand: [],
  discards: [],
  melds: [],
  isAi: false,
  wind: 1,
  score: 1000,
};

export const useGameStore = create<GameStore>((set, get) => ({
  deck: [],
  players: [],
  currentPlayer: 0,
  turnPhase: 'draw',
  lastDiscard: null,
  lastDiscardBy: null,
  winner: null,
  winningHand: null,
  gamePhase: 'finished',
  message: 'Welcome to Mahjong!',

  initGame: () => {
    const deck = shuffleDeck(generateDeck());
    const players: Player[] = Array(4).fill(null).map((_, idx) => ({
      ...INITIAL_PLAYER_STATE,
      id: idx as PlayerIndex,
      hand: [],
      discards: [],
      melds: [],
      isAi: idx !== 0,
      wind: idx + 1,
    }));

    for (let i = 0; i < 13; i++) {
      players.forEach(p => {
        if (deck.length > 0) p.hand.push(deck.pop()!);
      });
    }

    players.forEach(p => {
      p.hand = sortHand(p.hand);
    });

    set({
      deck,
      players,
      currentPlayer: 0,
      turnPhase: 'draw',
      gamePhase: 'playing',
      lastDiscard: null,
      lastDiscardBy: null,
      winner: null,
      winningHand: null,
      message: 'Game Started. East wind turn.',
    });

    get().drawTile();
  },

  resetGame: () => {
    get().initGame();
  },

  drawTile: () => {
    const { deck, currentPlayer, players } = get();
    if (deck.length === 0) {
      set({ gamePhase: 'finished', message: 'Draw! No more tiles.' });
      return;
    }

    const tile = deck.pop()!;
    const newPlayers = players.map(p => ({...p, hand: [...p.hand]}));
    newPlayers[currentPlayer].hand.push(tile);
    
    set({ deck, players: newPlayers, turnPhase: 'discard', message: `Player ${currentPlayer} drew a tile.` });

    const player = newPlayers[currentPlayer];
    
    if (!player.isAi) {
         if (checkWin(player.hand)) {
             set({ message: 'Tsumo! You can Win!' });
         }
    }

    if (player.isAi) {
        setTimeout(() => {
           const action = decideAiAction({ ...get(), players: newPlayers }, currentPlayer);
           if (action.type === 'discard' && action.tileId) {
               get().discardTile(action.tileId);
           } else if (action.type === 'win') {
                set({ 
                    gamePhase: 'finished', 
                    winner: currentPlayer, 
                    winningHand: player.hand,
                    message: `Player ${currentPlayer} Tsumo!` 
                });
           }
        }, 1000);
    }
  },

  discardTile: (tileId: string) => {
    const { players, currentPlayer } = get();
    const newPlayers = players.map(p => ({...p, hand: [...p.hand], discards: [...p.discards]}));
    const p = newPlayers[currentPlayer];
    
    const tileIndex = p.hand.findIndex(t => t.id === tileId);
    if (tileIndex === -1) return;

    const tile = p.hand.splice(tileIndex, 1)[0];
    p.hand = sortHand(p.hand);
    p.discards.push(tile);

    set({ 
      players: newPlayers, 
      lastDiscard: tile, 
      lastDiscardBy: currentPlayer,
      turnPhase: 'claim',
      message: `Player ${currentPlayer} discarded ${tile.suit} ${tile.value}`
    });

    const human = newPlayers[0];
    
    if (currentPlayer !== 0) {
        const canRon = checkWin([...human.hand, tile]);
        const canP = canPong(human.hand, tile);
        const canK = canKong(human.hand, tile);
        const canC = (currentPlayer === 3) && canChow(human.hand, tile);

        if (canRon || canP || canK || canC) {
            set({ message: `Claim tile?` });
            return;
        }
    }

    setTimeout(() => {
        const nextPlayer = (currentPlayer + 1) % 4;
        set({ currentPlayer: nextPlayer as PlayerIndex, turnPhase: 'draw' });
        get().drawTile();
    }, 500);
  },

  playerAction: (action) => {
      const { players, lastDiscard, lastDiscardBy } = get();
      if (!lastDiscard && action !== 'win') return; // Only win allows non-discard action (Tsumo)

      // Deep copy
      const newPlayers = players.map(p => ({
          ...p, 
          hand: [...p.hand], 
          discards: [...p.discards],
          melds: [...p.melds]
      }));
      const human = newPlayers[0];

      if (action === 'pass') {
          const nextPlayer = (lastDiscardBy! + 1) % 4;
          set({ currentPlayer: nextPlayer as PlayerIndex, turnPhase: 'draw', message: 'Passed.' });
          get().drawTile();
          return;
      }

      if (action === 'win') {
          if (lastDiscard) human.hand.push(lastDiscard);
          set({ 
              gamePhase: 'finished', 
              winner: 0, 
              winningHand: human.hand,
              message: lastDiscard ? `You Win (Ron)!` : `You Win (Tsumo)!`
          });
          return;
      }

      if (!lastDiscard) return;

      if (action === 'pong') {
        const match = human.hand.filter(t => t.suit === lastDiscard.suit && t.value === lastDiscard.value).slice(0, 2);
        if (match.length < 2) return;

        match.forEach(m => {
            const idx = human.hand.findIndex(t => t.id === m.id);
            if (idx !== -1) human.hand.splice(idx, 1);
        });
        
        human.melds.push({ type: 'pong', tiles: [...match, lastDiscard] });
        newPlayers[lastDiscardBy!].discards.pop();
        
        set({ players: newPlayers, currentPlayer: 0, turnPhase: 'discard', lastDiscard: null, message: 'Pong!' });
      }

      if (action === 'kong') {
          // Exposed Kong
          const match = human.hand.filter(t => t.suit === lastDiscard.suit && t.value === lastDiscard.value).slice(0, 3);
          if (match.length < 3) return;

          match.forEach(m => {
            const idx = human.hand.findIndex(t => t.id === m.id);
            if (idx !== -1) human.hand.splice(idx, 1);
          });

          human.melds.push({ type: 'kong', tiles: [...match, lastDiscard] });
          newPlayers[lastDiscardBy!].discards.pop();

          // Kong requires drawing a replacement tile
          set({ players: newPlayers, currentPlayer: 0, turnPhase: 'draw', lastDiscard: null, message: 'Kong! Draw replacement.' });
          get().drawTile(); 
          return;
      }

      if (action === 'chow') {
          // Simplified Chow: Auto-detect the sequence
          // If multiple sequences possible (e.g. 2,3,4,5,6 and discard 4 -> 2,3,4 or 4,5,6 or 3,4,5)
          // For simplicity: Pick the first valid sequence.
          
          const v = lastDiscard.value;
          const s = lastDiscard.suit;
          
          // Candidates
          const find = (offset: number) => human.hand.find(t => t.suit === s && t.value === v + offset);
          
          let tilesToEat: TileType[] | null = null;
          
          // Try v-2, v-1
          const m2 = find(-2);
          const m1 = find(-1);
          if (m2 && m1) tilesToEat = [m2, m1];
          else {
              // Try v-1, v+1
              const p1 = find(1);
              if (m1 && p1) tilesToEat = [m1, p1];
              else {
                  // Try v+1, v+2
                  const p2 = find(2);
                  if (p1 && p2) tilesToEat = [p1, p2];
              }
          }

          if (!tilesToEat) return; // No chow possible

          tilesToEat.forEach(m => {
              const idx = human.hand.findIndex(t => t.id === m.id);
              if (idx !== -1) human.hand.splice(idx, 1);
          });

          human.melds.push({ type: 'chow', tiles: [...tilesToEat, lastDiscard].sort((a,b) => a.value - b.value) });
          newPlayers[lastDiscardBy!].discards.pop();

          set({ players: newPlayers, currentPlayer: 0, turnPhase: 'discard', lastDiscard: null, message: 'Chow!' });
      }
  }

}));
