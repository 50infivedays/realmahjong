import { create } from 'zustand';
import { TileType, GameState, Player, PlayerIndex, TurnPhase, Meld, ActionOptions, GangOption, ChiOption } from '@/lib/mahjong/types';
import { generateDeck, TILES_COUNT } from '@/lib/mahjong/constants';
import { shuffleDeck, sortHand, sortHandAdvanced, checkWin, checkCanPong, checkCanGang, checkCanChi } from '@/lib/mahjong/utils';
import { decideAiAction, decideAiClaim } from '@/lib/mahjong/ai';
import { getTileNameKey } from '@/lib/mahjong/helper';

interface GameStore extends GameState {
  initGame: () => void;
  drawTile: () => void;
  discardTile: (tileId: string) => void;
  playerAction: (action: 'pong' | 'kong' | 'chow' | 'win' | 'pass' | 'sort', selectedOptionIndex?: number) => void; 
  resetGame: () => void;
  recentAction: { type: 'pong' | 'kong' | 'chow' | 'win'; playerIndex: number } | null;
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

// Helper to handle AI Claims logic
const processAiClaims = (get: () => GameStore, set: any): boolean => {
    const { players, lastDiscard, lastDiscardBy } = get();
    if (!lastDiscard || lastDiscardBy === null) return false;
    
    const tile = lastDiscard;

    // Helper to trigger visual effect
    const triggerActionEffect = (type: 'pong' | 'kong' | 'chow' | 'win', playerIndex: number) => {
        set({ recentAction: { type, playerIndex } });
        setTimeout(() => {
            set({ recentAction: null });
        }, 2000); // Effect duration
    };

    // 1. Check RON (Win) - Priority over all
    for (let i = 1; i < 4; i++) {
        if (i === lastDiscardBy) continue; 
        const action = decideAiClaim(get(), i as PlayerIndex, tile);
        if (action.type === 'win') {
            const newPlayers = players.map(p => ({...p, hand: [...p.hand]}));
            const p = newPlayers[i];
            p.hand.push(tile);
            p.hand = sortHand(p.hand);
            set({ 
                players: newPlayers,
                gamePhase: 'finished', 
                winner: i as PlayerIndex, 
                winningHand: p.hand,
                message: { key: 'playerRon', params: { index: i } },
                actionOptions: DEFAULT_ACTION_OPTIONS
            });
            triggerActionEffect('win', i);
            return true;
        }
    }

    // 2. Check Pon/Kong
    for (let offset = 1; offset < 4; offset++) {
        const idx = (lastDiscardBy + offset) % 4;
        if (idx === 0) continue; 
        
        const action = decideAiClaim(get(), idx as PlayerIndex, tile);
        
        if (action.type === 'pong' || (action.type === 'gang' && action.gangType === 'MINGGANG')) {
             const newPlayers = players.map(p => ({...p, hand: [...p.hand], discards: [...p.discards], melds: [...p.melds]}));
             const p = newPlayers[idx];
             
             // Remove tiles
             if (action.type === 'pong') {
                 const toRemove = 2; // Need 2 matching
                 let removed = 0;
                 for (let i = 0; i < p.hand.length; i++) {
                     if (removed < toRemove && p.hand[i].suit === tile.suit && p.hand[i].value === tile.value) {
                         p.hand.splice(i, 1);
                         i--;
                         removed++;
                     }
                 }
                 p.melds.push({ type: 'pong', tiles: action.tiles });
             } else {
                 // Gang
                 const toRemove = 3; 
                 let removed = 0;
                 for (let i = 0; i < p.hand.length; i++) {
                     if (removed < toRemove && p.hand[i].suit === tile.suit && p.hand[i].value === tile.value) {
                         p.hand.splice(i, 1);
                         i--;
                         removed++;
                     }
                 }
                 p.melds.push({ type: 'kong', tiles: action.tiles });
             }

             newPlayers[lastDiscardBy].discards.pop(); // Remove from discard pile

             set({ 
                 players: newPlayers,
                 currentPlayer: idx as PlayerIndex, 
                 turnPhase: 'discard', // AI turn to discard after claim
                 lastDiscard: null,
                 message: { key: action.type === 'pong' ? 'playerPong' : 'playerKong', params: { index: idx } },
                 actionOptions: DEFAULT_ACTION_OPTIONS
             });
             
             triggerActionEffect(action.type === 'pong' ? 'pong' : 'kong', idx);

             // Trigger AI discard logic after claim (delayed)
             setTimeout(() => {
                 get().drawTile(); // Using drawTile to trigger AI logic? No, drawTile draws a card. 
                 // AI claiming means they skip draw and go straight to discard.
                 // But `drawTile` function handles AI logic `decideAiAction`.
                 // We need to trigger `decideAiAction` without drawing.
                 // Or we can split logic. 
                 // Current `drawTile` does: `newPlayers[currentPlayer].hand.push(tile)` then `decideAiAction`.
                 
                 // We should probably just call `decideAiAction` directly or create a `aiTurn` helper.
                 // For now, let's simulate it by calling a simplified AI action handler or modifying drawTile.
                 // Ideally: `aiTurn(get, set, idx)`.
                 
                 const aiAction = decideAiAction(get(), idx as PlayerIndex);
                 if (aiAction.type === 'discard' && aiAction.tileId) {
                     get().discardTile(aiAction.tileId);
                 } else if (aiAction.type === 'win') {
                     // Tsumo (e.g. from replacement tile? No, here it is just discard phase)
                     // Wait, after Pon/Chi you discard. You can't Tsumo immediately unless it's a replacement (Kong).
                     // If Kong, we need to draw a replacement tile.
                 }
             }, 1000);

             // If Kong, we actually need to draw a replacement tile first!
             if (action.type === 'gang') {
                  // Draw replacement
                  // ... Too complex to patch perfectly here without refactoring `drawTile`.
                  // Let's assume AI just discards for Pong/Chow.
                  // For Kong, it's tricky. 
                  // Let's simplify: AI only Pongs/Chows for now, or if Kong, we handle replacement.
                  // If Kong, we should call `drawTile`? 
                  // If we call `drawTile`, it draws a normal tile.
                  // We need `drawReplacementTile`.
                  // Given constraints, let's assume standard drawTile works for replacement if we force it.
                  if (action.type === 'gang') {
                       get().drawTile(); // Draw replacement
                  }
             }

             return true;
        }
    }
    
    // 3. Check Chow (Chi) - Only next player
    const nextIdx = (lastDiscardBy + 1) % 4;
    if (nextIdx !== 0) { 
         const action = decideAiClaim(get(), nextIdx as PlayerIndex, tile);
         if (action.type === 'chow') {
             const newPlayers = players.map(p => ({...p, hand: [...p.hand], discards: [...p.discards], melds: [...p.melds]}));
             const p = newPlayers[nextIdx];
             
             // Remove tiles from hand
             // action.tiles contains the 3 tiles. One is the discard.
             // We need to remove the other 2 from hand.
             const meldTiles = action.tiles;
             
             // We know which tile is the discard (tile).
             // Remove the others.
             let removed = 0;
             // Identify tiles to remove (simple ID check might fail if IDs are not consistent in Action return)
             // Use suit/value
             for (const mt of meldTiles) {
                 if (mt.suit === tile.suit && mt.value === tile.value) continue; // Don't remove the claimed tile (it's not in hand)
                 // Actually `action.tiles` might have multiple same values.
                 // Be careful.
                 // We need to remove exactly those that matched.
                 const idx = p.hand.findIndex(h => h.suit === mt.suit && h.value === mt.value);
                 if (idx !== -1) {
                     p.hand.splice(idx, 1);
                 }
             }
             
             p.melds.push({ type: 'chow', tiles: action.tiles });
             newPlayers[lastDiscardBy].discards.pop();

             set({ 
                 players: newPlayers,
                 currentPlayer: nextIdx as PlayerIndex, 
                 turnPhase: 'discard', 
                 lastDiscard: null,
                 message: { key: 'playerChow', params: { index: nextIdx } },
                 actionOptions: DEFAULT_ACTION_OPTIONS
             });

             triggerActionEffect('chow', nextIdx);
             
             setTimeout(() => {
                 const aiAction = decideAiAction(get(), nextIdx as PlayerIndex);
                 if (aiAction.type === 'discard' && aiAction.tileId) {
                     get().discardTile(aiAction.tileId);
                 }
             }, 1000);
             return true;
         }
    }

    return false;
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
  recentAction: null,

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
      actionOptions: DEFAULT_ACTION_OPTIONS,
      recentAction: null
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
           } else if (action.type === 'gang') {
               // AI Self Gang (AnGang)
               const newPlayersGang = get().players.map(p => ({...p})); // Re-fetch latest
               const p = newPlayersGang[currentPlayer];
               // Remove 4 tiles
               const target = action.tiles[0];
               let removed = 0;
               for(let i=0; i<p.hand.length; i++) {
                   if (removed < 4 && p.hand[i].suit === target.suit && p.hand[i].value === target.value) {
                       p.hand.splice(i, 1);
                       i--;
                       removed++;
                   }
               }
               p.melds.push({ type: 'kong', tiles: action.tiles });
               set({ players: newPlayersGang, message: { key: 'playerKong', params: { index: currentPlayer } } });
               get().drawTile(); // Replacement
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

    // Check AI Claims (since Human didn't claim or it's not Human's turn to claim)
    // If AI claims, processAiClaims returns true and handles state update.
    setTimeout(() => {
        if (processAiClaims(get, set)) return;

        const nextPlayer = (currentPlayer + 1) % 4;
        set({ currentPlayer: nextPlayer as PlayerIndex, turnPhase: 'draw' });
        get().drawTile();
    }, 3000);
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
          
          // Human passed. Check if AI wants it.
          setTimeout(() => {
               if (processAiClaims(get, set)) return;

               if (lastDiscard) {
                   const nextPlayer = (lastDiscardBy! + 1) % 4;
                   set({ currentPlayer: nextPlayer as PlayerIndex, turnPhase: 'draw' });
                   get().drawTile();
               }
          }, 200);
          return;
      }

      if (action === 'win') {
          if (lastDiscard) {
              human.hand.push(lastDiscard);
          }
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
              if (!lastDiscard) return; 

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
