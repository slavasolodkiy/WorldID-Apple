import { useState } from "react";
import { useLocation } from "wouter";
import { useCreateTransaction, useListTokens, useGetWallet } from "@workspace/api-client-react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function Send() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const createTx = useCreateTransaction();
  const { data: tokens, isLoading: isLoadingTokens } = useListTokens();
  const { data: wallet } = useGetWallet();

  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [tokenSymbol, setTokenSymbol] = useState("WLD");
  const [note, setNote] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient || !amount || !tokenSymbol) return;

    try {
      const isAddress = recipient.startsWith("0x");
      await createTx.mutateAsync({
        data: {
          toAddress: isAddress ? recipient : undefined,
          toUsername: !isAddress ? recipient : undefined,
          amount,
          tokenSymbol,
          note: note || undefined,
        }
      });
      
      toast({
        title: "Transaction Sent",
        description: `Successfully sent ${amount} ${tokenSymbol}`,
      });
      setLocation("/");
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "Failed to send transaction",
        variant: "destructive",
      });
    }
  };

  const selectedToken = tokens?.find(t => t.symbol === tokenSymbol);

  return (
    <div className="flex flex-col min-h-full bg-background relative z-50">
      <header className="px-4 py-4 flex items-center gap-4 sticky top-0 bg-background/95 backdrop-blur-md z-10 border-b border-border">
        <button onClick={() => setLocation("/")} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-secondary transition-colors" data-testid="btn-back">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold">Send</h1>
      </header>

      <main className="flex-1 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label>Recipient</Label>
            <Input 
              placeholder="Username or 0x..." 
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="h-14 text-lg bg-secondary/30 border-transparent focus-visible:ring-primary/50"
              required
              data-testid="input-recipient"
            />
          </div>

          <div className="space-y-2">
            <Label>Amount</Label>
            <div className="relative">
              <Input 
                type="number"
                step="0.000001"
                placeholder="0.00" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-16 text-3xl font-bold pr-24 bg-secondary/30 border-transparent focus-visible:ring-primary/50"
                required
                data-testid="input-amount"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                <Select value={tokenSymbol} onValueChange={setTokenSymbol}>
                  <SelectTrigger className="w-[100px] h-12 bg-card border-border">
                    <SelectValue placeholder="Token" />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingTokens ? (
                      <div className="p-2 space-y-2">
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                      </div>
                    ) : (
                      tokens?.map(t => (
                        <SelectItem key={t.symbol} value={t.symbol}>
                          {t.symbol}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {selectedToken && (
              <p className="text-xs text-muted-foreground px-1">
                Balance: {selectedToken.balance} {selectedToken.symbol}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Note (optional)</Label>
            <Input 
              placeholder="What's this for?" 
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="h-12 bg-secondary/30 border-transparent focus-visible:ring-primary/50"
            />
          </div>

          <div className="pt-8">
            <Button 
              type="submit" 
              className="w-full h-14 text-lg font-bold rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={createTx.isPending || !recipient || !amount}
              data-testid="button-send"
            >
              {createTx.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "Review Send"
              )}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
