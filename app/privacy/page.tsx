"use client";

import { useLanguageStore } from '@/store/languageStore';
import { dictionaries } from '@/lib/i18n';

export default function PrivacyPage() {
  const { language } = useLanguageStore();
  const t = dictionaries[language];

  return (
    <div className="min-h-screen w-full pt-24 px-4 bg-gradient-to-b from-green-900 to-green-950 text-white">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-yellow-400">{t.privacyTitle}</h1>
        <div className="bg-white/10 p-8 rounded-2xl backdrop-blur-sm border border-white/10">
          <p className="text-lg text-gray-200 leading-relaxed whitespace-pre-wrap">
            {t.privacyContent}
          </p>
        </div>
      </div>
    </div>
  );
}

