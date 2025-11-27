"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Languages, Home, Gamepad2 } from 'lucide-react';
import { useLanguageStore } from '@/store/languageStore';
import { dictionaries } from '@/lib/i18n';

export const Navbar = () => {
    const { language, setLanguage } = useLanguageStore();
    const pathname = usePathname();

    React.useEffect(() => {
        const browserLang = navigator.language.toLowerCase();
        if (browserLang.startsWith('zh')) {
          setLanguage('zh');
        } else {
          setLanguage('en');
        }
    }, [setLanguage]);
    
    const toggleLanguage = () => {
        setLanguage(language === 'en' ? 'zh' : 'en');
    };

    const t = dictionaries[language];

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 h-16 bg-green-900/95 backdrop-blur-sm border-b border-green-800 shadow-lg flex items-center justify-between px-4 sm:px-8 text-white">
            {/* Left: Logo and Title */}
            <div className="flex items-center gap-3">
                <div className="relative w-8 h-8 sm:w-10 sm:h-10">
                    <Image 
                        src="/icon.png" 
                        alt="RealMahjong Logo" 
                        fill 
                        className="object-contain"
                    />
                </div>
                <span className="text-xl sm:text-2xl font-bold tracking-tight bg-gradient-to-r from-yellow-400 to-yellow-200 bg-clip-text text-transparent">
                    RealMahjong
                </span>
            </div>

            {/* Right: Navigation and Settings */}
            <div className="flex items-center gap-2 sm:gap-4">
                <Link href="/">
                    <Button 
                        variant={pathname === "/" ? "secondary" : "ghost"}
                        className={`gap-2 ${pathname === "/" ? "bg-green-800 text-yellow-300 hover:bg-green-700" : "text-gray-200 hover:bg-green-800 hover:text-white"}`}
                    >
                        <Home size={18} />
                        <span className="hidden sm:inline">{t.navHome}</span>
                    </Button>
                </Link>
                
                <Link href="/game">
                    <Button 
                        variant={pathname === "/game" ? "secondary" : "ghost"}
                        className={`gap-2 ${pathname === "/game" ? "bg-green-800 text-yellow-300 hover:bg-green-700" : "text-gray-200 hover:bg-green-800 hover:text-white"}`}
                    >
                        <Gamepad2 size={18} />
                        <span className="hidden sm:inline">{t.navGame}</span>
                    </Button>
                </Link>

                <div className="w-px h-6 bg-green-700 mx-1" />

                <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={toggleLanguage}
                    className="rounded-full hover:bg-green-800 text-yellow-100 hover:text-yellow-300 transition-colors"
                    title="Switch Language"
                >
                    <Languages size={20} />
                </Button>
            </div>
        </nav>
    );
};
