import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, startOfMonth, endOfMonth, getHours, getDay, getDate, isSameDay } from "date-fns";
import { Loader2, ArrowLeft } from "lucide-react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";

export default function DoctorAnalysis() {
  const appointments = useQuery(api.appointments.getDoctorStats);

  if (appointments === undefined) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  // --- Data Processing ---

  // 1. Daily Analysis (Time vs Count for Today/Selected Day) - Let's show "Average Visits by Hour" or "Visits Today"
  // The prompt says "daily date vs time". Let's show distribution of visits by hour of day across all time (or recent).
  // Or better, let's show the last 7 days activity.
  // Let's interpret "daily date vs time" as "Visits per hour" for the current view.
  
  const processHourlyData = () => {
    const hours = Array.from({ length: 24 }, (_, i) => ({ hour: i, high: 0, medium: 0, low: 0, total: 0 }));
    
    appointments.forEach(apt => {
      const date = new Date(apt.date);
      const hour = getHours(date);
      const priority = apt.priority || "low";
      
      if (hours[hour]) {
        hours[hour][priority as "high" | "medium" | "low"]++;
        hours[hour].total++;
      }
    });
    
    return hours.map(h => ({
      name: `${h.hour}:00`,
      high: h.high,
      medium: h.medium,
      low: h.low,
    })).filter(h => h.high + h.medium + h.low > 0); // Only show active hours
  };

  // 2. Weekly Analysis (Day vs Time/Count)
  // "weekly day vs time" -> Let's show visits per day of the week (Mon-Sun)
  const processWeeklyData = () => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const data = days.map(d => ({ name: d, high: 0, medium: 0, low: 0 }));

    appointments.forEach(apt => {
      const date = new Date(apt.date);
      const dayIndex = getDay(date);
      const priority = apt.priority || "low";
      
      data[dayIndex][priority as "high" | "medium" | "low"]++;
    });

    // Rotate to start with Monday if desired, but Sunday start is standard
    return data;
  };

  // 3. Monthly Analysis (Month vs Day)
  // "monthly month vs day" -> Visits per day of the month (1-31)
  const processMonthlyData = () => {
    // Let's aggregate by day of month across all data (or current month?)
    // Usually analytics shows "Current Month" or "Last 30 Days". 
    // Let's do "Last 30 Days" or just "Day of Month" distribution.
    // Let's do Day of Month (1-31) to see busy dates generally.
    const days = Array.from({ length: 31 }, (_, i) => ({ day: i + 1, high: 0, medium: 0, low: 0 }));

    appointments.forEach(apt => {
      const date = new Date(apt.date);
      const day = getDate(date) - 1; // 0-30
      const priority = apt.priority || "low";
      
      if (days[day]) {
        days[day][priority as "high" | "medium" | "low"]++;
      }
    });

    return days.map(d => ({
      name: d.day.toString(),
      high: d.high,
      medium: d.medium,
      low: d.low,
    }));
  };

  const hourlyData = processHourlyData();
  const weeklyData = processWeeklyData();
  const monthlyData = processMonthlyData();

  const chartConfig = {
    high: {
      label: "Severe (High)",
      color: "hsl(var(--destructive))",
    },
    medium: {
      label: "Moderate (Medium)",
      color: "hsl(var(--chart-2))", // Orange-ish usually
    },
    low: {
      label: "Mild (Low)",
      color: "hsl(var(--chart-1))", // Green/Blue usually
    },
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/doctor">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Patient Analytics</h1>
            <p className="text-muted-foreground">Track patient visits and case severity trends.</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Visits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{appointments.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Severe Cases</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {appointments.filter(a => a.priority === "high").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Mild Cases</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {appointments.filter(a => a.priority === "low" || !a.priority).length}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="weekly" className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-[400px]">
            <TabsTrigger value="daily">Daily (Hourly)</TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
          </TabsList>
          
          <TabsContent value="daily" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Visits by Time of Day</CardTitle>
                <CardDescription>Distribution of appointments across hours of the day.</CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                <ChartContainer config={chartConfig} className="h-full w-full">
                  <BarChart data={hourlyData}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Bar dataKey="low" stackId="a" fill="var(--color-low)" radius={[0, 0, 4, 4]} />
                    <Bar dataKey="medium" stackId="a" fill="var(--color-medium)" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="high" stackId="a" fill="var(--color-high)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="weekly" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Weekly Activity</CardTitle>
                <CardDescription>Patient visits by day of the week.</CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                <ChartContainer config={chartConfig} className="h-full w-full">
                  <BarChart data={weeklyData}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Bar dataKey="low" stackId="a" fill="var(--color-low)" radius={[0, 0, 4, 4]} />
                    <Bar dataKey="medium" stackId="a" fill="var(--color-medium)" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="high" stackId="a" fill="var(--color-high)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="monthly" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Overview</CardTitle>
                <CardDescription>Patient visits by day of the month.</CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                <ChartContainer config={chartConfig} className="h-full w-full">
                  <BarChart data={monthlyData}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Bar dataKey="low" stackId="a" fill="var(--color-low)" radius={[0, 0, 4, 4]} />
                    <Bar dataKey="medium" stackId="a" fill="var(--color-medium)" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="high" stackId="a" fill="var(--color-high)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
