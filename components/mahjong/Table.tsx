"use client";
import React, { useEffect, useState, useRef } from 'react';
import { useGameStore } from '@/store/gameStore';
import { Hand } from './Hand';
import { Discards } from './Discards';
import { Tile } from './Tile';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { ArrowLeftRight, ArrowLeft, RotateCcw } from 'lucide-react';
import { dictionaries, formatString } from '@/lib/i18n';
import { useLanguageStore } from '@/store/languageStore';
import Link from 'next/link';


export const MahjongTable = () => {
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


  // Helpers for visual effects
  const getActionPosition = (index: number) => {
      // 0 is bottom (Human), 1 Right, 2 Top, 3 Left
      switch(index) {
          case 0: return "bottom-[30%] left-1/2 -translate-x-1/2";
          case 1: return "right-[20%] top-1/2 -translate-y-1/2";
          case 2: return "top-[20%] left-1/2 -translate-x-1/2";
          case 3: return "left-[20%] top-1/2 -translate-y-1/2";
          default: return "hidden";
      }
  };

  const getActionText = (type: string) => {
      switch(type) {
          case 'pong': return t.btnPong || "PON";
          case 'kong': return t.btnKong || "KAN";
          case 'chow': return t.btnChow || "CHI";
          case 'win': return t.btnRon || "RON";
          default: return "";
      }
  };

  useEffect(() => {
    initGame();
  }, []);

  const getTranslatedMessage = () => {
      if (!message) return '';
      if (typeof message === 'string') return message; 
      
      const template = t[message.key] || message.key;
      return formatString(template, message.params);
  };

  if (players.length === 0) return <div className="flex items-center justify-center h-full text-white">Loading...</div>;

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
    <div className="flex items-center justify-center h-full w-full bg-green-800 overflow-hidden relative select-none">
      
      {/* Back to Home Button - Visible only on mobile */}
      <Link href="/" className="absolute top-4 left-4 z-[60] rounded-full hover:opacity-80 transition-opacity shadow-lg md:hidden">
          <img src="/icon.png" alt="Home" className="w-10 h-10 rounded-full border-2 border-white/20" />
      </Link>

      {/* Restart Game Button - Visible only on mobile */}
      <Button 
          variant="secondary" 
          size="icon" 
          className="absolute top-4 right-4 z-[60] h-10 w-10 rounded-full bg-black/40 hover:bg-black/60 text-white border-none shadow-lg md:hidden"
          onClick={resetGame}
          title="Restart Game"
      >
          <RotateCcw size={20} />
      </Button>

      {/* Logical Game Container */}
      <div 
        style={{ 
            width: GAME_WIDTH, 
            height: GAME_HEIGHT, 
            transform: `scale(${scale})`,
        }}
        className="relative bg-green-800 shrink-0 shadow-2xl"
      >

        {/* --- Central Table Area (Discards & Info) --- */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] pointer-events-none">
            
            {/* Center Info Box */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 bg-green-900/90 rounded-xl border-2 border-green-700/50 flex flex-col items-center text-white shadow-2xl z-10 pointer-events-auto">
                
                {/* Header: Round Wind & Remaining */}
                <div className="w-full flex justify-between items-center px-3 py-2 border-b border-green-800/50 bg-green-950/30 rounded-t-xl">
                    <div className="flex items-center gap-1 text-yellow-500">
                        <span className="text-sm font-bold">{t.windEast}</span> 
                    </div>
                    <div className="flex items-center gap-1 text-gray-400 text-xs">
                        <span>{t.remaining}</span>
                        <span className="font-mono text-white font-bold">{deck.length}</span>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 w-full flex flex-col items-center justify-center relative p-2">
                    
                    {/* Last Discard Display - Central Focus */}
                    <div className="relative flex flex-col items-center justify-center min-h-[80px]">
                        {lastDiscard ? (
                            <div className="animate-in fade-in zoom-in duration-200 drop-shadow-[0_0_15px_rgba(255,255,0,0.3)] scale-150">
                                <Tile tile={lastDiscard} />
                            </div>
                        ) : (
                            <div className="w-10 h-14 rounded border border-white/10 bg-white/5 flex items-center justify-center scale-150">
                                <div className="w-3 h-3 rounded-full bg-white/10" />
                            </div>
                        )}
                        <span className="text-[10px] text-green-400/60 mt-1 uppercase tracking-wider font-bold pt-4">
                            {lastDiscard ? 'Last Discard' : 'Waiting'}
                        </span>
                    </div>

                    {/* Game Status Message */}
                    <div className="absolute bottom-2 left-0 w-full px-2 text-center">
                        <div className="text-xs font-medium text-yellow-200 bg-black/20 rounded py-1 px-2 truncate shadow-inner">
                            {getTranslatedMessage()}
                        </div>
                    </div>
                </div>
            </div>

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
                    <div className="flex gap-2 bg-black/60 p-2 rounded-lg backdrop-blur-sm animate-in slide-in-from-bottom-5">
                        
                        {/* HU Button */}
                        {actionOptions.canHu && (
                            <Button variant="destructive" size="sm" onClick={() => playerAction('win')}>
                                {lastDiscard ? t.btnRon : t.btnTsumo}
                            </Button>
                        )}

                        {/* GANG Button */}
                        {actionOptions.canGang.length > 0 && (
                            <Button variant="secondary" size="sm" onClick={handleGangClick}>
                                {t.btnKong}
                            </Button>
                        )}

                        {/* PENG Button */}
                        {actionOptions.canPeng && (
                            <Button variant="secondary" size="sm" onClick={() => playerAction('pong')}>
                                {t.btnPong}
                            </Button>
                        )}

                        {/* CHI Button */}
                        {actionOptions.canChi.length > 0 && (
                            <Button variant="secondary" size="sm" onClick={handleChiClick}>
                                {t.btnChow}
                            </Button>
                        )}

                        {/* PASS Button - Always show if actions available */}
                        <Button variant="outline" size="sm" onClick={() => playerAction('pass')}>{t.btnPass}</Button>
                    </div>
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

        {/* Action Effect Overlay */}
        {recentAction && (
            <div className={`absolute ${getActionPosition(recentAction.playerIndex)} z-50 pointer-events-none animate-in zoom-in-50 duration-300`}>
                <div className="text-6xl font-black text-yellow-400 drop-shadow-[0_0_10px_rgba(0,0,0,0.8)] border-4 border-yellow-600 px-8 py-4 rounded-xl bg-black/70 backdrop-blur-sm transform scale-110 shadow-[0_0_30px_rgba(255,215,0,0.5)]">
                    {getActionText(recentAction.type)}
                </div>
            </div>
        )}

      </div>

      {/* Selection Dialogs - Keep these OUTSIDE the scaled container to use full screen overlay properly */}
      <Dialog open={showChiSelection} onOpenChange={setShowChiSelection}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Choose Chow</DialogTitle>
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
                <DialogTitle>Choose Kong</DialogTitle>
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
            <DialogTitle className="text-2xl font-bold text-center">{t.gameOver}</DialogTitle>
            </DialogHeader>
            <div className="py-2 sm:py-6 flex flex-col items-center w-full">
                {winner !== null ? (
                    <div className="w-full flex flex-col items-center">
                        <p className="text-xl font-bold text-green-600 mb-6">{formatString(t.playerWins, { index: winner })}</p>
                        
                        <div className="w-full bg-gray-50 p-2 sm:p-6 rounded-xl border shadow-inner flex flex-col items-center">
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

    </div>
  );
};