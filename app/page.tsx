"use client";

import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { useLanguageStore } from '@/store/languageStore';
import { dictionaries } from '@/lib/i18n';
import { PlayCircle } from 'lucide-react';

export default function Home() {
  const { language } = useLanguageStore();
  const t = dictionaries[language];

  return (
    <main className="min-h-screen w-full pt-16 flex flex-col bg-gradient-to-b from-green-900 to-green-950 text-white">
      <div className="flex-1 flex flex-col items-center justify-center px-4 text-center">
        
        <div className="max-w-3xl space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-700">
          <h1 className="text-5xl sm:text-7xl font-black tracking-tight">
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-500 to-yellow-300 mb-2">
              {t.homeTitle}
            </span>
            <span className="text-2xl sm:text-4xl font-medium text-green-300/80">
              {t.homeSubtitle}
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
            {t.homeDescription}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
            <Link href="/game">
              <Button size="lg" className="text-xl px-8 py-8 rounded-full bg-yellow-500 hover:bg-yellow-400 text-green-950 font-bold shadow-[0_0_30px_rgba(234,179,8,0.3)] transition-all hover:scale-105 hover:shadow-[0_0_50px_rgba(234,179,8,0.5)]">
                <PlayCircle className="mr-2 h-6 w-6" />
                {t.homeStartBtn}
              </Button>
            </Link>
          </div>
        </div>

      </div>
      
      <footer className="py-6 text-center text-green-600/60 text-sm">
        © {new Date().getFullYear()} {t.footerCopyright}
      </footer>
    </main>
  );
}
