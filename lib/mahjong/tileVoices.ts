import type { TileType } from "./types";

const TILES_AUDIO_BASE = "/assets/audio/tiles";

/** Map game tile → voice file id (matches manifest.json / uploaded MP3 names). */
export function getTileVoicePath(tile: TileType): string | null {
  const v = tile.value;
  if (v < 1) return null;

  switch (tile.suit) {
    case "character":
      if (v > 9) return null;
      return `${TILES_AUDIO_BASE}/wan_${String(v).padStart(2, "0")}.mp3`;
    case "dot":
      if (v > 9) return null;
      return `${TILES_AUDIO_BASE}/tong_${String(v).padStart(2, "0")}.mp3`;
    case "bamboo":
      if (v > 9) return null;
      return `${TILES_AUDIO_BASE}/tiao_${String(v).padStart(2, "0")}.mp3`;
    case "wind": {
      if (v > 4) return null;
      const files = ["feng_dong", "feng_nan", "feng_xi", "feng_bei"] as const;
      return `${TILES_AUDIO_BASE}/${files[v - 1]}.mp3`;
    }
    case "dragon": {
      if (v > 3) return null;
      const files = ["jian_zhong", "jian_fa", "jian_bai"] as const;
      return `${TILES_AUDIO_BASE}/${files[v - 1]}.mp3`;
    }
    default:
      return null;
  }
}

const audioCache = new Map<string, HTMLAudioElement>();
let lastPlayedPath: string | null = null;

export function preloadTileVoices(): void {
  if (typeof window === "undefined") return;

  const suits: TileType[] = [
    ...Array.from({ length: 9 }, (_, i) => ({
      id: "preload",
      suit: "character" as const,
      value: i + 1,
    })),
    ...Array.from({ length: 9 }, (_, i) => ({
      id: "preload",
      suit: "dot" as const,
      value: i + 1,
    })),
    ...Array.from({ length: 9 }, (_, i) => ({
      id: "preload",
      suit: "bamboo" as const,
      value: i + 1,
    })),
    ...Array.from({ length: 4 }, (_, i) => ({
      id: "preload",
      suit: "wind" as const,
      value: i + 1,
    })),
    ...Array.from({ length: 3 }, (_, i) => ({
      id: "preload",
      suit: "dragon" as const,
      value: i + 1,
    })),
  ];

  for (const tile of suits) {
    const path = getTileVoicePath(tile);
    if (path && !audioCache.has(path)) {
      const audio = new Audio(path);
      audio.preload = "auto";
      audioCache.set(path, audio);
    }
  }
}

/** Play discard announcement for a tile. */
export function playTileVoice(
  tile: TileType,
  options?: { enabled?: boolean }
): void {
  if (typeof window === "undefined") return;
  if (options?.enabled === false) return;

  const path = getTileVoicePath(tile);
  if (!path) return;

  let audio = audioCache.get(path);
  if (!audio) {
    audio = new Audio(path);
    audio.preload = "auto";
    audioCache.set(path, audio);
  }

  if (lastPlayedPath === path) {
    audio.pause();
  }
  lastPlayedPath = path;
  audio.currentTime = 0;
  void audio.play().catch(() => {});
}
