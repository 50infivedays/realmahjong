import { create } from 'zustand';

interface UiState {
  isGameFullscreen: boolean;
  soundEnabled: boolean;
  setGameFullscreen: (isFull: boolean) => void;
  setSoundEnabled: (enabled: boolean) => void;
  toggleSound: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  isGameFullscreen: false,
  soundEnabled: true,
  setGameFullscreen: (isFull) => set({ isGameFullscreen: isFull }),
  setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
  toggleSound: () => set((s) => ({ soundEnabled: !s.soundEnabled })),
}));






