import { create } from 'zustand';
import { Language } from '@/lib/i18n';

interface LanguageStore {
  language: Language;
  setLanguage: (lang: Language) => void;
}

export const useLanguageStore = create<LanguageStore>((set) => ({
  language: 'zh', // Default, will be updated by useEffect
  setLanguage: (lang) => set({ language: lang }),
}));

