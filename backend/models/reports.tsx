import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useAMS } from "@/lib/ams-store";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line } from "recharts";

export const Route = createFileRoute("/reports")({
  head: () => ({ meta: [{ title: "Reports — AMS" }] }),
  component: () => <AppShell title="Reports & Analytics"><ReportsPage /></AppShell>,
});

function downloadCsv(filename: string, rows: (string | number)[][]) {
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function ReportsPage() {
  const students = useAMS((d) => d.students);
  const classes = useAMS((d) => d.classes);
  const attendance = useAMS((d) => d.attendance);

  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [classId, setClassId] = useState<string>("all");

  // Daily
  const daily = useMemo(() => {
    const recs = attendance.filter((a) => a.date === date && (classId === "all" || a.classId === classId));
    return recs.map((r) => {
      const s = students.find((x) => x.id === r.studentId);
      const c = classes.find((x) => x.id === r.classId);
      return { ...r, name: s?.name ?? "—", roll: s?.rollNo ?? "—", className: c?.name ?? "—" };
    });
  }, [attendance, date, classId, students, classes]);

  // Monthly per-student
  const monthly = useMemo(() => {
    const ms = students.filter((s) => classId === "all" || s.classId === classId);
    return ms.map((s) => {
      const recs = attendance.filter((a) => a.studentId === s.id && a.date.startsWith(month));
      const present = recs.filter((a) => a.status !== "absent").length;
      const pct = recs.length ? Math.round((present / recs.length) * 100) : 0;
      return { id: s.id, name: s.name, roll: s.rollNo, classId: s.classId, present, absent: recs.length - present, total: recs.length, pct };
    }).sort((a, b) => b.pct - a.pct);
  }, [students, attendance, month, classId]);

  const monthlyTrend = useMemo(() => {
    const map = new Map<string, { date: string; pct: number; total: number; present: number }>();
    attendance.filter((a) => a.date.startsWith(month) && (classId === "all" || a.classId === classId)).forEach((a) => {
      const m = map.get(a.date) ?? { date: a.date, pct: 0, total: 0, present: 0 };
      m.total++; if (a.status !== "absent") m.present++;
      map.set(a.date, m);
    });
    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date)).map((d) => ({
      label: d.date.slice(8),
      pct: d.total ? Math.round((d.present / d.total) * 100) : 0,
    }));
  }, [attendance, month, classId]);

  const classSummary = useMemo(() => classes.map((c) => {
    const recs = attendance.filter((a) => a.classId === c.id && a.date.startsWith(month));
    const present = recs.filter((a) => a.status !== "absent").length;
    return { name: c.name, pct: recs.length ? Math.round((present / recs.length) * 100) : 0 };
  }), [classes, attendance, month]);

  return (
    <>
      <Tabs defaultValue="daily" className="space-y-4">
        <TabsList>
          <TabsTrigger value="daily">Daily</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
          <TabsTrigger value="class">Class-wise</TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="space-y-4">
          <Card>
            <CardContent className="p-4 grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5"><Label>Date</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
              <div className="space-y-1.5">
                <Label>Class</Label>
                <Select value={classId} onValueChange={setClassId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All classes</SelectItem>
                    {classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button variant="outline" className="ml-auto" onClick={() => downloadCsv(
                  `daily-${date}.csv`,
                  [["Roll","Name","Class","Status"], ...daily.map((r) => [r.roll, r.name, r.className, r.status])],
                )}><Download className="size-4" /> Export CSV</Button>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Daily Attendance — {date}</CardTitle><CardDescription>{daily.length} records</CardDescription></CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader><TableRow><TableHead>Roll</TableHead><TableHead>Name</TableHead><TableHead>Class</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {daily.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-mono text-xs">{r.roll}</TableCell>
                        <TableCell className="font-medium">{r.name}</TableCell>
                        <TableCell>{r.className}</TableCell>
                        <TableCell className="capitalize">{r.status}</TableCell>
                      </TableRow>
                    ))}
                    {daily.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No records.</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monthly" className="space-y-4">
          <Card>
            <CardContent className="p-4 grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5"><Label>Month</Label><Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} /></div>
              <div className="space-y-1.5">
                <Label>Class</Label>
                <Select value={classId} onValueChange={setClassId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All classes</SelectItem>
                    {classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button variant="outline" className="ml-auto" onClick={() => downloadCsv(
                  `monthly-${month}.csv`,
                  [["Roll","Name","Present","Absent","Total","%"], ...monthly.map((r) => [r.roll, r.name, r.present, r.absent, r.total, r.pct])],
                )}><Download className="size-4" /> Export CSV</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Daily % across {month}</CardTitle></CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyTrend} margin={{ left: -10, right: 8, top: 8 }}>
                  <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="pct" stroke="var(--color-primary-glow)" strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Student-wise Attendance %</CardTitle></CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Roll</TableHead><TableHead>Name</TableHead>
                    <TableHead>Present</TableHead><TableHead>Absent</TableHead>
                    <TableHead className="w-[28%]">%</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {monthly.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-mono text-xs">{r.roll}</TableCell>
                        <TableCell className="font-medium">{r.name}</TableCell>
                        <TableCell>{r.present}</TableCell>
                        <TableCell>{r.absent}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Progress value={r.pct} className="h-2 flex-1" />
                            <span className="text-xs font-medium tabular-nums w-10 text-right">{r.pct}%</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="class" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Class-wise comparison — {month}</CardTitle></CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={classSummary} margin={{ left: -10, right: 8, top: 8 }}>
                  <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="pct" fill="var(--color-primary)" radius={[8,8,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
