import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Bell, Check, Trash2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router";

export function NotificationsPopover() {
  const notifications = useQuery(api.notifications.list);
  const unreadCount = useQuery(api.notifications.unreadCount);
  const markRead = useMutation(api.notifications.markRead);
  const markAllRead = useMutation(api.notifications.markAllRead);
  const clearAll = useMutation(api.notifications.clearAll);
  const navigate = useNavigate();

  const handleNotificationClick = async (n: any) => {
    if (!n.read) {
      await markRead({ notificationId: n._id });
    }
    if (n.link) {
      navigate(n.link);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount !== undefined && unreadCount > 0 && (
            <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-red-600 border-2 border-background" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h4 className="font-semibold">Notifications</h4>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => markAllRead()} title="Mark all read">
              <Check className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => clearAll()} title="Clear all">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <ScrollArea className="h-[300px]">
          {notifications?.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-4 text-muted-foreground">
              <Bell className="h-8 w-8 mb-2 opacity-20" />
              <p className="text-sm">No notifications</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications?.map((n) => (
                <button
                  key={n._id}
                  className={cn(
                    "flex flex-col items-start gap-1 p-4 text-left hover:bg-accent transition-colors border-b last:border-0",
                    !n.read && "bg-accent/50"
                  )}
                  onClick={() => handleNotificationClick(n)}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className={cn("text-sm font-medium", !n.read && "text-primary")}>{n.title}</span>
                    <span className="text-[10px] text-muted-foreground">{formatDistanceToNow(n.createdAt, { addSuffix: true })}</span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{n.message}</p>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
