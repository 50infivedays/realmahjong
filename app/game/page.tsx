import { MahjongTable } from "@/components/mahjong/Table";

export default function GamePage() {
  return (
    // Use md:pt-16 for desktop to account for navbar
    // Use fixed inset-0 z-50 on mobile to cover everything (fullscreen)
    <main className="fixed inset-0 z-50 md:static md:z-auto w-full h-full md:h-screen md:pt-16 overflow-hidden bg-green-800"> 
      <MahjongTable />
    </main>
  );
}
