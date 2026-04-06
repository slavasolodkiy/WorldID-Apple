import { useGetWallet, useListTokens, useGetDashboardStats, useGetTokenPrices } from "@workspace/api-client-react";
import { AreaChart, Area, ResponsiveContainer, YAxis } from "recharts";
import { ArrowUpRight, ArrowDownLeft, CreditCard, ArrowRightLeft, Bell, History } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

function OrbIcon() {
  return (
    <div className="w-10 h-10 rounded-full relative overflow-hidden shrink-0">
      <div className="absolute inset-0 bg-gradient-to-tr from-cyan-600 via-blue-500 to-purple-600 animate-spin-slow opacity-80" />
      <div className="absolute inset-0.5 rounded-full bg-black/40 backdrop-blur-[2px]" />
      <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-xs">WLD</div>
    </div>
  );
}

export default function Home() {
  const { data: stats, isLoading: isLoadingStats } = useGetDashboardStats();
  const { data: wallet, isLoading: isLoadingWallet } = useGetWallet();
  const { data: tokens, isLoading: isLoadingTokens } = useListTokens();
  const { data: wldPrices } = useGetTokenPrices({ symbol: "WLD", period: "1w" });

  const formatUsd = (val: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  return (
    <div className="flex flex-col min-h-full pb-8">
      {/* Header */}
      <header className="px-6 py-4 flex justify-between items-center sticky top-0 z-10 bg-background/80 backdrop-blur-md">
        <h1 className="text-xl font-bold tracking-tight">Wallet</h1>
        <div className="flex gap-4">
          <Link href="/transactions" className="text-muted-foreground hover:text-foreground">
            <History className="w-6 h-6" />
          </Link>
          <Link href="/notifications" className="text-muted-foreground hover:text-foreground relative">
            <Bell className="w-6 h-6" />
            {stats?.unreadNotifications ? (
              <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-primary rounded-full border-2 border-background" />
            ) : null}
          </Link>
        </div>
      </header>

      {/* Main Balance */}
      <section className="px-6 pt-6 pb-8 flex flex-col items-center text-center">
        <p className="text-muted-foreground text-sm font-medium mb-2">Total Balance</p>
        {isLoadingStats ? (
          <Skeleton className="h-12 w-48 mb-2" />
        ) : (
          <h2 className="text-[2.5rem] leading-none font-bold tracking-tighter mb-2">
            {formatUsd(stats?.totalValueUsd || 0)}
          </h2>
        )}
        
        {isLoadingStats ? (
          <Skeleton className="h-6 w-24" />
        ) : (
          <div className={cn(
            "text-sm font-medium flex items-center gap-1 px-3 py-1 rounded-full",
            (stats?.wldPriceChange24h || 0) >= 0 ? "text-green-400 bg-green-400/10" : "text-red-400 bg-red-400/10"
          )}>
            {(stats?.wldPriceChange24h || 0) >= 0 ? "+" : ""}
            {stats?.wldPriceChange24h?.toFixed(2)}%
          </div>
        )}
      </section>

      {/* Action Buttons */}
      <section className="px-6 py-4 grid grid-cols-4 gap-4">
        {[
          { icon: ArrowUpRight, label: "Send", href: "/wallet/send" },
          { icon: ArrowDownLeft, label: "Receive", href: "/wallet/receive" },
          { icon: CreditCard, label: "Buy", href: "#" },
          { icon: ArrowRightLeft, label: "Swap", href: "#" },
        ].map((action, i) => (
          <Link key={i} href={action.href} className="flex flex-col items-center gap-2 group">
            <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center text-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <action.icon className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-medium text-muted-foreground group-hover:text-foreground">{action.label}</span>
          </Link>
        ))}
      </section>

      {/* WLD Card */}
      <section className="px-6 py-6">
        <div className="bg-card border border-border rounded-3xl p-5 relative overflow-hidden group hover:border-primary/50 transition-colors">
          <div className="absolute -right-20 -top-20 w-40 h-40 bg-primary/10 rounded-full blur-3xl" />
          
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-3">
              <OrbIcon />
              <div>
                <h3 className="font-bold text-lg">Worldcoin</h3>
                <p className="text-muted-foreground text-sm">WLD</p>
              </div>
            </div>
            <div className="text-right">
              {isLoadingWallet ? (
                <Skeleton className="h-6 w-20 mb-1" />
              ) : (
                <h3 className="font-bold text-lg">{wallet?.wldBalance}</h3>
              )}
              {isLoadingStats ? (
                <Skeleton className="h-4 w-16 ml-auto" />
              ) : (
                <p className="text-muted-foreground text-sm">
                  {formatUsd(stats?.wldPriceUsd || 0)}
                </p>
              )}
            </div>
          </div>

          <div className="h-[60px] w-full mt-2">
            {wldPrices?.dataPoints ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={wldPrices.dataPoints}>
                  <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <YAxis domain={['auto', 'auto']} hide />
                  <Area 
                    type="monotone" 
                    dataKey="price" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorPrice)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <Skeleton className="h-full w-full opacity-20" />
            )}
          </div>
        </div>
      </section>

      {/* Tokens List */}
      <section className="px-6 py-4 flex-1">
        <h3 className="font-bold text-lg mb-4">Tokens</h3>
        <div className="flex flex-col gap-4">
          {isLoadingTokens ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div>
                    <Skeleton className="w-20 h-5 mb-1" />
                    <Skeleton className="w-10 h-4" />
                  </div>
                </div>
                <div className="text-right">
                  <Skeleton className="w-16 h-5 mb-1 ml-auto" />
                  <Skeleton className="w-12 h-4 ml-auto" />
                </div>
              </div>
            ))
          ) : (
            tokens?.map((token) => (
              <div key={token.symbol} className="flex items-center justify-between p-2 -mx-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center overflow-hidden">
                    {token.iconUrl ? (
                      <img src={token.iconUrl} alt={token.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs font-bold">{token.symbol[0]}</span>
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-[15px]">{token.name}</h4>
                    <p className="text-muted-foreground text-[13px]">{token.symbol}</p>
                  </div>
                </div>
                <div className="text-right">
                  <h4 className="font-bold text-[15px]">{formatUsd(token.balanceUsd)}</h4>
                  <p className={cn(
                    "text-[13px] font-medium",
                    token.priceChange24h >= 0 ? "text-green-400" : "text-red-400"
                  )}>
                    {token.priceChange24h >= 0 ? "+" : ""}{token.priceChange24h.toFixed(2)}%
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
