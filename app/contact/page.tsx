"use client";

import { useLanguageStore } from '@/store/languageStore';
import { dictionaries } from '@/lib/i18n';
import { Mail } from 'lucide-react';

export default function ContactPage() {
  const { language } = useLanguageStore();
  const t = dictionaries[language];

  return (
    <div className="min-h-screen w-full pt-24 px-4 bg-gradient-to-b from-green-900 to-green-950 text-white">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-yellow-400">{t.contactTitle}</h1>
        <div className="bg-white/10 p-8 rounded-2xl backdrop-blur-sm border border-white/10">
          <p className="text-lg text-gray-200 mb-6 leading-relaxed">
            {t.contactContent}
          </p>
          <div className="flex items-center gap-3 text-lg sm:text-2xl font-mono text-green-300 bg-black/30 p-4 rounded-lg break-all">
             <Mail className="text-yellow-400 shrink-0" />
             <a href="mailto:realmahjong@proton.me" className="hover:text-white transition-colors">
                realmahjong@proton.me
             </a>
          </div>
        </div>
      </div>
    </div>
  );
}

