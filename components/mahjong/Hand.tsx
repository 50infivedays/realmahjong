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
  isWinningHand?: boolean; // New prop to control display style
}

export const Hand: React.FC<HandProps> = ({ tiles, melds, onTileClick, isCurrentPlayer, hidden, isWinningHand }) => {
  // Identify if the last tile should be separated (just drawn)
  // Logic: If it's current player's turn (and not hidden/AI), and hand length is 14 (13+1), 
  // usually the last tile is the drawn one if we didn't sort it yet.
  // In our store, we append the drawn tile to the end.
  
  // If it is winning hand display, we don't want to separate the last tile, 
  // and we want all tiles (including melds) to be same size.
  
  const handLength = tiles.length;
  const hasDrawnTile = !isWinningHand && handLength % 3 === 2; 
  
  return (
    <div className={cn("flex gap-2 items-end", isWinningHand && "scale-[0.6] sm:scale-[0.7] md:scale-[0.85] lg:scale-100 origin-center")}>
        {/* Melds (Exposed) */}
        {melds.map((meld, idx) => (
            <div key={idx} className={cn("flex gap-0.5 p-1 rounded shadow-sm", isWinningHand ? "" : "bg-gray-100")}>
                {meld.tiles.map(t => (
                    <Tile key={t.id} tile={t} small={!isWinningHand} />
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
                    />
                </div>
            )}
        </div>
    </div>
  );
};
