import React from 'react';
import { TileType, Meld } from '@/lib/mahjong/types';
import { Tile } from './Tile';
import { cn } from '@/lib/utils';

interface HandProps {
  tiles: TileType[];
  melds: Meld[];
  onTileClick?: (tileId: string) => void;
  isCurrentPlayer?: boolean;
  hidden?: boolean; // For AI players
}

export const Hand: React.FC<HandProps> = ({ tiles, melds, onTileClick, isCurrentPlayer, hidden }) => {
  // Identify if the last tile should be separated (just drawn)
  // Logic: If it's current player's turn (and not hidden/AI), and hand length is 14 (13+1), 
  // usually the last tile is the drawn one if we didn't sort it yet.
  // In our store, we append the drawn tile to the end.
  
  const handLength = tiles.length;
  // Standard hand is 13. If 14, we have a drawn tile.
  const hasDrawnTile = handLength % 3 === 2; // 14, 11 (after kang?), etc. usually 13+1=14.
  
  return (
    <div className="flex gap-4 items-end">
        {/* Melds (Exposed) */}
        {melds.map((meld, idx) => (
            <div key={idx} className="flex gap-0.5 bg-gray-100 p-1 rounded shadow-sm">
                {meld.tiles.map(t => (
                    <Tile key={t.id} tile={t} small />
                ))}
            </div>
        ))}

        {/* Hand Tiles */}
        <div className="flex items-end">
            {/* Main Hand */}
            <div className="flex gap-0.5">
                {tiles.slice(0, hasDrawnTile ? -1 : undefined).map((tile) => (
                    <Tile 
                        key={tile.id} 
                        tile={tile} 
                        hidden={hidden}
                        onClick={() => isCurrentPlayer && !hidden && onTileClick?.(tile.id)} 
                    />
                ))}
            </div>

            {/* Drawn Tile (Separated) */}
            {hasDrawnTile && (
                <div className="ml-3 animate-in slide-in-from-right-4 fade-in duration-300">
                    <Tile 
                        tile={tiles[tiles.length - 1]} 
                        hidden={hidden}
                        onClick={() => isCurrentPlayer && !hidden && onTileClick?.(tiles[tiles.length - 1].id)} 
                        // Add a slight visual pop for the drawn tile if needed, Tile component handles selection
                    />
                </div>
            )}
        </div>
    </div>
  );
};
