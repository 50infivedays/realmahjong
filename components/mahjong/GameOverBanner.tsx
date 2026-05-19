"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type GameOverVariant = "win" | "lose" | "draw";

const SPARKLE_POSITIONS = [
  { top: "12%", left: "8%", delay: "0s" },
  { top: "18%", right: "10%", delay: "0.4s" },
  { bottom: "22%", left: "14%", delay: "0.8s" },
  { bottom: "16%", right: "12%", delay: "1.1s" },
  { top: "42%", left: "4%", delay: "0.6s" },
  { top: "38%", right: "6%", delay: "1.4s" },
] as const;

interface GameOverBannerProps {
  variant: GameOverVariant;
  title: string;
  subtitle?: string;
  className?: string;
  /** Use wider CJK typography when true (e.g. zh locale). */
  isCjk?: boolean;
}

export function GameOverBanner({
  variant,
  title,
  subtitle,
  className,
  isCjk = /[\u4e00-\u9fff]/.test(title),
}: GameOverBannerProps) {
  const isWin = variant === "win";
  const isLose = variant === "lose";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "game-over-banner",
        isWin && "game-over-banner-win",
        isLose && "game-over-banner-lose",
        variant === "draw" && "game-over-banner-draw",
        className
      )}
    >
      {isWin &&
        SPARKLE_POSITIONS.map((pos, i) => (
          <span
            key={i}
            className="game-over-sparkle"
            style={{
              top: "top" in pos ? pos.top : undefined,
              left: "left" in pos ? pos.left : undefined,
              right: "right" in pos ? pos.right : undefined,
              bottom: "bottom" in pos ? pos.bottom : undefined,
              animationDelay: pos.delay,
            }}
            aria-hidden
          />
        ))}

      {isWin && (
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-amber-200/40 to-transparent"
          aria-hidden
        />
      )}

      {isLose && (
        <motion.div
          className="pointer-events-none absolute inset-0 opacity-30"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          aria-hidden
        >
          <motion.div
            className="absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-400/25 blur-3xl"
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
      )}

      <h2
        className={cn(
          "game-over-title game-over-title-animate",
          isCjk ? "game-over-title-zh" : "font-display uppercase",
          isWin && "game-over-title-win",
          isLose && "game-over-title-lose",
          variant === "draw" && "game-over-title-draw"
        )}
      >
        {title}
      </h2>

      {subtitle && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25, duration: 0.35 }}
          className={cn(
            "relative z-10 mt-3 text-center text-sm font-medium sm:text-base",
            isWin && "text-red-900/70",
            isLose && "text-blue-900/65"
          )}
        >
          {subtitle}
        </motion.p>
      )}
    </motion.div>
  );
}
