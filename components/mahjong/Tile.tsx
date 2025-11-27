import React from 'react';
import { TileType } from '@/lib/mahjong/types';
import { cn } from '@/lib/utils';

interface TileProps {
  tile: TileType;
  onClick?: () => void;
  selected?: boolean;
  hidden?: boolean;
  small?: boolean;
}

// Map local types to Riichi Mahjong Tiles file names
// Local files copied from: https://github.com/FluffyStuff/riichi-mahjong-tiles
const getTileImageSrc = (tile: TileType) => {
  const baseUrl = "/tiles"; // Local path in public folder
  
  if (tile.suit === 'character') {
    return `${baseUrl}/Man${tile.value}.svg`;
  }
  if (tile.suit === 'dot') {
    return `${baseUrl}/Pin${tile.value}.svg`;
  }
  if (tile.suit === 'bamboo') {
    return `${baseUrl}/Sou${tile.value}.svg`;
  }

  if (tile.suit === 'wind') {
    // 1-4: East, South, West, North -> Ton, Nan, Shaa, Pei
    const winds = ['Ton', 'Nan', 'Shaa', 'Pei'];
    return `${baseUrl}/${winds[tile.value - 1]}.svg`;
  }

  if (tile.suit === 'dragon') {
    // My types: 1:Red, 2:Green, 3:White
    // Filenames: Chun (Red), Hatsu (Green), Haku (White)
    const dragons = ['Chun', 'Hatsu', 'Haku'];
    return `${baseUrl}/${dragons[tile.value - 1]}.svg`;
  }

  return '';
};

const BACK_IMAGE_URL = "/tiles/Back.svg";

export const Tile: React.FC<TileProps> = ({ tile, onClick, selected, hidden, small }) => {
  if (hidden) {
    return (
      <div 
        className={cn(
          "relative rounded shadow-md select-none overflow-hidden bg-white",
          small ? "w-8 h-11" : "w-10 h-14",
        )}
      >
        <img 
          src={BACK_IMAGE_URL} 
          alt="Tile Back" 
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  const imgSrc = getTileImageSrc(tile);

  return (
    <div 
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-center justify-center bg-white rounded shadow-md select-none cursor-pointer transition-transform overflow-hidden",
        small ? "w-8 h-11" : "w-10 h-14",
        selected ? "-translate-y-2 ring-2 ring-blue-500" : "hover:-translate-y-1",
        "active:translate-y-0 active:shadow-none"
      )}
    >
      <img 
        src={imgSrc} 
        alt={`${tile.suit}-${tile.value}`} 
        className="w-full h-full object-contain p-[2px]" // Add padding to simulate border/margin inside tile
      />
      {/* Overlay for selection/hover effect if needed */}
      {selected && <div className="absolute inset-0 bg-blue-500/10 pointer-events-none" />}
    </div>
  );
};



