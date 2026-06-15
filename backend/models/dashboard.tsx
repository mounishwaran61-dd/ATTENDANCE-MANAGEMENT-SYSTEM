import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAMS, currentUser } from "@/lib/ams-store";
import { Users, GraduationCap, CheckCircle2, XCircle, Clock, TrendingUp } from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from "recharts";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — AMS" }] }),
  component: Dashboard,
});

function Dashboard() {
  return (
    <AppShell title="Dashboard">
      <DashboardContent />
    </AppShell>
  );
}

function DashboardContent() {
  const students = useAMS((d) => d.students);
  const staff = useAMS((d) => d.staff);
  const attendance = useAMS((d) => d.attendance);
  const classes = useAMS((d) => d.classes);
  const activity = useAMS((d) => d.activity);
  const me = currentUser()!;

  const today = new Date().toISOString().slice(0, 10);
  const todayRecords = attendance.filter((a) => a.date === today);
  const presentToday = todayRecords.filter((a) => a.status === "present").length;
  const lateToday = todayRecords.filter((a) => a.status === "late").length;
  const absentToday = todayRecords.filter((a) => a.status === "absent").length;
  const totalToday = todayRecords.length || students.length;

  const trend = useMemo(() => {
    const map = new Map<string, { date: string; present: number; absent: number; late: number }>();
    attendance.forEach((a) => {
      const m = map.get(a.date) ?? { date: a.date, present: 0, absent: 0, late: 0 };
      m[a.status]++;
      map.set(a.date, m);
    });
    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date)).slice(-10).map((d) => ({
      ...d,
      label: d.date.slice(5),
    }));
  }, [attendance]);

  const classBreakdown = classes.map((c) => {
    const list = attendance.filter((a) => a.classId === c.id);
    const present = list.filter((a) => a.status !== "absent").length;
    const pct = list.length ? Math.round((present / list.length) * 100) : 0;
    return { name: c.name, pct, total: list.length };
  });

  const pieData = [
    { name: "Present", value: presentToday, color: "var(--color-success)" },
    { name: "Late", value: lateToday, color: "var(--color-warning)" },
    { name: "Absent", value: absentToday, color: "var(--color-destructive)" },
  ];

  const overallPct = attendance.length
    ? Math.round((attendance.filter((a) => a.status !== "absent").length / attendance.length) * 100)
    : 0;

  const stats = [
    { label: "Total Students", value: students.length, icon: GraduationCap, tone: "bg-primary/10 text-primary" },
    { label: "Total Staff", value: staff.length, icon: Users, tone: "bg-chart-5/10 text-chart-5" },
    { label: "Present Today", value: presentToday, icon: CheckCircle2, tone: "bg-success/10 text-success" },
    { label: "Absent Today", value: absentToday, icon: XCircle, tone: "bg-destructive/10 text-destructive" },
  ];

  return (
    <>
      <div className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">Welcome back,</p>
        <h2 className="text-2xl font-semibold tracking-tight">{me.name}</h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="overflow-hidden">
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`size-12 rounded-xl grid place-items-center ${s.tone}`}>
                <s.icon className="size-6" />
              </div>
              <div>
                <div className="text-2xl font-semibold tracking-tight">{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Attendance Trend</CardTitle>
              <CardDescription>Last 10 working days</CardDescription>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <TrendingUp className="size-4 text-success" />
              <span className="font-medium">{overallPct}%</span>
              <span className="text-muted-foreground">overall</span>
            </div>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ left: -10, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="gPresent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-success)" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="var(--color-success)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gAbsent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-destructive)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--color-destructive)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="var(--color-muted-foreground)" />
                <YAxis tick={{ fontSize: 12 }} stroke="var(--color-muted-foreground)" />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--color-border)" }} />
                <Area type="monotone" dataKey="present" stroke="var(--color-success)" fill="url(#gPresent)" strokeWidth={2} />
                <Area type="monotone" dataKey="absent" stroke="var(--color-destructive)" fill="url(#gAbsent)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Today's Breakdown</CardTitle>
            <CardDescription>{totalToday} of {students.length} marked</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" innerRadius={55} outerRadius={85} paddingAngle={2}>
                  {pieData.map((p) => <Cell key={p.name} fill={p.color} />)}
                </Pie>
                <Legend verticalAlign="bottom" iconType="circle" />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Class-wise Attendance %</CardTitle>
            <CardDescription>All-time average</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={classBreakdown} margin={{ left: -10, right: 8, top: 8 }}>
                <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
                <YAxis tick={{ fontSize: 12 }} stroke="var(--color-muted-foreground)" />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--color-border)" }} />
                <Bar dataKey="pct" fill="var(--color-primary-glow)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Clock className="size-4" /> Recent Activity</CardTitle>
            <CardDescription>System log</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 max-h-64 overflow-auto">
            {activity.slice(0, 10).map((a) => (
              <div key={a.id} className="flex gap-3 text-sm">
                <div className="size-2 rounded-full bg-primary-glow mt-2 shrink-0" />
                <div className="flex-1">
                  <div className="text-foreground">{a.message}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(a.at).toLocaleString()} · {a.actor}
                  </div>
                </div>
              </div>
            ))}
            {activity.length === 0 && (
              <div className="text-sm text-muted-foreground">No activity yet.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
