import { BottomNav } from "./BottomNav";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-black flex justify-center text-foreground font-sans">
      <div className="w-full max-w-[430px] relative bg-background shadow-2xl flex flex-col min-h-[100dvh]">
        <main className="flex-1 pb-20 overflow-x-hidden relative z-0">
          {children}
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
