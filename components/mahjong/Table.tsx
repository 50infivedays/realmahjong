"use client";
import React, { useEffect, useState, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { Hand } from './Hand';
import { Discards } from './Discards';
import { Tile } from './Tile';
import { ActionBurst } from '@/components/motion/ActionBurst';
import { Button } from '@/components/ui/button';
import { springBouncy, springSmooth, springSnappy } from '@/lib/motion';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { ArrowLeftRight, ArrowLeft, RotateCcw, Maximize2 } from 'lucide-react';
import { dictionaries, formatString } from '@/lib/i18n';
import { useLanguageStore } from '@/store/languageStore';
import Link from 'next/link';

import { preloadAllTileImages } from '@/lib/mahjong/preloadTiles';

import { useIsMobile } from '@/lib/hooks/useIsMobile';

export const MahjongTable = () => {
    const isMobile = useIsMobile();
    const didInitRef = useRef(false);
    const {
        players,
        currentPlayer,
        gamePhase,
        message,
        lastDiscard,
        discardTile,
        playerAction,
        initGame,
        resetGame,
        winner,
        winningHand,
        deck,
        actionOptions,
        recentAction
    } = useGameStore();

    const { language } = useLanguageStore();
    const t = dictionaries[language];

    const [showChiSelection, setShowChiSelection] = useState(false);
    const [showGangSelection, setShowGangSelection] = useState(false);
    const [isGameOverDialogOpen, setIsGameOverDialogOpen] = useState(false);
    const [showLandscapeHint, setShowLandscapeHint] = useState(false);

    // Sync game phase with dialog visibility
    useEffect(() => {
        if (gamePhase === 'finished') {
            setIsGameOverDialogOpen(true);
        } else {
            setIsGameOverDialogOpen(false);
        }
    }, [gamePhase]);

    // Scaling Logic
    const [scale, setScale] = useState(1);
    const GAME_WIDTH = 1280;
    const GAME_HEIGHT = 640;

    useEffect(() => {
        const handleResize = () => {
            const w = window.innerWidth;
            const h = window.innerHeight;
            const scaleX = w / GAME_WIDTH;
            const scaleY = h / GAME_HEIGHT;
            setScale(Math.min(scaleX, scaleY, 1.2)); // Cap max scale slightly above 1
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);


    useEffect(() => {
        const checkOrientation = () => {
            if (isMobile && window.innerHeight > window.innerWidth) {
                setShowLandscapeHint(true);
            } else {
                setShowLandscapeHint(false);
            }
        };

        checkOrientation();
        window.addEventListener('resize', checkOrientation);
        return () => window.removeEventListener('resize', checkOrientation);
    }, [isMobile]);

    const handleFullScreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(e => {
                console.log(`Error attempting to enable full-screen mode: ${e.message} (${e.name})`);
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    };

    // Helpers for visual effects
    const getActionPosition = (index: number) => {
        // 0 is bottom (Human), 1 Right, 2 Top, 3 Left
        switch (index) {
            case 0: return "bottom-[30%] left-1/2 -translate-x-1/2";
            case 1: return "right-[20%] top-1/2 -translate-y-1/2";
            case 2: return "top-[20%] left-1/2 -translate-x-1/2";
            case 3: return "left-[20%] top-1/2 -translate-y-1/2";
            default: return "hidden";
        }
    };

    const getActionText = (type: string) => {
        switch (type) {
            case 'pong': return t.btnPong || "PON";
            case 'kong': return t.btnKong || "KAN";
            case 'chow': return t.btnChow || "CHI";
            case 'win': return t.btnRon || "RON";
            default: return "";
        }
    };

    useEffect(() => {
        if (didInitRef.current) return;
        didInitRef.current = true;

        // Start the game immediately
        initGame();

        // Silent background preloading (non-blocking, no UI)
        preloadAllTileImages();
    }, [initGame]);

    const getTranslatedMessage = () => {
        if (!message) return '';
        if (typeof message === 'string') return message;

        const template = t[message.key] || message.key;
        return formatString(template, message.params);
    };

    if (players.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-white">
                <motion.div
                    className="w-48 h-3 rounded-full shimmer-skeleton"
                    aria-hidden
                />
                <p className="text-sm font-medium text-[var(--mahjong-gold-muted)] tracking-wide">
                    {t.loading}
                </p>
            </div>
        );
    }

    const human = players[0];
    const rightAi = players[1];
    const topAi = players[2];
    const leftAi = players[3];

    // Action Button Handlers
    const handleChiClick = () => {
        if (actionOptions.canChi.length > 1) {
            setShowChiSelection(true);
        } else {
            playerAction('chow', 0);
        }
    };

    const handleGangClick = () => {
        if (actionOptions.canGang.length > 1) {
            setShowGangSelection(true);
        } else {
            playerAction('kong', 0);
        }
    };

    const handleSelectChi = (index: number) => {
        setShowChiSelection(false);
        playerAction('chow', index);
    };

    const handleSelectGang = (index: number) => {
        setShowGangSelection(false);
        playerAction('kong', index);
    };

    return (
        <motion.div
            className="flex items-center justify-center h-full w-full mahjong-felt overflow-hidden relative select-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.35 }}
        >
            <div className="mahjong-felt-vignette absolute inset-0 pointer-events-none" aria-hidden />
            {/* Back to Home Button - Visible only on mobile */}
            {isMobile && (
                <Link href="/" className="absolute top-4 left-4 z-[60] rounded-full hover:opacity-80 transition-opacity shadow-lg">
                    <img src="/icon.png" alt="Home" className="w-10 h-10 rounded-full border-2 border-white/20" />
                </Link>
            )}

            {/* Restart Game Button - Visible only on mobile */}
            {isMobile && (
                <>
                    <Button
                        variant="secondary"
                        size="icon"
                        className="absolute top-4 right-4 z-[60] h-10 w-10 rounded-full bg-black/40 hover:bg-black/60 text-white border border-white/10 shadow-lg active:scale-[0.98] transition-transform"
                        onClick={resetGame}
                        title={t.restartGame}
                    >
                        <RotateCcw size={20} />
                    </Button>

                    <Button
                        variant="secondary"
                        size="icon"
                        className="absolute top-16 right-4 z-[60] h-10 w-10 rounded-full bg-black/40 hover:bg-black/60 text-white border-none shadow-lg mt-2"
                        onClick={handleFullScreen}
                        title={t.fullscreen}
                    >
                        <Maximize2 size={20} />
                    </Button>
                </>
            )}

            {/* Landscape Hint Overlay */}
            {showLandscapeHint && (
                <motion.div
                    className="fixed inset-0 z-[100] bg-black/92 flex flex-col items-center justify-center text-white p-8 text-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.25 }}
                >
                    <motion.div
                        className="w-20 h-20 mb-6"
                        animate={{ rotate: [90, 0, 90] }}
                        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                    >
                        <RotateCcw size={80} className="text-[var(--mahjong-gold)]" />
                    </motion.div>
                    <h2 className="font-display text-2xl font-bold mb-4 text-[var(--mahjong-gold)]">
                        {t.landscapeRotate}
                    </h2>
                    <p className="text-base text-white/70 mb-8 max-w-sm leading-relaxed">
                        {t.landscapeHint}
                    </p>
                    <Button
                        size="lg"
                        onClick={handleFullScreen}
                        className="bg-[var(--mahjong-gold)] hover:opacity-90 text-green-950 font-bold border-none active:scale-[0.98] transition-transform"
                    >
                        <Maximize2 className="mr-2" size={20} />
                        {t.fullscreen}
                    </Button>
                </motion.div>
            )}

            {/* Logical Game Container */}
            <div
                style={{
                    width: GAME_WIDTH,
                    height: GAME_HEIGHT,
                    transform: `scale(${scale})`,
                }}
                className="relative shrink-0 will-change-transform mahjong-table-rim"
            >

                {/* --- Central Table Area (Discards & Info) --- */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] pointer-events-none">

                    {/* Center Info Box */}
                    <motion.div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 mahjong-glass rounded-2xl flex flex-col items-center text-white z-10 pointer-events-auto">

                        {/* Header: Round Wind & Remaining */}
                        <motion.div className="w-full flex justify-between items-center px-3 py-2 border-b border-white/10 bg-black/20 rounded-t-2xl">
                            <span className="text-sm font-bold font-display text-[var(--mahjong-gold)] tracking-tight">
                                {t.windEast}
                            </span>
                            <motion.div
                                className="flex items-center gap-1 text-white/50 text-xs"
                                key={deck.length}
                                initial={{ scale: 1.12, opacity: 0.65 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={springSnappy}
                            >
                                <span>{t.remaining}</span>
                                <span className="font-mono text-white font-bold tabular-nums">{deck.length}</span>
                            </motion.div>
                        </motion.div>

                        {/* Main Content Area */}
                        <div className="flex-1 w-full flex flex-col items-center justify-center relative p-2">

                            {/* Last Discard Display - Central Focus */}
                            <div className="relative flex flex-col items-center justify-center min-h-[80px]">
                                <AnimatePresence mode="wait">
                                    {lastDiscard ? (
                                        <motion.div
                                            key={lastDiscard.id}
                                            className="scale-150 shadow-[0_0_20px_oklch(0.75_0.12_85/0.35)]"
                                            initial={{ opacity: 0, scale: 1.2, y: -8 }}
                                            animate={{ opacity: 1, scale: 1.5, y: 0 }}
                                            exit={{ opacity: 0, scale: 1.3 }}
                                            transition={springBouncy}
                                        >
                                            <Tile tile={lastDiscard} />
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="empty"
                                            className="w-10 h-14 rounded-md border border-white/10 bg-white/5 flex items-center justify-center scale-150"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                        >
                                            <div className="w-3 h-3 rounded-full bg-white/15" aria-hidden />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                                <span className="text-[10px] text-[var(--mahjong-gold-muted)]/80 mt-1 uppercase tracking-widest font-semibold pt-4">
                                    {lastDiscard ? t.lastDiscard : t.waiting}
                                </span>
                            </div>

                            {/* Game Status Message */}
                            <div className="absolute bottom-2 left-0 w-full px-2 text-center">
                                <div
                                    className="text-xs font-medium text-[var(--mahjong-gold)]/90 bg-black/25 rounded-lg py-1.5 px-2 truncate border border-white/5"
                                    aria-live="polite"
                                >
                                    {getTranslatedMessage()}
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Discards Areas - Positioned around center */}

                    {/* Top (AI 2) - Rotated 180 */}
                    <div className="absolute top-10 left-1/2 -translate-x-1/2 rotate-180 w-[240px] flex justify-center">
                        <Discards tiles={topAi.discards} />
                    </div>

                    {/* Bottom (Human) */}
                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[240px] flex justify-center">
                        <Discards tiles={human.discards} />
                    </div>

                    {/* Left (AI 3) - Rotated -90 */}
                    <div className="absolute left-[-20px] top-1/2 -translate-y-1/2 -rotate-90 w-[240px] flex justify-center origin-center">
                        <Discards tiles={leftAi.discards} />
                    </div>

                    {/* Right (AI 1) - Rotated 90 */}
                    <div className="absolute right-[-20px] top-1/2 -translate-y-1/2 rotate-90 w-[240px] flex justify-center origin-center">
                        <Discards tiles={rightAi.discards} />
                    </div>

                </div>

                {/* --- Player Hands (Edges) --- */}

                {/* Top Player (AI 2) */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 rotate-180 scale-70">
                    <Hand tiles={topAi.hand} melds={topAi.melds} hidden />
                </div>

                {/* Left Player (AI 3) */}
                <div className="absolute left-[18%] top-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-90 origin-center scale-70">
                    <Hand tiles={leftAi.hand} melds={leftAi.melds} hidden />
                </div>

                {/* Right Player (AI 1) */}
                <div className="absolute right-[18%] top-1/2 translate-x-1/2 -translate-y-1/2 rotate-90 origin-center scale-70">
                    <Hand tiles={rightAi.hand} melds={rightAi.melds} hidden />
                </div>

                {/* Bottom Player (Human) */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center z-30 scale-125 origin-bottom">
                    <div className="mb-4 h-10 flex gap-2 items-center relative w-full justify-center">
                        {/* Sort Button - Moved to the side (absolute positioned relative to this container) */}
                        {currentPlayer === 0 && (
                            <Button
                                variant="secondary"
                                size="icon"
                                className="absolute -right-12 h-8 w-8 rounded-full bg-black/40 hover:bg-black/60 text-white border-none shadow-lg"
                                onClick={() => playerAction('sort')}
                                title="Auto Sort Hand"
                            >
                                <ArrowLeftRight size={16} />
                            </Button>
                        )}

                        {/* Action Buttons */}
                        {(actionOptions.canHu || actionOptions.canGang.length > 0 || actionOptions.canPeng || actionOptions.canChi.length > 0) && (
                            <motion.div
                                className="flex gap-3 bg-black/70 p-3 rounded-2xl backdrop-blur-md shadow-2xl border border-white/10"
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={springSmooth}
                            >

                                {/* HU Button */}
                                {actionOptions.canHu && (
                                    <Button
                                        className="bg-gradient-to-b from-red-500 to-red-700 hover:from-red-400 hover:to-red-600 text-white border-b-4 border-red-900 active:border-b-0 active:translate-y-1 font-black text-lg h-14 w-14 rounded-full shadow-lg transition-all"
                                        onClick={() => playerAction('win')}
                                    >
                                        {lastDiscard ? (t.btnRon || "RON") : (t.btnTsumo || "TSUMO")}
                                    </Button>
                                )}

                                {/* GANG Button */}
                                {actionOptions.canGang.length > 0 && (
                                    <Button
                                        className="bg-gradient-to-b from-yellow-400 to-yellow-600 hover:from-yellow-300 hover:to-yellow-500 text-yellow-950 border-b-4 border-yellow-800 active:border-b-0 active:translate-y-1 font-black text-lg h-14 w-14 rounded-full shadow-lg transition-all"
                                        onClick={handleGangClick}
                                    >
                                        {t.btnKong || "KAN"}
                                    </Button>
                                )}

                                {/* PENG Button */}
                                {actionOptions.canPeng && (
                                    <Button
                                        className="bg-gradient-to-b from-yellow-400 to-yellow-600 hover:from-yellow-300 hover:to-yellow-500 text-yellow-950 border-b-4 border-yellow-800 active:border-b-0 active:translate-y-1 font-black text-lg h-14 w-14 rounded-full shadow-lg transition-all"
                                        onClick={() => playerAction('pong')}
                                    >
                                        {t.btnPong || "PON"}
                                    </Button>
                                )}

                                {/* CHI Button */}
                                {actionOptions.canChi.length > 0 && (
                                    <Button
                                        className="bg-gradient-to-b from-yellow-400 to-yellow-600 hover:from-yellow-300 hover:to-yellow-500 text-yellow-950 border-b-4 border-yellow-800 active:border-b-0 active:translate-y-1 font-black text-lg h-14 w-14 rounded-full shadow-lg transition-all"
                                        onClick={handleChiClick}
                                    >
                                        {t.btnChow || "CHI"}
                                    </Button>
                                )}

                                {/* PASS Button - Always show if actions available */}
                                <Button
                                    variant="outline"
                                    className="h-14 w-14 rounded-full border-2 border-gray-400 bg-gray-100/80 text-gray-600 hover:bg-white hover:text-gray-900 font-bold"
                                    onClick={() => playerAction('pass')}
                                >
                                    {t.btnPass || "Pass"}
                                </Button>
                            </motion.div>
                        )}
                    </div>

                    <Hand
                        tiles={human.hand}
                        melds={human.melds}
                        isCurrentPlayer={currentPlayer === 0}
                        onTileClick={(id) => {
                            if (currentPlayer === 0 && !actionOptions.canHu) discardTile(id);
                        }}
                    />
                </div>

                <ActionBurst
                    visible={!!recentAction}
                    label={recentAction ? getActionText(recentAction.type) : ""}
                    positionClass={recentAction ? getActionPosition(recentAction.playerIndex) : "hidden"}
                />

            </div>

            {/* Selection Dialogs - Keep these OUTSIDE the scaled container to use full screen overlay properly */}
            <Dialog open={showChiSelection} onOpenChange={setShowChiSelection}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="font-display">{t.chooseChow}</DialogTitle>
                    </DialogHeader>
                    <div className="flex gap-4 justify-center py-4">
                        {actionOptions.canChi.map((opt, idx) => (
                            <div
                                key={idx}
                                className="flex gap-1 p-2 border rounded cursor-pointer hover:bg-gray-100"
                                onClick={() => handleSelectChi(idx)}
                            >
                                {opt.tiles.map(tile => <Tile key={tile.id} tile={tile} small />)}
                            </div>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={showGangSelection} onOpenChange={setShowGangSelection}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="font-display">{t.chooseKong}</DialogTitle>
                    </DialogHeader>
                    <div className="flex gap-4 justify-center py-4 flex-wrap">
                        {actionOptions.canGang.map((opt, idx) => (
                            <div
                                key={idx}
                                className="flex flex-col items-center gap-1 p-2 border rounded cursor-pointer hover:bg-gray-100"
                                onClick={() => handleSelectGang(idx)}
                            >
                                <div className="flex gap-1">
                                    {opt.tiles.map(tile => <Tile key={tile.id} tile={tile} small />)}
                                </div>
                                <span className="text-xs text-gray-500">{opt.type}</span>
                            </div>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Game Over Dialog - Outside scaled container */}
            <Dialog open={isGameOverDialogOpen} onOpenChange={setIsGameOverDialogOpen}>
                <DialogContent className="max-w-[95vw] w-full sm:max-w-3xl md:max-w-4xl lg:max-w-5xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
                    <DialogHeader>
                        <DialogTitle className="font-display text-2xl font-bold text-center">{t.gameOver}</DialogTitle>
                    </DialogHeader>
                    <div className="py-2 sm:py-6 flex flex-col items-center w-full">
                        {winner !== null ? (
                            <div className="w-full flex flex-col items-center">
                                <p className="text-xl font-bold text-green-600 mb-6">{formatString(t.playerWins, { index: winner })}</p>

                                <div className="w-full bg-green-950/5 p-2 sm:p-6 rounded-2xl border border-green-900/15 shadow-inner flex flex-col items-center">
                                    <p className="text-sm text-gray-500 mb-2 self-start px-2 sm:px-4">{t.winningHand}</p>
                                    <div className="w-full flex justify-center overflow-x-auto p-2 no-scrollbar">
                                        {/* Use the Hand component to render melds + hand properly */}
                                        <div className="scale-[0.6] sm:scale-[0.7] md:scale-[0.85] lg:scale-100 origin-center">
                                            <Hand
                                                tiles={winningHand || []}
                                                melds={players[winner].melds}
                                                hidden={false}
                                                isWinningHand={true}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <p className="text-xl text-gray-600">Draw!</p>
                        )}
                    </div>
                    <DialogFooter className="sm:justify-center w-full">
                        <Button size="lg" className="w-full sm:w-auto px-8 font-bold text-lg" onClick={resetGame}>{t.playAgain}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </motion.div>
    );
};
