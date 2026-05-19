"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useLanguageStore } from "@/store/languageStore";
import { dictionaries } from "@/lib/i18n";
import { PlayCircle, Sparkles } from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";
import { springSmooth } from "@/lib/motion";

const previewTiles = [
  { file: "Man1", label: "Character 1" },
  { file: "Pin5", label: "Dot 5" },
  { file: "Sou9", label: "Bamboo 9" },
  { file: "Ton", label: "East wind" },
  { file: "Chun", label: "Red dragon" },
  { file: "Haku", label: "White dragon" },
] as const;

export default function HomeClient() {
  const { language } = useLanguageStore();
  const t = dictionaries[language];

  return (
    <main className="relative min-h-[100dvh] w-full pt-16 flex flex-col overflow-hidden text-white">
      <motion.div
        className="absolute inset-0 mahjong-felt -z-20"
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      />
      <div className="mahjong-felt-vignette absolute inset-0 -z-10 pointer-events-none" aria-hidden />

      <motion.div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-[var(--mahjong-gold)]/10 blur-3xl pointer-events-none" aria-hidden />
      <motion.div
        className="absolute bottom-32 -left-16 w-56 h-56 rounded-full bg-white/5 blur-2xl pointer-events-none"
        aria-hidden
        animate={{ y: [0, -12, 0], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="flex-1 grid lg:grid-cols-[1.1fr_0.9fr] max-w-7xl mx-auto w-full px-4 sm:px-8 gap-12 items-center py-12 lg:py-20">
        <div className="flex flex-col text-left">
          <Reveal>
            <p className="inline-flex items-center gap-2 text-sm font-medium text-[var(--mahjong-gold-muted)] mb-6 tracking-wide uppercase">
              <Sparkles size={16} className="text-[var(--mahjong-gold)]" aria-hidden />
              {t.homeSubtitle}
            </p>
          </Reveal>

          <Reveal delay={0.08}>
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-black tracking-tighter leading-[0.95] mb-6">
              <span className="block text-[var(--mahjong-gold)]">{t.homeTitle}</span>
            </h1>
          </Reveal>

          <Reveal delay={0.16}>
            <p className="text-lg sm:text-xl text-white/75 max-w-[65ch] leading-relaxed mb-10">
              {t.homeDescription}
            </p>
          </Reveal>

          <Reveal delay={0.24}>
            <Link href="/game">
              <Button
                size="lg"
                className="text-lg px-10 py-7 rounded-full bg-[var(--mahjong-gold)] hover:opacity-90 text-green-950 font-bold shadow-[0_12px_40px_oklch(0.75_0.12_85/0.35)] active:scale-[0.98] transition-transform"
              >
                <PlayCircle className="mr-2 h-6 w-6" aria-hidden />
                {t.homeStartBtn}
              </Button>
            </Link>
          </Reveal>
        </div>

        <motion.div
          className="relative hidden lg:flex items-center justify-center"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ ...springSmooth, delay: 0.2 }}
          aria-hidden
        >
          <motion.div
            className="relative w-full max-w-md aspect-square mahjong-glass rounded-[2.5rem] p-10 flex flex-col justify-between border border-white/10"
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          >
            <motion.div className="flex justify-between items-start" aria-hidden>
              <span className="font-display text-sm text-[var(--mahjong-gold)] tracking-tight">
                {t.windEast}
              </span>
              <span className="text-xs text-white/50 tabular-nums">136</span>
            </motion.div>
            <motion.div
              className="mx-auto grid grid-cols-3 gap-2"
              variants={{
                visible: { transition: { staggerChildren: 0.06 } },
              }}
              initial="hidden"
              animate="visible"
            >
              {previewTiles.map(({ file, label }) => (
                <motion.div
                  key={file}
                  variants={{
                    hidden: { opacity: 0, y: 12 },
                    visible: { opacity: 1, y: 0 },
                  }}
                  className="w-14 h-[4.5rem] mahjong-tile-face rounded-md p-1 shadow-md"
                >
                  <img
                    src={`/tiles/${file}.svg`}
                    alt={label}
                    width={56}
                    height={72}
                    className="w-full h-full object-contain"
                  />
                </motion.div>
              ))}
            </motion.div>
            <p className="text-center text-xs text-white/40 tracking-widest uppercase">
              {t.navGame}
            </p>
          </motion.div>
        </motion.div>
      </div>

      <footer className="py-8 text-center text-white/40 text-sm flex flex-col gap-4 border-t border-white/5">
        <nav className="flex justify-center gap-6" aria-label="Footer">
          <Link href="/about" className="hover:text-[var(--mahjong-gold-muted)] transition-colors">
            {t.navAbout}
          </Link>
          <Link href="/contact" className="hover:text-[var(--mahjong-gold-muted)] transition-colors">
            {t.navContact}
          </Link>
          <Link href="/privacy" className="hover:text-[var(--mahjong-gold-muted)] transition-colors">
            {t.navPrivacy}
          </Link>
        </nav>
        <p>© {new Date().getFullYear()} {t.footerCopyright}</p>
      </footer>
    </main>
  );
}
