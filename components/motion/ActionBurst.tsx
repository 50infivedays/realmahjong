"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import { springBouncy } from "@/lib/motion";

type ActionBurstProps = {
  label: string;
  positionClass: string;
  visible: boolean;
};

export function ActionBurst({ label, positionClass, visible }: ActionBurstProps) {
  const reduced = useReducedMotion();

  return (
    <AnimatePresence>
      {visible && label ? (
        <motion.div
          key={label}
          className={`absolute ${positionClass} z-50 pointer-events-none`}
          initial={reduced ? { opacity: 1 } : { opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.85 }}
          transition={springBouncy}
        >
          <motion.div
            className="font-display text-5xl sm:text-6xl font-black text-[var(--mahjong-gold)] tracking-tight px-8 py-4 rounded-2xl bg-black/75 backdrop-blur-md border-2 border-[var(--mahjong-gold-muted)]/40 shadow-[0_0_40px_oklch(0.75_0.12_85/0.35)]"
            animate={
              reduced
                ? undefined
                : {
                    scale: [1, 1.06, 1],
                  }
            }
            transition={
              reduced
                ? undefined
                : { duration: 0.5, repeat: 2, repeatType: "reverse" }
            }
          >
            {label}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
