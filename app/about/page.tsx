"use client";

import { useLanguageStore } from '@/store/languageStore';
import { dictionaries } from '@/lib/i18n';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';

export default function AboutPage() {
  const { language } = useLanguageStore();
  const t = dictionaries[language];

  return (
    <div className="min-h-screen w-full pt-24 px-4 bg-gradient-to-b from-green-900 to-green-950 text-white">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-yellow-400">{t.aboutTitle}</h1>
        <div className="bg-white/10 p-8 rounded-2xl backdrop-blur-sm border border-white/10">
          <p className="text-lg text-gray-200 leading-relaxed whitespace-pre-wrap">
            {t.aboutContent}
          </p>
        </div>
        
        <div className="mt-12 flex justify-center">
          <Link href="/">
            <Button 
              size="lg" 
              className="gap-2 bg-yellow-500 hover:bg-yellow-400 text-green-950 font-bold px-8 py-6 text-lg rounded-full shadow-[0_0_20px_rgba(234,179,8,0.3)] transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(234,179,8,0.5)]"
            >
              <Home size={22} />
              {t.navHome}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

