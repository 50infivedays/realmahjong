import { create } from 'zustand';
import { TileType, GameState, Player, PlayerIndex, TurnPhase, Meld, ActionOptions, GangOption, ChiOption } from '@/lib/mahjong/types';
import { generateDeck, TILES_COUNT } from '@/lib/mahjong/constants';
import { shuffleDeck, sortHand, sortHandAdvanced, checkWin, checkRon, checkCanPong, checkCanGang, checkCanChi } from '@/lib/mahjong/utils';
import { decideAiAction, decideAiClaim } from '@/lib/mahjong/ai';
import { getTileNameKey } from '@/lib/mahjong/helper';
import { event } from '@/lib/gtag';
import {
    announceDiscardTile,
    playMahjongSound,
    playVictoryMusic,
    stopVictoryMusic,
    type MahjongActionSound,
} from '@/lib/mahjong/sounds';
import { useUiStore } from '@/store/uiStore';
import { clearGameTimers, getGameGeneration, scheduleGameTimer } from '@/lib/mahjong/gameTimers';

interface GameStore extends GameState {
    initGame: () => void;
    drawTile: () => void;
    discardTile: (tileId: string) => void;
    playerAction: (action: 'pong' | 'kong' | 'chow' | 'win' | 'pass' | 'sort', selectedOptionIndex?: number) => void;
    resetGame: () => void;
    recentAction: { type: 'pong' | 'kong' | 'chow' | 'win'; playerIndex: number } | null;
    drewThisTurn: boolean;
    claimTimerGen: number;
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

const CLAIM_TIMEOUT_MS = 25000;

const triggerActionEffect = (
    set: (partial: Partial<GameStore>) => void,
    type: MahjongActionSound,
    playerIndex: number,
    gen: number
) => {
    const soundEnabled = useUiStore.getState().soundEnabled;
    playMahjongSound(type, { enabled: soundEnabled });
    if (type === 'win' && playerIndex === 0) {
        scheduleGameTimer(
            () => playVictoryMusic({ enabled: soundEnabled }),
            400,
            gen
        );
    }
    set({ recentAction: { type, playerIndex } });
    scheduleGameTimer(() => set({ recentAction: null }), 2000, gen);
};

const humanClaimOptions = (human: Player, tile: TileType, fromPlayer: PlayerIndex) => {
    const canRon = checkRon(human.hand, tile, human.melds);
    const canP = checkCanPong(human.hand, tile);
    const gangOptions = checkCanGang(human.hand, tile, 'discard', human.melds);
    const canC = fromPlayer === 3 ? checkCanChi(human.hand, tile) : [];
    return { canRon, canP, gangOptions, canC };
};

const humanClaimDiscardOptions = (human: Player) => {
    const canHu = checkWin(human.hand, human.melds);
    return {
        canHu,
        actionOptions: canHu
            ? { ...DEFAULT_ACTION_OPTIONS, canHu: true }
            : DEFAULT_ACTION_OPTIONS,
    };
};

const scheduleAiDiscardOnly = (get: () => GameStore, playerIndex: PlayerIndex, gen: number) => {
    scheduleGameTimer(() => {
        if (get().gamePhase === 'finished') return;
        if (get().currentPlayer !== playerIndex || get().turnPhase !== 'discard') return;
        const aiAction = decideAiAction(get(), playerIndex);
        if (aiAction.type === 'discard' && aiAction.tileId) {
            get().discardTile(aiAction.tileId);
        }
    }, 1000, gen);
};

// Helper to handle AI Claims logic
const processAiClaims = (get: () => GameStore, set: (partial: Partial<GameStore>) => void, gen: number): boolean => {
    const { players, lastDiscard, lastDiscardBy } = get();
    if (!lastDiscard || lastDiscardBy === null) return false;

    const tile = lastDiscard;

    // 1. Ron — turn order from discarder (closest player wins)
    for (let offset = 1; offset < 4; offset++) {
        const claimIdx = ((lastDiscardBy + offset) % 4) as PlayerIndex;
        if (claimIdx === lastDiscardBy) continue;

        const action = decideAiClaim(get(), claimIdx, tile);
        if (action.type === 'win') {
            const newPlayers = players.map((p) => ({ ...p, hand: [...p.hand], discards: [...p.discards], melds: [...p.melds] }));
            const p = newPlayers[claimIdx];
            p.hand.push(tile);
            p.hand = sortHand(p.hand);
            newPlayers[lastDiscardBy].discards.pop();

            set({
                players: newPlayers,
                gamePhase: 'finished',
                winner: claimIdx,
                winningHand: [...p.hand],
                lastDiscard: null,
                lastDiscardBy: null,
                message: { key: 'playerRon', params: { index: claimIdx } },
                actionOptions: DEFAULT_ACTION_OPTIONS,
                drewThisTurn: false,
            });
            triggerActionEffect(set, 'win', claimIdx, gen);
            return true;
        }
    }

    // 2. Pon / Ming gang
    for (let offset = 1; offset < 4; offset++) {
        const idx = (lastDiscardBy + offset) % 4;
        if (idx === 0) continue;

        const action = decideAiClaim(get(), idx as PlayerIndex, tile);

        if (action.type === 'pong' || (action.type === 'gang' && action.gangType === 'MINGGANG')) {
            const newPlayers = players.map((p) => ({
                ...p,
                hand: [...p.hand],
                discards: [...p.discards],
                melds: [...p.melds],
            }));
            const p = newPlayers[idx];

            if (action.type === 'pong') {
                let removed = 0;
                for (let hi = 0; hi < p.hand.length; hi++) {
                    if (removed < 2 && p.hand[hi].suit === tile.suit && p.hand[hi].value === tile.value) {
                        p.hand.splice(hi, 1);
                        hi--;
                        removed++;
                    }
                }
                p.melds.push({ type: 'pong', tiles: [...action.tiles] });
            } else {
                let removed = 0;
                for (let hi = 0; hi < p.hand.length; hi++) {
                    if (removed < 3 && p.hand[hi].suit === tile.suit && p.hand[hi].value === tile.value) {
                        p.hand.splice(hi, 1);
                        hi--;
                        removed++;
                    }
                }
                p.melds.push({ type: 'kong', tiles: [...action.tiles, tile] });
            }

            newPlayers[lastDiscardBy].discards.pop();

            const isKong = action.type === 'gang';

            set({
                players: newPlayers,
                currentPlayer: idx as PlayerIndex,
                turnPhase: isKong ? 'draw' : 'discard',
                lastDiscard: null,
                drewThisTurn: false,
                message: { key: action.type === 'pong' ? 'playerPong' : 'playerKong', params: { index: idx } },
                actionOptions: DEFAULT_ACTION_OPTIONS,
            });

            triggerActionEffect(set, action.type === 'pong' ? 'pong' : 'kong', idx, gen);

            if (isKong) {
                get().drawTile();
            } else {
                scheduleAiDiscardOnly(get, idx as PlayerIndex, gen);
            }

            return true;
        }
    }

    // 3. Chow — next player only
    const nextIdx = (lastDiscardBy + 1) % 4;
    if (nextIdx !== 0) {
        const action = decideAiClaim(get(), nextIdx as PlayerIndex, tile);
        if (action.type === 'chow') {
            const newPlayers = players.map((p) => ({
                ...p,
                hand: [...p.hand],
                discards: [...p.discards],
                melds: [...p.melds],
            }));
            const p = newPlayers[nextIdx];

            for (const mt of action.tiles) {
                if (mt.suit === tile.suit && mt.value === tile.value) continue;
                const hi = p.hand.findIndex((h) => h.suit === mt.suit && h.value === mt.value);
                if (hi !== -1) p.hand.splice(hi, 1);
            }

            p.melds.push({ type: 'chow', tiles: action.tiles });
            newPlayers[lastDiscardBy].discards.pop();

            set({
                players: newPlayers,
                currentPlayer: nextIdx as PlayerIndex,
                turnPhase: 'discard',
                lastDiscard: null,
                drewThisTurn: false,
                message: { key: 'playerChow', params: { index: nextIdx } },
                actionOptions: DEFAULT_ACTION_OPTIONS,
            });

            triggerActionEffect(set, 'chow', nextIdx, gen);
            scheduleAiDiscardOnly(get, nextIdx as PlayerIndex, gen);
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
    drewThisTurn: false,
    claimTimerGen: 0,

    initGame: () => {
        stopVictoryMusic();
        clearGameTimers();

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
            recentAction: null,
            drewThisTurn: false,
            claimTimerGen: 0,
        });

        event({ action: 'game_start', category: 'Game', label: 'New Game Started' });

        get().drawTile();
    },

    resetGame: () => {
        get().initGame();
    },

    drawTile: () => {
        if (get().gamePhase === 'finished') return;
        if (get().turnPhase === 'claim') return;

        const gen = getGameGeneration();
        const { deck: deckSrc, currentPlayer, players } = get();
        if (deckSrc.length === 0) {
            set({ gamePhase: 'finished', message: { key: 'draw' } });
            return;
        }

        const deck = [...deckSrc];
        const tile = deck.pop()!;
        const newPlayers = players.map((p) => ({ ...p, hand: [...p.hand] }));
        newPlayers[currentPlayer].hand.push(tile);

        const player = newPlayers[currentPlayer];

        let actionOptions = DEFAULT_ACTION_OPTIONS;
        let message: GameStore['message'] = { key: 'playerDrew', params: { index: currentPlayer } };

        if (!player.isAi) {
            const canHu = checkWin(player.hand, player.melds);
            const gangOptions = checkCanGang(player.hand, null, 'draw', player.melds);
            if (canHu || gangOptions.length > 0) {
                message = { key: 'tsumoCanWin' };
                actionOptions = { ...DEFAULT_ACTION_OPTIONS, canHu, canGang: gangOptions };
            }
        }

        set({
            deck,
            players: newPlayers,
            turnPhase: 'discard',
            lastDiscard: null,
            lastDiscardBy: null,
            message,
            actionOptions,
            drewThisTurn: true,
        });

        if (player.isAi) {
            scheduleGameTimer(() => {
                if (get().gamePhase === 'finished') return;
                const action = decideAiAction(get(), currentPlayer);
                if (action.type === 'discard' && action.tileId) {
                    get().discardTile(action.tileId);
                } else if (action.type === 'win') {
                    const latest = get().players.map((p, i) =>
                        i === currentPlayer ? { ...p, hand: sortHand([...p.hand]) } : { ...p }
                    );
                    set({
                        players: latest,
                        gamePhase: 'finished',
                        winner: currentPlayer,
                        winningHand: [...latest[currentPlayer].hand],
                        lastDiscard: null,
                        lastDiscardBy: null,
                        message: { key: 'playerTsumo', params: { index: currentPlayer } },
                        actionOptions: DEFAULT_ACTION_OPTIONS,
                        drewThisTurn: false,
                    });
                    triggerActionEffect(set, 'win', currentPlayer, gen);
                } else if (action.type === 'gang') {
                    const newPlayersGang = get().players.map((p) => ({
                        ...p,
                        hand: [...p.hand],
                        melds: [...p.melds],
                    }));
                    const p = newPlayersGang[currentPlayer];
                    const target = action.tiles[0];
                    let removed = 0;
                    for (let i = 0; i < p.hand.length; i++) {
                        if (removed < 4 && p.hand[i].suit === target.suit && p.hand[i].value === target.value) {
                            p.hand.splice(i, 1);
                            i--;
                            removed++;
                        }
                    }
                    p.melds.push({ type: 'kong', tiles: action.tiles });
                    set({
                        players: newPlayersGang,
                        message: { key: 'playerKong', params: { index: currentPlayer } },
                        drewThisTurn: false,
                    });
                    triggerActionEffect(set, 'kong', currentPlayer, gen);
                    get().drawTile();
                }
            }, 1000, gen);
        }
    },

    discardTile: (tileId: string) => {
        if (get().gamePhase === 'finished') return;

        const gen = getGameGeneration();
        const { players, currentPlayer, turnPhase } = get();
        if (turnPhase !== 'discard') return;

        const newPlayers = players.map((p) => ({
            ...p,
            hand: [...p.hand],
            discards: [...p.discards],
        }));
        const p = newPlayers[currentPlayer];

        const tileIndex = p.hand.findIndex((t) => t.id === tileId);
        if (tileIndex === -1) return;

        const tile = p.hand.splice(tileIndex, 1)[0];
        p.hand = sortHand(p.hand);
        p.discards.push(tile);

        announceDiscardTile(tile, {
            enabled: useUiStore.getState().soundEnabled,
        });

        const tileLabel = (() => {
            const { key, value } = getTileNameKey(tile);
            return value ? `${key}:${value}` : key;
        })();

        set({
            players: newPlayers,
            lastDiscard: tile,
            lastDiscardBy: currentPlayer,
            turnPhase: 'claim',
            drewThisTurn: false,
            message: {
                key: 'playerDiscarded',
                params: { index: currentPlayer, tile: tileLabel },
            },
            actionOptions: DEFAULT_ACTION_OPTIONS,
            claimTimerGen: gen,
        });

        const human = newPlayers[0];

        if (currentPlayer !== 0) {
            const { canRon, canP, gangOptions, canC } = humanClaimOptions(
                human,
                tile,
                currentPlayer
            );

            if (canRon || canP || gangOptions.length > 0 || canC.length > 0) {
                set({
                    message: { key: 'claimTile' },
                    actionOptions: {
                        canHu: canRon,
                        canPeng: canP,
                        canGang: gangOptions,
                        canChi: canC,
                    },
                    claimTimerGen: gen,
                });

                scheduleGameTimer(() => {
                    if (get().gamePhase === 'finished') return;
                    if (get().claimTimerGen !== gen || get().turnPhase !== 'claim') return;
                    if (!get().actionOptions.canHu && !get().actionOptions.canPeng &&
                        get().actionOptions.canGang.length === 0 &&
                        get().actionOptions.canChi.length === 0) return;
                    get().playerAction('pass');
                }, CLAIM_TIMEOUT_MS, gen);

                return;
            }
        }

        scheduleGameTimer(() => {
            if (get().gamePhase === 'finished') return;
            if (get().claimTimerGen !== gen) return;
            if (processAiClaims(get, set, gen)) return;

            const nextPlayer = (currentPlayer + 1) % 4;
            set({ currentPlayer: nextPlayer as PlayerIndex, turnPhase: 'draw' });
            get().drawTile();
        }, 1500, gen);
    },

    playerAction: (action, selectedOptionIndex = 0) => {
        const gen = getGameGeneration();
        const state = get();
        const { players, lastDiscard, lastDiscardBy, actionOptions, turnPhase } = state;

        if (action === 'sort') {
            if (state.gamePhase === 'finished') return;
            const newPlayers = players.map((p) => ({ ...p, hand: [...p.hand] }));
            newPlayers[0].hand = sortHandAdvanced(newPlayers[0].hand);
            set({ players: newPlayers });
            return;
        }

        if (state.gamePhase === 'finished') return;

        const newPlayers = players.map((p) => ({
            ...p,
            hand: [...p.hand],
            discards: [...p.discards],
            melds: [...p.melds],
        }));
        const human = newPlayers[0];

        if (action === 'pass') {
            if (turnPhase !== 'claim') return;

            set({
                actionOptions: DEFAULT_ACTION_OPTIONS,
                message: { key: 'passed' },
                claimTimerGen: gen,
            });
            event({ action: 'player_action', category: 'Game', label: 'Pass' });

            scheduleGameTimer(() => {
                if (get().gamePhase === 'finished') return;
                if (processAiClaims(get, set, gen)) return;

                const s = get();
                if (s.lastDiscard && s.lastDiscardBy !== null) {
                    const nextPlayer = (s.lastDiscardBy + 1) % 4;
                    set({ currentPlayer: nextPlayer as PlayerIndex, turnPhase: 'draw', lastDiscard: null });
                    get().drawTile();
                }
            }, 200, gen);
            return;
        }

        if (action === 'win') {
            const canRon = lastDiscard !== null && checkRon(human.hand, lastDiscard, human.melds);
            const canTsumo = checkWin(human.hand, human.melds);
            if (!canRon && !canTsumo) return;

            const isRon = canRon && lastDiscard !== null;
            if (isRon) {
                human.hand.push(lastDiscard);
                if (lastDiscardBy !== null) {
                    newPlayers[lastDiscardBy].discards.pop();
                }
            }
            human.hand = sortHand(human.hand);

            set({
                players: newPlayers,
                gamePhase: 'finished',
                winner: 0,
                winningHand: [...human.hand],
                lastDiscard: null,
                lastDiscardBy: null,
                message: { key: isRon ? 'youWinRon' : 'youWinTsumo' },
                actionOptions: DEFAULT_ACTION_OPTIONS,
                drewThisTurn: false,
            });
            triggerActionEffect(set, 'win', 0, gen);

            event({
                action: 'game_win',
                category: 'Game',
                label: isRon ? 'Human Win Ron' : 'Human Win Tsumo',
                value: human.score,
            });
            return;
        }

        if (action === 'kong') {
            const gangOpt = actionOptions.canGang[selectedOptionIndex];
            if (!gangOpt) return;

            const { tiles, type, meldIndex } = gangOpt;

            if (type === 'MINGGANG') {
                if (!lastDiscard) return;

                tiles.forEach((t) => {
                    const idx = human.hand.findIndex((h) => h.id === t.id);
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
                    actionOptions: DEFAULT_ACTION_OPTIONS,
                    drewThisTurn: false,
                });
                event({ action: 'player_action', category: 'Game', label: 'Kong' });
                triggerActionEffect(set, 'kong', 0, gen);
                get().drawTile();
            } else if (type === 'ANGANG') {
                tiles.forEach((t) => {
                    const idx = human.hand.findIndex((h) => h.id === t.id);
                    if (idx !== -1) human.hand.splice(idx, 1);
                });

                human.melds.push({ type: 'kong', tiles: [...tiles] });

                set({
                    players: newPlayers,
                    currentPlayer: 0,
                    turnPhase: 'draw',
                    lastDiscard: null,
                    message: { key: 'kongReplacement' },
                    actionOptions: DEFAULT_ACTION_OPTIONS,
                    drewThisTurn: false,
                });
                event({ action: 'player_action', category: 'Game', label: 'Kong' });
                triggerActionEffect(set, 'kong', 0, gen);
                get().drawTile();
            } else if (type === 'BUGANG' && meldIndex !== undefined) {
                const pongMeld = human.melds[meldIndex];
                if (!pongMeld || pongMeld.type !== 'pong') return;

                const t0 = pongMeld.tiles[0];
                const hi = human.hand.findIndex((h) => h.suit === t0.suit && h.value === t0.value);
                if (hi === -1) return;

                const added = human.hand.splice(hi, 1)[0];
                human.melds[meldIndex] = { type: 'kong', tiles: [...pongMeld.tiles, added] };

                set({
                    players: newPlayers,
                    currentPlayer: 0,
                    turnPhase: 'draw',
                    lastDiscard: null,
                    message: { key: 'kongReplacement' },
                    actionOptions: DEFAULT_ACTION_OPTIONS,
                    drewThisTurn: false,
                });
                event({ action: 'player_action', category: 'Game', label: 'Kong' });
                triggerActionEffect(set, 'kong', 0, gen);
                get().drawTile();
            }
            return;
        }

        if (!lastDiscard || turnPhase !== 'claim') return;

        if (action === 'pong') {
            const match = human.hand
                .filter((t) => t.suit === lastDiscard.suit && t.value === lastDiscard.value)
                .slice(0, 2);
            if (match.length < 2) return;

            match.forEach((m) => {
                const idx = human.hand.findIndex((t) => t.id === m.id);
                if (idx !== -1) human.hand.splice(idx, 1);
            });

            human.melds.push({ type: 'pong', tiles: [...match, lastDiscard] });
            newPlayers[lastDiscardBy!].discards.pop();

            const { canHu, actionOptions: opts } = humanClaimDiscardOptions(human);

            set({
                players: newPlayers,
                currentPlayer: 0,
                turnPhase: 'discard',
                lastDiscard: null,
                drewThisTurn: false,
                message: { key: canHu ? 'tsumoCanWin' : 'pong' },
                actionOptions: opts,
            });
            triggerActionEffect(set, 'pong', 0, gen);
            event({ action: 'player_action', category: 'Game', label: 'Pong' });
        }

        if (action === 'chow') {
            const chowOpt = actionOptions.canChi[selectedOptionIndex];
            if (!chowOpt) return;

            const { tiles } = chowOpt;
            tiles.forEach((t) => {
                if (t.id === lastDiscard.id) return;
                const idx = human.hand.findIndex((h) => h.id === t.id);
                if (idx !== -1) human.hand.splice(idx, 1);
            });

            human.melds.push({
                type: 'chow',
                tiles: [...tiles].sort((a, b) => a.value - b.value),
            });
            newPlayers[lastDiscardBy!].discards.pop();

            const { canHu, actionOptions: opts } = humanClaimDiscardOptions(human);

            set({
                players: newPlayers,
                currentPlayer: 0,
                turnPhase: 'discard',
                lastDiscard: null,
                drewThisTurn: false,
                message: { key: canHu ? 'tsumoCanWin' : 'chow' },
                actionOptions: opts,
            });
            triggerActionEffect(set, 'chow', 0, gen);
            event({ action: 'player_action', category: 'Game', label: 'Chow' });
        }
    },

}));
