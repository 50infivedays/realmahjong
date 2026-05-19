"use client";

import { MahjongTable } from "@/components/mahjong/Table";
import { useIsMobile } from '@/lib/hooks/useIsMobile';
import { cn } from "@/lib/utils";

export default function GamePage() {
  const isMobile = useIsMobile();

  return (
    <main className={cn(
      "w-full min-h-[100dvh] overflow-hidden mahjong-felt",
      isMobile ? "fixed inset-0 z-50 h-[100dvh]" : "pt-16 h-[100dvh]"
    )}> 
      <MahjongTable />
    </main>
  );
}
