import { useState } from "react";
import { useListApps, useGetFeaturedApps, AppCategory } from "@workspace/api-client-react";
import { Search, Star, Users, ExternalLink, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function Apps() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const { data: featuredData, isLoading: isLoadingFeatured } = useGetFeaturedApps();
  const { data: apps, isLoading: isLoadingApps } = useListApps({
    category: activeCategory !== "all" ? (activeCategory as AppCategory) : undefined,
    search: search || undefined,
  });

  const categories = [{ name: "All", slug: "all" }, ...(featuredData?.categories || [])];

  return (
    <div className="flex flex-col min-h-full">
      <header className="px-6 py-4 sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-border/50">
        <h1 className="text-xl font-bold tracking-tight mb-4">Ecosystem</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search dApps..."
            className="pl-9 bg-secondary/50 border-transparent focus-visible:ring-1 focus-visible:ring-primary/50 rounded-xl"
            data-testid="input-search-apps"
          />
        </div>
        
        <div className="flex gap-2 mt-4 overflow-x-auto pb-2 no-scrollbar -mx-6 px-6">
          {categories.map(cat => (
            <button
              key={cat.slug}
              onClick={() => setActiveCategory(cat.slug)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeCategory === cat.slug 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
              data-testid={`tab-category-${cat.slug}`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 px-6 py-6 space-y-8">
        {!search && activeCategory === "all" && (
          <section>
            <h2 className="text-lg font-bold mb-4">Featured</h2>
            <div className="flex overflow-x-auto gap-4 -mx-6 px-6 no-scrollbar snap-x">
              {isLoadingFeatured ? (
                Array.from({ length: 2 }).map((_, i) => (
                  <Skeleton key={i} className="w-[280px] h-[160px] rounded-2xl shrink-0 snap-center" />
                ))
              ) : (
                featuredData?.featured.map(app => (
                  <div key={app.id} className="w-[280px] shrink-0 snap-center rounded-2xl bg-card border border-border p-4 flex flex-col justify-between">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-12 h-12 rounded-xl bg-secondary overflow-hidden shrink-0">
                        {app.iconUrl ? <img src={app.iconUrl} alt={app.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-bold text-lg">{app.name[0]}</div>}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-bold text-base line-clamp-1">{app.name}</h3>
                          {app.isVerified && <ShieldCheck className="w-3.5 h-3.5 text-primary shrink-0" />}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1">{app.category}</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{app.description}</p>
                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {app.userCount.toLocaleString()}</span>
                        {app.rating && <span className="flex items-center gap-1 text-yellow-500"><Star className="w-3 h-3 fill-current" /> {app.rating.toFixed(1)}</span>}
                      </div>
                      <a href={app.url} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-primary/20 transition-colors text-primary">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        <section>
          <h2 className="text-lg font-bold mb-4">{search ? "Search Results" : "All Apps"}</h2>
          <div className="grid grid-cols-1 gap-4">
            {isLoadingApps ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex gap-4 p-3 border border-border rounded-xl">
                  <Skeleton className="w-16 h-16 rounded-xl" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-32 mb-2" />
                    <Skeleton className="h-4 w-full mb-1" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </div>
              ))
            ) : apps?.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No apps found.
              </div>
            ) : (
              apps?.map(app => (
                <a key={app.id} href={app.url} target="_blank" rel="noreferrer" className="flex gap-4 p-3 border border-border bg-card hover:bg-white/5 transition-colors rounded-xl group" data-testid={`card-app-${app.id}`}>
                  <div className="w-16 h-16 rounded-xl bg-secondary overflow-hidden shrink-0 flex items-center justify-center">
                    {app.iconUrl ? <img src={app.iconUrl} alt={app.name} className="w-full h-full object-cover" /> : <span className="font-bold text-xl">{app.name[0]}</span>}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex items-center gap-1.5 mb-1">
                      <h3 className="font-bold text-base truncate group-hover:text-primary transition-colors">{app.name}</h3>
                      {app.isVerified && <ShieldCheck className="w-4 h-4 text-primary shrink-0" />}
                      {app.requiresWorldId && <Badge variant="secondary" className="ml-auto text-[9px] px-1.5 py-0">World ID</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-1 mb-1">{app.description}</p>
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                      <span className="capitalize">{app.category}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {app.userCount.toLocaleString()}</span>
                    </div>
                  </div>
                </a>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
