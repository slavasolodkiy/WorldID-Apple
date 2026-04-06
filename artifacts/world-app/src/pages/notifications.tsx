import { useLocation } from "wouter";
import { useListNotifications, useMarkNotificationRead } from "@workspace/api-client-react";
import { ArrowLeft, Bell, Shield, Gift, ArrowRightLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

export default function Notifications() {
  const [, setLocation] = useLocation();
  const { data: notifications, isLoading, refetch } = useListNotifications();
  const markRead = useMarkNotificationRead();

  const handleNotificationClick = async (id: string, isRead: boolean) => {
    if (!isRead) {
      try {
        await markRead.mutateAsync({ id });
        refetch();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const getIcon = (type: string) => {
    switch(type) {
      case 'transaction': return <ArrowRightLeft className="w-4 h-4 text-foreground" />;
      case 'grant': return <Gift className="w-4 h-4 text-primary" />;
      case 'verification': return <Shield className="w-4 h-4 text-green-400" />;
      default: return <Bell className="w-4 h-4 text-foreground" />;
    }
  };

  return (
    <div className="flex flex-col min-h-full bg-background relative z-50">
      <header className="px-4 py-4 flex items-center gap-4 sticky top-0 bg-background/95 backdrop-blur-md z-10 border-b border-border">
        <button onClick={() => setLocation("/")} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-secondary transition-colors" data-testid="btn-back">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold">Notifications</h1>
      </header>

      <main className="flex-1">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                <div className="flex-1 space-y-2 py-1">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-20 mt-2" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications?.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-20 px-6">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
              <Bell className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-bold mb-2">All caught up</h2>
            <p className="text-muted-foreground text-sm">
              You don't have any new notifications at the moment.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {notifications?.map(notif => (
              <div 
                key={notif.id} 
                onClick={() => handleNotificationClick(notif.id, notif.isRead)}
                className={cn(
                  "flex gap-4 p-4 transition-colors cursor-pointer",
                  !notif.isRead ? "bg-primary/5" : "hover:bg-white/5"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                  notif.type === 'grant' || notif.type === 'verification' ? "bg-primary/10" : "bg-secondary"
                )}>
                  {getIcon(notif.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className={cn("font-bold text-[15px]", !notif.isRead && "text-primary")}>{notif.title}</h4>
                    {!notif.isRead && <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />}
                  </div>
                  <p className="text-[14px] text-muted-foreground leading-snug mb-2">{notif.body}</p>
                  <p className="text-[11px] text-muted-foreground/60 font-medium">
                    {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
