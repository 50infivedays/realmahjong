import { create } from 'zustand';

interface UiState {
  isGameFullscreen: boolean;
  setGameFullscreen: (isFull: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  isGameFullscreen: false,
  setGameFullscreen: (isFull) => set({ isGameFullscreen: isFull }),
}));

