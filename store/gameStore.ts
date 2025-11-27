import { create } from 'zustand';
import { TileType, GameState, Player, PlayerIndex, TurnPhase, Meld } from '@/lib/mahjong/types';
import { generateDeck, TILES_COUNT } from '@/lib/mahjong/constants';
import { shuffleDeck, sortHand, sortHandAdvanced, checkWin, canPong, canKong, canChow } from '@/lib/mahjong/utils';
import { decideAiAction } from '@/lib/mahjong/ai';
import { getTileNameKey } from '@/lib/mahjong/helper';

interface GameStore extends GameState {
  initGame: () => void;
  drawTile: () => void;
  discardTile: (tileId: string) => void;
  playerAction: (action: 'pong' | 'kong' | 'chow' | 'win' | 'pass' | 'sort', selectedTiles?: string[]) => void; 
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
  message: { key: 'welcome' },

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
      message: { key: 'gameStarted' },
    });

    get().drawTile();
  },

  resetGame: () => {
    get().initGame();
  },

  drawTile: () => {
    const { deck, currentPlayer, players } = get();
    if (deck.length === 0) {
      set({ gamePhase: 'finished', message: { key: 'draw' } });
      return;
    }

    const tile = deck.pop()!;
    const newPlayers = players.map(p => ({...p, hand: [...p.hand]}));
    newPlayers[currentPlayer].hand.push(tile);
    
    // Do NOT auto-sort the hand here for human player
    // We want the new tile to be separate (at the end) until they sort or discard
    // Only sort for AI? AI sorts automatically on its turn logic usually
    // But for display consistency, let's keep AI sorted, but HUMAN not sorted for the last tile?
    // `drawTile` adds to end. `sortHand` sorts it.
    
    // Current logic:
    // newPlayers[currentPlayer].hand.push(tile); -> Added to end.
    // We removed `p.hand = sortHand(p.hand)` inside drawTile in previous turns?
    // Wait, line 88: `newPlayers[currentPlayer].hand.push(tile);`
    // It is ALREADY at the end. We just need to ensure we don't call `sortHand` on it immediately.
    // And we don't. `initGame` calls it, but `drawTile` does NOT call `sortHand`.
    
    // So the new tile IS at the end. The UI needs to separate it.
    
    set({ 
        deck, 
        players: newPlayers, 
        turnPhase: 'discard', 
        message: { key: 'playerDrew', params: { index: currentPlayer } } 
    });

    const player = newPlayers[currentPlayer];
    
    if (!player.isAi) {
         if (checkWin(player.hand)) {
             set({ message: { key: 'tsumoCanWin' } });
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
                    message: { key: 'playerTsumo', params: { index: currentPlayer } } 
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
    
    // Sort hand AFTER discard to fill the gap
    // This gives the "merge" effect
    p.hand = sortHand(p.hand);
    p.discards.push(tile);

    set({ 
      players: newPlayers, 
      lastDiscard: tile, 
      lastDiscardBy: currentPlayer,
      turnPhase: 'claim',
      message: { 
          key: 'playerDiscarded', 
          params: { 
              index: currentPlayer, 
              tile: `${tile.suit} ${tile.value}` 
          } 
      }
    });

    const human = newPlayers[0];
    
    if (currentPlayer !== 0) {
        const canRon = checkWin([...human.hand, tile]);
        const canP = canPong(human.hand, tile);
        const canK = canKong(human.hand, tile);
        const canC = (currentPlayer === 3) && canChow(human.hand, tile);

        if (canRon || canP || canK || canC) {
            set({ message: { key: 'claimTile' } });
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
      
      if (action === 'sort') {
        const newPlayers = players.map(p => ({...p, hand: [...p.hand]}));
        newPlayers[0].hand = sortHandAdvanced(newPlayers[0].hand);
        set({ players: newPlayers });
        return;
      }

      if (!lastDiscard && action !== 'win') return; 

      const newPlayers = players.map(p => ({
          ...p, 
          hand: [...p.hand], 
          discards: [...p.discards],
          melds: [...p.melds]
      }));
      const human = newPlayers[0];

      if (action === 'pass') {
          const nextPlayer = (lastDiscardBy! + 1) % 4;
          set({ currentPlayer: nextPlayer as PlayerIndex, turnPhase: 'draw', message: { key: 'passed' } });
          get().drawTile();
          return;
      }

      if (action === 'win') {
          if (lastDiscard) human.hand.push(lastDiscard);
          set({ 
              gamePhase: 'finished', 
              winner: 0, 
              winningHand: human.hand,
              message: { key: lastDiscard ? 'youWinRon' : 'youWinTsumo' }
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
        
        set({ players: newPlayers, currentPlayer: 0, turnPhase: 'discard', lastDiscard: null, message: { key: 'pong' } });
      }

      if (action === 'kong') {
          const match = human.hand.filter(t => t.suit === lastDiscard.suit && t.value === lastDiscard.value).slice(0, 3);
          if (match.length < 3) return;

          match.forEach(m => {
            const idx = human.hand.findIndex(t => t.id === m.id);
            if (idx !== -1) human.hand.splice(idx, 1);
          });

          human.melds.push({ type: 'kong', tiles: [...match, lastDiscard] });
          newPlayers[lastDiscardBy!].discards.pop();

          set({ players: newPlayers, currentPlayer: 0, turnPhase: 'draw', lastDiscard: null, message: { key: 'kongReplacement' } });
          get().drawTile(); 
          return;
      }

      if (action === 'chow') {
          const v = lastDiscard.value;
          const s = lastDiscard.suit;
          
          const find = (offset: number) => human.hand.find(t => t.suit === s && t.value === v + offset);
          
          let tilesToEat: TileType[] | null = null;
          
          const m2 = find(-2);
          const m1 = find(-1);
          if (m2 && m1) tilesToEat = [m2, m1];
          else {
              const p1 = find(1);
              if (m1 && p1) tilesToEat = [m1, p1];
              else {
                  const p2 = find(2);
                  if (p1 && p2) tilesToEat = [p1, p2];
              }
          }

          if (!tilesToEat) return;

          tilesToEat.forEach(m => {
              const idx = human.hand.findIndex(t => t.id === m.id);
              if (idx !== -1) human.hand.splice(idx, 1);
          });

          human.melds.push({ type: 'chow', tiles: [...tilesToEat, lastDiscard].sort((a,b) => a.value - b.value) });
          newPlayers[lastDiscardBy!].discards.pop();

          set({ players: newPlayers, currentPlayer: 0, turnPhase: 'discard', lastDiscard: null, message: { key: 'chow' } });
      }
  }

}));
