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
    <div className="flex flex-col h-screen w-full bg-green-800 overflow-hidden relative">
      
      {/* Top Player (AI 2) */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex flex-col items-center rotate-180">
         <Discards tiles={topAi.discards} />
         <Hand tiles={topAi.hand} melds={topAi.melds} hidden />
      </div>

      {/* Left Player (AI 3) */}
      <div className="absolute left-10 top-1/2 -translate-y-1/2 flex flex-col items-center -rotate-90">
         <Discards tiles={leftAi.discards} />
         <Hand tiles={leftAi.hand} melds={leftAi.melds} hidden />
      </div>

      {/* Right Player (AI 1) */}
      <div className="absolute right-10 top-1/2 -translate-y-1/2 flex flex-col items-center rotate-90">
         <Discards tiles={rightAi.discards} />
         <Hand tiles={rightAi.hand} melds={rightAi.melds} hidden />
      </div>

      {/* Center Info */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-green-900/50 p-4 rounded text-white text-center">
         <h2 className="text-xl font-bold mb-2">Mahjong</h2>
         <div className="text-sm mb-2">{message}</div>
         <div className="text-xs text-gray-300">Tiles left: {deck.length}</div>
         {lastDiscard && (
             <div className="mt-4 flex flex-col items-center">
                 <span className="text-xs mb-1">Last Discard</span>
                 <Tile tile={lastDiscard} />
             </div>
         )}
      </div>

      {/* Bottom Player (Human) */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center">
         <div className="mb-4">
             {/* Action Buttons */}
             {canAction && (
                 <div className="flex gap-2 bg-black/50 p-2 rounded">
                     <Button variant="secondary" onClick={() => playerAction('pong')}>Pong</Button>
                     <Button variant="secondary" onClick={() => playerAction('kong')}>Kong</Button>
                     <Button variant="secondary" onClick={() => playerAction('chow')}>Chow</Button>
                     <Button variant="destructive" onClick={() => playerAction('win')}>Ron (Win)</Button>
                     <Button variant="outline" onClick={() => playerAction('pass')}>Pass</Button>
                 </div>
             )}
             {canTsumo && (
                 <div className="flex gap-2 bg-black/50 p-2 rounded">
                     <Button variant="destructive" onClick={() => playerAction('win')}>Tsumo (Win)</Button>
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
         <div className="mt-2">
            <Discards tiles={human.discards} />
         </div>
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
