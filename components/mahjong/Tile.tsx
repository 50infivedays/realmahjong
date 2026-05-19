"use client";

import React from "react";
import { motion } from "framer-motion";
import { TileType } from "@/lib/mahjong/types";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import { springSnappy } from "@/lib/motion";

interface TileProps {
  tile: TileType;
  onClick?: () => void;
  selected?: boolean;
  hidden?: boolean;
  small?: boolean;
}

const getTileImageSrc = (tile: TileType) => {
  const baseUrl = "/tiles";

  if (tile.suit === "character") {
    return `${baseUrl}/Man${tile.value}.svg`;
  }
  if (tile.suit === "dot") {
    return `${baseUrl}/Pin${tile.value}.svg`;
  }
  if (tile.suit === "bamboo") {
    return `${baseUrl}/Sou${tile.value}.svg`;
  }

  if (tile.suit === "wind") {
    const winds = ["Ton", "Nan", "Shaa", "Pei"];
    const name = winds[tile.value - 1];
    return name ? `${baseUrl}/${name}.svg` : `${baseUrl}/Blank.svg`;
  }

  if (tile.suit === "dragon") {
    const dragons = ["Chun", "Hatsu", "Haku"];
    const name = dragons[tile.value - 1];
    return name ? `${baseUrl}/${name}.svg` : `${baseUrl}/Blank.svg`;
  }

  return "";
};

const BACK_IMAGE_URL = "/tiles/Back.svg";

export const Tile: React.FC<TileProps> = ({
  tile,
  onClick,
  selected,
  hidden,
  small,
}) => {
  const reduced = useReducedMotion();
  const sizeClass = small ? "w-8 h-11" : "w-10 h-14";

  if (hidden) {
    return (
      <motion.div
        className={cn(
          "relative rounded-md overflow-hidden mahjong-tile-face select-none",
          sizeClass
        )}
        layout={!reduced}
      >
        <img
          src={BACK_IMAGE_URL}
          alt="Tile back"
          decoding="async"
          loading="lazy"
          className="w-full h-full object-cover"
        />
      </motion.div>
    );
  }

  const imgSrc = getTileImageSrc(tile);

  return (
    <motion.div
      onClick={onClick}
      layout={!reduced}
      className={cn(
        "relative flex flex-col items-center justify-center rounded-md select-none cursor-pointer overflow-hidden mahjong-tile-face",
        sizeClass,
        onClick && "md:hover:-translate-y-0.5"
      )}
      animate={{
        y: selected ? -8 : 0,
        scale: selected ? 1.02 : 1,
      }}
      whileTap={onClick ? { scale: 0.97, y: 0 } : undefined}
      transition={springSnappy}
    >
      <img
        src={imgSrc}
        alt={`${tile.suit}-${tile.value}`}
        decoding="async"
        className="w-full h-full object-contain p-[2px]"
      />
      {selected && (
        <div
          className="absolute inset-0 ring-2 ring-[var(--mahjong-gold)]/80 rounded-md pointer-events-none"
          aria-hidden
        />
      )}
    </motion.div>
  );
};
