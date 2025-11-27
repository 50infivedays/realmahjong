import React from 'react';
import { TileType } from '@/lib/mahjong/types';
import { Tile } from './Tile';

interface DiscardsProps {
  tiles: TileType[];
}

export const Discards: React.FC<DiscardsProps> = ({ tiles }) => {
  return (
    <div className="flex flex-wrap gap-1 w-48 h-24 content-start">
      {tiles.map(t => (
        <Tile key={t.id} tile={t} small />
      ))}
    </div>
  );
};


