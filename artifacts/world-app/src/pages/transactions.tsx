import { useState } from "react";
import { useLocation } from "wouter";
import { useListTransactions, ListTransactionsType } from "@workspace/api-client-react";
import { ArrowLeft, ArrowUpRight, ArrowDownLeft, Gift, ArrowRightLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export default function Transactions() {
  const [, setLocation] = useLocation();
  const [activeType, setActiveType] = useState<string>("all");
  
  const { data: transactions, isLoading } = useListTransactions({
    type: activeType !== "all" ? (activeType as ListTransactionsType) : undefined
  });

  const getIcon = (type: string) => {
    switch(type) {
      case 'send': return <ArrowUpRight className="w-5 h-5 text-foreground" />;
      case 'receive': return <ArrowDownLeft className="w-5 h-5 text-foreground" />;
      case 'grant': return <Gift className="w-5 h-5 text-primary" />;
      case 'swap': return <ArrowRightLeft className="w-5 h-5 text-foreground" />;
      default: return <ArrowRightLeft className="w-5 h-5 text-foreground" />;
    }
  };

  const formatUsd = (val: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  return (
    <div className="flex flex-col min-h-full bg-background relative z-50">
      <header className="px-4 py-4 flex items-center gap-4 sticky top-0 bg-background/95 backdrop-blur-md z-10 border-b border-border">
        <button onClick={() => setLocation("/")} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-secondary transition-colors" data-testid="btn-back">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold">Transactions</h1>
      </header>

      <div className="px-6 py-4 overflow-x-auto no-scrollbar flex gap-2">
        {['all', 'send', 'receive', 'grant', 'swap'].map(type => (
          <button
            key={type}
            onClick={() => setActiveType(type)}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-medium capitalize whitespace-nowrap transition-colors",
              activeType === type ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            )}
          >
            {type}
          </button>
        ))}
      </div>

      <main className="flex-1 px-6 pb-6 space-y-4">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <Skeleton className="w-12 h-12 rounded-full" />
                <div>
                  <Skeleton className="w-24 h-5 mb-1" />
                  <Skeleton className="w-16 h-4" />
                </div>
              </div>
              <div className="text-right">
                <Skeleton className="w-20 h-5 mb-1 ml-auto" />
                <Skeleton className="w-12 h-4 ml-auto" />
              </div>
            </div>
          ))
        ) : transactions?.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No transactions found.
          </div>
        ) : (
          transactions?.map(tx => (
            <div key={tx.id} className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center",
                  tx.type === 'grant' ? "bg-primary/10" : "bg-secondary"
                )}>
                  {getIcon(tx.type)}
                </div>
                <div>
                  <h4 className="font-bold text-[15px] capitalize">
                    {tx.type === 'send' ? `Sent to ${tx.toUsername || 'Address'}` : 
                     tx.type === 'receive' ? `Received from ${tx.fromUsername || 'Address'}` : 
                     tx.type === 'grant' ? 'WLD Grant' : 'Swapped'}
                  </h4>
                  <p className="text-[13px] text-muted-foreground">
                    {format(new Date(tx.createdAt), 'MMM d, h:mm a')}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <h4 className={cn(
                  "font-bold text-[15px]",
                  tx.type === 'receive' || tx.type === 'grant' ? "text-green-400" : ""
                )}>
                  {tx.type === 'receive' || tx.type === 'grant' ? "+" : "-"}{tx.amount} {tx.tokenSymbol}
                </h4>
                <p className="text-[13px] text-muted-foreground">
                  {formatUsd(tx.amountUsd)}
                </p>
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  );
}
