import React from 'react';
import { TileType, Meld } from '@/lib/mahjong/types';
import { Tile } from './Tile';

interface HandProps {
  tiles: TileType[];
  melds: Meld[];
  onTileClick?: (tileId: string) => void;
  isCurrentPlayer?: boolean;
  hidden?: boolean; // For AI players
}

export const Hand: React.FC<HandProps> = ({ tiles, melds, onTileClick, isCurrentPlayer, hidden }) => {
  return (
    <div className="flex gap-4 items-end">
        {/* Melds (Exposed) */}
        {melds.map((meld, idx) => (
            <div key={idx} className="flex gap-0.5 bg-gray-100 p-1 rounded">
                {meld.tiles.map(t => (
                    <Tile key={t.id} tile={t} small />
                ))}
            </div>
        ))}

        {/* Hand Tiles */}
        <div className="flex gap-1">
            {tiles.map((tile) => (
                <Tile 
                    key={tile.id} 
                    tile={tile} 
                    hidden={hidden}
                    onClick={() => isCurrentPlayer && !hidden && onTileClick?.(tile.id)} 
                />
            ))}
        </div>
    </div>
  );
};


