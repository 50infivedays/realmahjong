import { create } from 'zustand';
import { TileType, GameState, Player, PlayerIndex, TurnPhase, Meld, ActionOptions, GangOption, ChiOption } from '@/lib/mahjong/types';
import { generateDeck, TILES_COUNT } from '@/lib/mahjong/constants';
import { shuffleDeck, sortHand, sortHandAdvanced, checkWin, checkCanPong, checkCanGang, checkCanChi } from '@/lib/mahjong/utils';
import { decideAiAction } from '@/lib/mahjong/ai';
import { getTileNameKey } from '@/lib/mahjong/helper';

interface GameStore extends GameState {
  initGame: () => void;
  drawTile: () => void;
  discardTile: (tileId: string) => void;
  playerAction: (action: 'pong' | 'kong' | 'chow' | 'win' | 'pass' | 'sort', selectedOptionIndex?: number) => void; 
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

const DEFAULT_ACTION_OPTIONS: ActionOptions = {
    canHu: false,
    canGang: [],
    canPeng: false,
    canChi: []
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
  actionOptions: DEFAULT_ACTION_OPTIONS,

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
      actionOptions: DEFAULT_ACTION_OPTIONS
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
        message: { key: 'playerDrew', params: { index: currentPlayer } },
        actionOptions: DEFAULT_ACTION_OPTIONS
    });

    const player = newPlayers[currentPlayer];
    
    // Human Self Action Check (Tsumo, AnGang, BuGang)
    if (!player.isAi) {
        const canHu = checkWin(player.hand);
        const gangOptions = checkCanGang(player.hand, null, 'draw');

        if (canHu || gangOptions.length > 0) {
            set({ 
                message: { key: 'tsumoCanWin' },
                actionOptions: {
                    ...DEFAULT_ACTION_OPTIONS,
                    canHu,
                    canGang: gangOptions
                }
            });
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
      },
      actionOptions: DEFAULT_ACTION_OPTIONS
    });

    const human = newPlayers[0];
    
    if (currentPlayer !== 0) {
        const canRon = checkWin([...human.hand, tile]);
        const canP = checkCanPong(human.hand, tile);
        const gangOptions = checkCanGang(human.hand, tile, 'discard'); 
        
        const canC = (currentPlayer === 3) ? checkCanChi(human.hand, tile) : [];

        if (canRon || canP || gangOptions.length > 0 || canC.length > 0) {
            set({ 
                message: { key: 'claimTile' },
                actionOptions: {
                    canHu: canRon,
                    canPeng: canP,
                    canGang: gangOptions,
                    canChi: canC
                }
            });
            return; 
        }
    }

    setTimeout(() => {
        const nextPlayer = (currentPlayer + 1) % 4;
        set({ currentPlayer: nextPlayer as PlayerIndex, turnPhase: 'draw' });
        get().drawTile();
    }, 500);
  },

  playerAction: (action, selectedOptionIndex = 0) => {
      const { players, lastDiscard, lastDiscardBy, actionOptions } = get();
      
      if (action === 'sort') {
        const newPlayers = players.map(p => ({...p, hand: [...p.hand]}));
        newPlayers[0].hand = sortHandAdvanced(newPlayers[0].hand);
        set({ players: newPlayers });
        return;
      }

      const newPlayers = players.map(p => ({
          ...p, 
          hand: [...p.hand], 
          discards: [...p.discards],
          melds: [...p.melds]
      }));
      const human = newPlayers[0];

      if (action === 'pass') {
          set({ actionOptions: DEFAULT_ACTION_OPTIONS, message: { key: 'passed' } });
          if (lastDiscard) {
              const nextPlayer = (lastDiscardBy! + 1) % 4;
              set({ currentPlayer: nextPlayer as PlayerIndex, turnPhase: 'draw' });
              get().drawTile();
          }
          return;
      }

      if (action === 'win') {
          // If win from discard (Ron), add tile to hand for display
          if (lastDiscard) {
              human.hand.push(lastDiscard);
          }
          // Sort final hand for display
          human.hand = sortHand(human.hand);
          
          set({ 
              gamePhase: 'finished', 
              winner: 0, 
              winningHand: human.hand,
              message: { key: lastDiscard ? 'youWinRon' : 'youWinTsumo' },
              actionOptions: DEFAULT_ACTION_OPTIONS
          });
          return;
      }

      if (action === 'kong') {
          const gangOpt = actionOptions.canGang[selectedOptionIndex]; 
          if (!gangOpt) return;

          const { tiles, type } = gangOpt;

          if (type === 'MINGGANG') {
              // MingGang (Point Gang) - Using Discard
              if (!lastDiscard) return; // Safety check

              tiles.forEach(t => {
                  const idx = human.hand.findIndex(h => h.id === t.id);
                  if (idx !== -1) human.hand.splice(idx, 1);
              });
              
              human.melds.push({ type: 'kong', tiles: [...tiles, lastDiscard] });
              newPlayers[lastDiscardBy!].discards.pop();
              
              set({ 
                  players: newPlayers, 
                  currentPlayer: 0, 
                  turnPhase: 'draw', 
                  lastDiscard: null, 
                  message: { key: 'kongReplacement' },
                  actionOptions: DEFAULT_ACTION_OPTIONS
              });
              get().drawTile();
          } else {
              // AnGang (Dark Gang) or BuGang (Add Gang)
              // For AnGang, remove all 4 tiles from hand
              tiles.forEach(t => {
                   const idx = human.hand.findIndex(h => h.id === t.id);
                   if (idx !== -1) human.hand.splice(idx, 1);
              });

              human.melds.push({ type: 'kong', tiles: [...tiles] });
              
              set({ 
                  players: newPlayers, 
                  currentPlayer: 0, 
                  turnPhase: 'draw', 
                  lastDiscard: null, 
                  message: { key: 'kongReplacement' },
                  actionOptions: DEFAULT_ACTION_OPTIONS
              });
              get().drawTile();
          }
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
        
        set({ 
            players: newPlayers, 
            currentPlayer: 0, 
            turnPhase: 'discard', 
            lastDiscard: null, 
            message: { key: 'pong' },
            actionOptions: DEFAULT_ACTION_OPTIONS
        });
      }

      if (action === 'chow') {
          const chowOpt = actionOptions.canChi[selectedOptionIndex];
          if (!chowOpt) return;

          const { tiles } = chowOpt;
          tiles.forEach(t => {
              if (t.id === lastDiscard.id) return; 
              const idx = human.hand.findIndex(h => h.id === t.id);
              if (idx !== -1) human.hand.splice(idx, 1);
          });

          human.melds.push({ type: 'chow', tiles: [...tiles].sort((a,b) => a.value - b.value) });
          newPlayers[lastDiscardBy!].discards.pop();

          set({ 
              players: newPlayers, 
              currentPlayer: 0, 
              turnPhase: 'discard', 
              lastDiscard: null, 
              message: { key: 'chow' },
              actionOptions: DEFAULT_ACTION_OPTIONS
          });
      }
  }

}));
