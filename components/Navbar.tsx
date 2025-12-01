"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Languages, Home, Gamepad2 } from 'lucide-react';
import { useLanguageStore } from '@/store/languageStore';
import { dictionaries } from '@/lib/i18n';
import { cn } from '@/lib/utils';

import { useIsMobile } from '@/lib/hooks/useIsMobile';

export const Navbar = () => {
    const isMobile = useIsMobile();
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
    const isGamePage = pathname === '/game';

    // Don't show navbar on mobile when in game page
    const shouldHideNavbar = isGamePage && isMobile;

    if (shouldHideNavbar) return null;

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 h-16 bg-green-900/95 backdrop-blur-sm border-b border-green-800 shadow-lg flex items-center justify-between px-4 sm:px-8 text-white">
            {/* Left: Logo and Title */}
            <Link
                href="/"
                className="flex items-center gap-3 rounded-lg px-2 py-1 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-300"
                aria-label="Back to RealMahjong home"
            >
                <div className="relative w-8 h-8 sm:w-10 sm:h-10">
                    <Image 
                        src="/icon.png" 
                        alt="RealMahjong Logo" 
                        fill 
                        className="object-contain"
                        sizes="40px"
                        priority
                    />
                </div>
                <span className="text-xl sm:text-2xl font-bold tracking-tight bg-gradient-to-r from-yellow-400 to-yellow-200 bg-clip-text text-transparent">
                    RealMahjong
                </span>
            </Link>

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
