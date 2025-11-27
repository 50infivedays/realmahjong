import React from 'react';
import { TileType } from '@/lib/mahjong/types';
import { Tile } from './Tile';
import { cn } from '@/lib/utils';

interface DiscardsProps {
  tiles: TileType[];
  className?: string;
}

export const Discards: React.FC<DiscardsProps> = ({ tiles, className }) => {
  return (
    <div className={cn("grid grid-cols-6 gap-1 content-start min-h-[100px] min-w-[140px]", className)}>
      {tiles.map(t => (
        <Tile key={t.id} tile={t} small />
      ))}
    </div>
  );
};
