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
    p.hand = sortHand(p.hand);
    p.discards.push(tile);

    const tileName = getTileNameKey(tile);
    // Construct message. Note: We just store the tile key, we will translate later.
    // But params only support string/number.
    // Let's use a special format or just pass the key?
    // Actually, we need to translate the tile name in the UI.
    // So we pass the tile key as a param?
    // Or pass {tile} as a param which is the translation key?
    // Let's assume params can be keys for other translations or just values.
    // For simplicity, we will assume the UI can handle nested translation or we pass a string representation.
    // Wait, `formatString` just replaces {key}.
    // If we pass a key as value, it just prints the key.
    // We need the UI to translate the param if it is a key? Too complex.
    // Let's just pass the key and handle it in UI? No, `message` is a single object.
    // Better: `message` is { key: 'playerDiscarded', params: { index: 1, tileKey: 'bamboo' ... } }?
    // Let's simplify: We won't translate tile names in the log for now, or handle it specifically.
    // Actually, let's just pass the tile string for now (e.g. 'bamboo-5') and maybe UI can pretty print it?
    // Or just use the `getTileNameKey` logic in UI?
    // Let's pass the tile description as a string for now.
    // But wait, that breaks i18n.
    // Let's store params with raw values, and let UI helper format it.
    
    // Updated strategy: Params can hold raw values.
    // UI component `GameMessage` will render it.

    set({ 
      players: newPlayers, 
      lastDiscard: tile, 
      lastDiscardBy: currentPlayer,
      turnPhase: 'claim',
      message: { 
          key: 'playerDiscarded', 
          params: { 
              index: currentPlayer, 
              tile: `${tile.suit} ${tile.value}` // Fallback
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
