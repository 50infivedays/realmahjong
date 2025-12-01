"use client";

import { MahjongTable } from "@/components/mahjong/Table";
import { useIsMobile } from '@/lib/hooks/useIsMobile';
import { cn } from "@/lib/utils";

export default function GamePage() {
  const isMobile = useIsMobile();

  return (
    <main className={cn(
      "w-full h-full overflow-hidden bg-green-800",
      isMobile ? "fixed inset-0 z-50" : "pt-16 h-screen"
    )}> 
      <MahjongTable />
    </main>
  );
}
