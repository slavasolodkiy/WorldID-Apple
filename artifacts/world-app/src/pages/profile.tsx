import { useGetMe, useGetVerificationStatus } from "@workspace/api-client-react";
import { Shield, Settings, Bell, Code, HelpCircle, LogOut, ChevronRight, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export default function Profile() {
  const { data: user, isLoading: isLoadingUser } = useGetMe();
  const { data: status, isLoading: isLoadingStatus } = useGetVerificationStatus();

  return (
    <div className="flex flex-col min-h-full">
      <header className="px-6 py-4 sticky top-0 z-10 bg-background/95 backdrop-blur-md">
        <h1 className="text-xl font-bold tracking-tight">Profile</h1>
      </header>

      <main className="flex-1 px-6 py-4 space-y-8">
        <section className="flex flex-col items-center text-center">
          {isLoadingUser ? (
            <Skeleton className="w-24 h-24 rounded-full mb-4" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-secondary border-2 border-border mb-4 overflow-hidden relative">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.displayName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary text-3xl font-bold">
                  {user?.displayName?.[0] || user?.username?.[0] || "?"}
                </div>
              )}
              {status?.isVerified && (
                <div className="absolute bottom-0 right-0 bg-background rounded-full p-0.5">
                  <Shield className="w-6 h-6 text-primary fill-primary/20" />
                </div>
              )}
            </div>
          )}

          {isLoadingUser ? (
            <>
              <Skeleton className="h-7 w-40 mb-1" />
              <Skeleton className="h-4 w-24 mb-4" />
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold">{user?.displayName || "User"}</h2>
              <p className="text-muted-foreground">@{user?.username}</p>
              
              {user?.bio && <p className="text-sm mt-3 px-4">{user.bio}</p>}
              
              <div className="flex gap-2 mt-4">
                {status?.isVerified ? (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {status.level} Verified
                  </div>
                ) : (
                  <Link href="/verify" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-xs font-bold uppercase tracking-wider border border-border">
                    Unverified
                  </Link>
                )}
                {user?.country && (
                  <div className="px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-xs font-bold uppercase tracking-wider border border-border">
                    {user.country}
                  </div>
                )}
              </div>
            </>
          )}
        </section>

        <section>
          <div className="bg-card rounded-2xl border border-border overflow-hidden divide-y divide-border">
            {[
              { icon: Shield, label: "Security & Privacy", href: "#" },
              { icon: Bell, label: "Notifications", href: "/notifications" },
              { icon: Settings, label: "App Settings", href: "#" },
            ].map((item, i) => (
              <Link key={i} href={item.href} className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors" data-testid={`link-profile-${item.label.toLowerCase().replace(" ", "-")}`}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                    <item.icon className="w-4 h-4 text-foreground" />
                  </div>
                  <span className="font-medium text-[15px]">{item.label}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </section>

        <section>
          <h3 className="text-sm font-bold text-muted-foreground mb-3 px-2 uppercase tracking-wider">Developer</h3>
          <div className="bg-card rounded-2xl border border-border overflow-hidden divide-y divide-border">
            <Link href="#" className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                  <Code className="w-4 h-4 text-foreground" />
                </div>
                <span className="font-medium text-[15px]">Developer Tools</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </Link>
            <Link href="#" className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                  <HelpCircle className="w-4 h-4 text-foreground" />
                </div>
                <span className="font-medium text-[15px]">Help & Support</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </Link>
          </div>
        </section>
        
        <Button variant="ghost" className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 justify-start px-4 h-14 rounded-2xl">
          <LogOut className="w-5 h-5 mr-3" />
          <span className="font-medium text-[15px]">Log Out</span>
        </Button>
      </main>
    </div>
  );
}
