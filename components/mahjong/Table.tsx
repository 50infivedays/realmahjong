"use client";
import React, { useEffect } from 'react';
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
      deck
  } = useGameStore();

  useEffect(() => {
    initGame();
  }, []);

  if (players.length === 0) return <div>Loading...</div>;

  const human = players[0];
  const rightAi = players[1];
  const topAi = players[2];
  const leftAi = players[3];

  const canAction = (players[0] && currentPlayer !== 0 && !!lastDiscard && message.includes('Claim')); 
  const canTsumo = (players[0] && currentPlayer === 0 && message.includes('Tsumo'));

  return (
    <div className="flex flex-col h-screen w-full bg-green-800 overflow-hidden relative select-none">
      
      {/* --- Central Table Area (Discards & Info) --- */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] pointer-events-none">
          
          {/* Center Info Box */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-green-900/80 rounded-xl border border-green-700 flex flex-col items-center justify-center text-white shadow-xl z-10">
              <div className="text-3xl font-bold opacity-30 absolute select-none">東</div>
              
              <div className="relative z-10 text-center">
                <div className="text-xs text-gray-300 mb-1">Remaining</div>
                <div className="text-xl font-mono font-bold mb-2">{deck.length}</div>
                <div className="text-xs text-yellow-300 px-2 text-center">{message}</div>
              </div>

              {/* Last Discard Display (if not claimed yet) */}
              {lastDiscard && (
                <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 flex flex-col items-center z-20 drop-shadow-2xl animate-in fade-in zoom-in duration-300">
                    <Tile tile={lastDiscard} />
                </div>
              )}
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
      <div className="absolute top-4 left-1/2 -translate-x-1/2 rotate-180">
         <Hand tiles={topAi.hand} melds={topAi.melds} hidden />
      </div>

      {/* Left Player (AI 3) */}
      <div className="absolute left-12 top-1/2 -translate-y-1/2 -rotate-90 origin-center">
         <Hand tiles={leftAi.hand} melds={leftAi.melds} hidden />
      </div>

      {/* Right Player (AI 1) */}
      <div className="absolute right-12 top-1/2 -translate-y-1/2 rotate-90 origin-center">
         <Hand tiles={rightAi.hand} melds={rightAi.melds} hidden />
      </div>

      {/* Bottom Player (Human) */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center z-30">
         <div className="mb-4 h-10">
             {/* Action Buttons */}
             {canAction && (
                 <div className="flex gap-2 bg-black/60 p-2 rounded-lg backdrop-blur-sm animate-in slide-in-from-bottom-5">
                     <Button variant="secondary" size="sm" onClick={() => playerAction('pong')}>Pong</Button>
                     <Button variant="secondary" size="sm" onClick={() => playerAction('kong')}>Kong</Button>
                     <Button variant="secondary" size="sm" onClick={() => playerAction('chow')}>Chow</Button>
                     <Button variant="destructive" size="sm" onClick={() => playerAction('win')}>Ron</Button>
                     <Button variant="outline" size="sm" onClick={() => playerAction('pass')}>Pass</Button>
                 </div>
             )}
             {canTsumo && (
                 <div className="flex gap-2 bg-black/60 p-2 rounded-lg backdrop-blur-sm animate-in slide-in-from-bottom-5">
                     <Button variant="destructive" size="sm" onClick={() => playerAction('win')}>Tsumo</Button>
                 </div>
             )}
         </div>
         
         <Hand 
            tiles={human.hand} 
            melds={human.melds}
            isCurrentPlayer={currentPlayer === 0}
            onTileClick={(id) => {
                if (currentPlayer === 0) discardTile(id);
            }}
         />
      </div>

      {/* Game Over Dialog */}
      <Dialog open={gamePhase === 'finished'} onOpenChange={() => {}}>
        <DialogContent>
            <DialogHeader>
            <DialogTitle>Game Over</DialogTitle>
            </DialogHeader>
            <div className="py-4">
                {winner !== null ? (
                    <div>
                        <p className="text-lg font-bold text-green-600">Player {winner} Wins!</p>
                        <div className="mt-4">
                            <p>Winning Hand:</p>
                            <div className="flex gap-1 flex-wrap">
                                {winningHand?.map(t => <Tile key={t.id} tile={t} small />)}
                            </div>
                        </div>
                    </div>
                ) : (
                    <p>Draw!</p>
                )}
            </div>
            <DialogFooter>
                <Button onClick={resetGame}>Play Again</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};
