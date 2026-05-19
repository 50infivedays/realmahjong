/** Mahjong action sound effects (chi / peng / gang / hu) and tile discard voices. */

import { preloadTileVoices, playTileVoice } from "./tileVoices";
import type { TileType } from "./types";

export type MahjongActionSound = "chow" | "pong" | "kong" | "win";

export { playTileVoice, getTileVoicePath } from "./tileVoices";

const SOUND_URLS: Record<MahjongActionSound, string> = {
  chow: "/assets/audio/tiles/action_chi.mp3",
  pong: "/assets/audio/tiles/action_peng.mp3",
  kong: "/assets/audio/tiles/action_gang.mp3",
  win: "/assets/audio/tiles/action_hu.mp3",
};

/** 玩家获胜时播放的背景音乐 — 将文件放到 public/assets/audio/victory.mp3 */
export const VICTORY_MUSIC_URL = "/assets/audio/victory.mp3";

const audioCache: Partial<Record<MahjongActionSound, HTMLAudioElement>> = {};
let victoryAudio: HTMLAudioElement | null = null;

function getAudio(type: MahjongActionSound): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;

  if (!audioCache[type]) {
    const audio = new Audio(SOUND_URLS[type]);
    audio.preload = "auto";
    audioCache[type] = audio;
  }
  return audioCache[type] ?? null;
}

function getVictoryAudio(): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  if (!victoryAudio) {
    victoryAudio = new Audio(VICTORY_MUSIC_URL);
    victoryAudio.preload = "auto";
  }
  return victoryAudio;
}

/** Preload action + tile voice + victory sounds (call once when entering the game). */
export function preloadMahjongSounds(): void {
  if (typeof window === "undefined") return;
  (Object.keys(SOUND_URLS) as MahjongActionSound[]).forEach((type) => {
    getAudio(type);
  });
  getVictoryAudio();
  preloadTileVoices();
}

/** 玩家（座位 0）胡牌胜利时播放的背景音乐。 */
export function playVictoryMusic(options?: { enabled?: boolean }): void {
  if (typeof window === "undefined") return;
  if (options?.enabled === false) return;

  const audio = getVictoryAudio();
  if (!audio) return;

  audio.currentTime = 0;
  void audio.play().catch(() => {
    /* 文件未上传或浏览器限制 — 忽略 */
  });
}

/** 新一局或离开结算时停止胜利音乐。 */
export function stopVictoryMusic(): void {
  if (!victoryAudio) return;
  victoryAudio.pause();
  victoryAudio.currentTime = 0;
}

/** Announce a discarded tile (报牌). */
export function announceDiscardTile(
  tile: TileType,
  options?: { enabled?: boolean }
): void {
  playTileVoice(tile, options);
}

/** Play a mahjong action sound. Safe to call from store logic. */
export function playMahjongSound(
  type: MahjongActionSound,
  options?: { enabled?: boolean }
): void {
  if (typeof window === "undefined") return;
  if (options?.enabled === false) return;

  const audio = getAudio(type);
  if (!audio) return;

  audio.currentTime = 0;
  void audio.play().catch(() => {
    /* Autoplay or missing file — ignore */
  });
}
