import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { format, startOfWeek, addDays, isSameDay, isAfter, startOfDay, endOfDay } from "date-fns";

interface AdherenceCalendarProps {
  medications: any[];
}

export function AdherenceCalendar({ medications }: AdherenceCalendarProps) {
  const today = new Date();
  const start = startOfWeek(today, { weekStartsOn: 0 }); // Sunday
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(start, i));

  const getDayStatus = (date: Date) => {
    if (isAfter(startOfDay(date), startOfDay(today))) return "future";

    const dateStr = format(date, "yyyy-MM-dd");
    let totalExpected = 0;
    let totalTaken = 0;
    let hasActiveMeds = false;

    medications.forEach(med => {
      // Check if active on this date
      const checkTime = endOfDay(date).getTime();
      const startTime = med.startDate;
      const endTime = med.endDate || Infinity;
      
      if (checkTime < startTime) return;
      if (startOfDay(date).getTime() > endTime) return;

      hasActiveMeds = true;
      const expected = med.schedule?.length || 0;
      totalExpected += expected;

      const taken = med.takenLog.filter((log: any) => {
        if (typeof log === 'string') return log === dateStr;
        return log.date === dateStr && log.status === 'taken';
      }).length;
      totalTaken += taken;
    });

    if (!hasActiveMeds) return "none"; 
    if (totalTaken === 0) return "missed";
    if (totalTaken < totalExpected) return "partial";
    return "complete";
  };

  return (
    <Card className="border shadow-sm bg-card/50 backdrop-blur-sm">
      <CardContent className="p-4">
        <div className="flex justify-between items-center">
          {weekDays.map((day, i) => {
            const status = getDayStatus(day);
            const isToday = isSameDay(day, today);
            
            return (
              <div key={i} className="flex flex-col items-center gap-3">
                <span className={cn("text-xs font-medium text-muted-foreground uppercase tracking-wider", isToday && "text-primary font-bold")}>
                  {format(day, "EEE")}
                </span>
                <div className={cn(
                  "h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold transition-all shadow-sm",
                  status === "future" && "bg-muted text-muted-foreground/30 shadow-none",
                  status === "none" && "bg-muted/30 text-muted-foreground/50 shadow-none",
                  status === "missed" && "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800",
                  status === "partial" && "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800",
                  status === "complete" && "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800",
                  isToday && "ring-2 ring-primary ring-offset-2 ring-offset-background scale-110"
                )}>
                  {format(day, "d")}
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-center gap-6 mt-4 text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
            <div className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-green-500"></div> All Taken</div>
            <div className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-yellow-500"></div> Some Missed</div>
            <div className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-red-500"></div> All Missed</div>
        </div>
      </CardContent>
    </Card>
  );
}