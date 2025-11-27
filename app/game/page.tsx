import { MahjongTable } from "@/components/mahjong/Table";

export default function GamePage() {
  return (
    <main className="h-screen w-full pt-16 overflow-hidden"> {/* Fixed height minus padding to prevent scrolling */}
      <MahjongTable />
    </main>
  );
}
