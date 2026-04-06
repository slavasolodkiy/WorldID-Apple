import { useLocation } from "wouter";
import { useGetWallet, useGetMe } from "@workspace/api-client-react";
import { ArrowLeft, Copy, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

export default function Receive() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { data: wallet, isLoading } = useGetWallet();
  const { data: user } = useGetMe();

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Address copied to clipboard",
    });
  };

  return (
    <div className="flex flex-col min-h-full bg-background relative z-50">
      <header className="px-4 py-4 flex items-center gap-4 sticky top-0 bg-background/95 backdrop-blur-md z-10 border-b border-border">
        <button onClick={() => setLocation("/")} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-secondary transition-colors" data-testid="btn-back">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold">Receive</h1>
      </header>

      <main className="flex-1 p-6 flex flex-col items-center justify-center text-center">
        {isLoading ? (
          <Skeleton className="w-64 h-64 rounded-3xl mb-8" />
        ) : (
          <div className="bg-white p-6 rounded-3xl mb-8 shadow-2xl">
            {/* Fake QR code visualization since we can't use qrcode component easily */}
            <div className="w-48 h-48 bg-gray-100 flex items-center justify-center text-black border-4 border-black border-dashed relative">
              <QrCode className="w-32 h-32 opacity-80" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-1 rounded-full">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-600 via-blue-500 to-purple-600" />
              </div>
            </div>
          </div>
        )}

        <h2 className="text-xl font-bold mb-2">Scan to receive WLD</h2>
        <p className="text-muted-foreground text-sm mb-8 px-4">
          Only send WLD, USDC, or ETH on the Optimism network to this address.
        </p>

        <div className="w-full space-y-4">
          <div className="bg-secondary/50 rounded-2xl p-4 border border-border">
            <div className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wider text-left">Your Username</div>
            <div className="flex items-center justify-between">
              {isLoading ? (
                <Skeleton className="h-6 w-32" />
              ) : (
                <div className="font-bold text-lg">@{user?.username}</div>
              )}
              <Button variant="ghost" size="icon" onClick={() => handleCopy(`@${user?.username}`)}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="bg-secondary/50 rounded-2xl p-4 border border-border">
            <div className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wider text-left">Wallet Address</div>
            <div className="flex items-center justify-between gap-4">
              {isLoading ? (
                <Skeleton className="h-6 w-48" />
              ) : (
                <div className="font-mono text-sm truncate">{wallet?.address}</div>
              )}
              <Button variant="ghost" size="icon" onClick={() => handleCopy(wallet?.address || "")} className="shrink-0">
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
