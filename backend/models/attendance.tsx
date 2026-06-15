import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useAMS, markAttendance, currentUser, type AttendanceStatus } from "@/lib/ams-store";
import { CheckCircle2, XCircle, Clock, Save } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/attendance")({
  head: () => ({ meta: [{ title: "Attendance — AMS" }] }),
  component: () => <AppShell title="Attendance"><AttendancePage /></AppShell>,
});

function AttendancePage() {
  const me = currentUser()!;
  if (me.role === "student") return <StudentView />;
  return <MarkingView />;
}

function MarkingView() {
  const classes = useAMS((d) => d.classes);
  const students = useAMS((d) => d.students);
  const attendance = useAMS((d) => d.attendance);
  const me = currentUser()!;

  const myClasses = me.role === "admin"
    ? classes
    : classes.filter((c) => c.staffId === me.linkedId);

  const [classId, setClassId] = useState<string>(myClasses[0]?.id ?? "");
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [entries, setEntries] = useState<Record<string, AttendanceStatus>>({});

  const classStudents = useMemo(
    () => students.filter((s) => s.classId === classId),
    [students, classId],
  );

  useEffect(() => {
    const initial: Record<string, AttendanceStatus> = {};
    classStudents.forEach((s) => {
      const existing = attendance.find((a) => a.date === date && a.studentId === s.id);
      initial[s.id] = existing?.status ?? "present";
    });
    setEntries(initial);
  }, [classId, date, classStudents.length, attendance]);

  const counts = useMemo(() => {
    const c = { present: 0, late: 0, absent: 0 };
    Object.values(entries).forEach((s) => { c[s]++; });
    return c;
  }, [entries]);

  function setAll(status: AttendanceStatus) {
    const next: Record<string, AttendanceStatus> = {};
    classStudents.forEach((s) => { next[s.id] = status; });
    setEntries(next);
  }

  function save() {
    if (!classId || classStudents.length === 0) { toast.error("No students to mark"); return; }
    markAttendance(date, classId, entries);
    toast.success(`Attendance saved for ${date}`);
  }

  return (
    <>
      <Card>
        <CardContent className="p-4 grid gap-3 sm:grid-cols-4">
          <div className="space-y-1.5">
            <Label>Class</Label>
            <Select value={classId} onValueChange={setClassId}>
              <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
              <SelectContent>
                {myClasses.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} max={new Date().toISOString().slice(0,10)} />
          </div>
          <div className="space-y-1.5 sm:col-span-2 flex items-end gap-2 flex-wrap">
            <Button type="button" variant="outline" size="sm" onClick={() => setAll("present")}>
              <CheckCircle2 className="size-4 text-success" /> All Present
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setAll("absent")}>
              <XCircle className="size-4 text-destructive" /> All Absent
            </Button>
            <Button type="button" className="ml-auto" onClick={save}>
              <Save className="size-4" /> Save Attendance
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-3">
        <StatPill label="Present" value={counts.present} tone="success" />
        <StatPill label="Late" value={counts.late} tone="warning" />
        <StatPill label="Absent" value={counts.absent} tone="destructive" />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">{classes.find(c => c.id === classId)?.name ?? "Select a class"}</CardTitle></CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Roll</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classStudents.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-mono text-xs">{s.rollNo}</TableCell>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 justify-end">
                        {(["present","late","absent"] as AttendanceStatus[]).map((st) => (
                          <button
                            key={st}
                            onClick={() => setEntries((e) => ({ ...e, [s.id]: st }))}
                            className={cn(
                              "px-2.5 py-1 rounded-md text-xs font-medium border transition-colors capitalize",
                              entries[s.id] === st
                                ? st === "present" ? "bg-success text-success-foreground border-success"
                                : st === "late" ? "bg-warning text-warning-foreground border-warning"
                                : "bg-destructive text-destructive-foreground border-destructive"
                                : "bg-card text-muted-foreground hover:border-foreground/30",
                            )}
                          >
                            {st}
                          </button>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {classStudents.length === 0 && (
                  <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">No students in this class.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

function StatPill({ label, value, tone }: { label: string; value: number; tone: "success" | "warning" | "destructive" }) {
  const Icon = tone === "success" ? CheckCircle2 : tone === "warning" ? Clock : XCircle;
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={cn("size-10 rounded-lg grid place-items-center",
          tone === "success" && "bg-success/10 text-success",
          tone === "warning" && "bg-warning/15 text-warning",
          tone === "destructive" && "bg-destructive/10 text-destructive",
        )}>
          <Icon className="size-5" />
        </div>
        <div>
          <div className="text-2xl font-semibold">{value}</div>
          <div className="text-xs text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function StudentView() {
  const me = currentUser()!;
  const students = useAMS((d) => d.students);
  const attendance = useAMS((d) => d.attendance);
  const student = students.find((s) => s.id === me.linkedId);

  const mine = useMemo(() => attendance.filter((a) => a.studentId === me.linkedId).sort((a, b) => b.date.localeCompare(a.date)), [attendance, me.linkedId]);
  const present = mine.filter((a) => a.status !== "absent").length;
  const pct = mine.length ? Math.round((present / mine.length) * 100) : 0;

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="p-5"><div className="text-xs text-muted-foreground">My Attendance</div><div className="text-3xl font-semibold mt-1">{pct}%</div></CardContent></Card>
        <Card><CardContent className="p-5"><div className="text-xs text-muted-foreground">Days Present</div><div className="text-3xl font-semibold mt-1">{present}</div></CardContent></Card>
        <Card><CardContent className="p-5"><div className="text-xs text-muted-foreground">Total Sessions</div><div className="text-3xl font-semibold mt-1">{mine.length}</div></CardContent></Card>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">{student?.name} — Attendance History</CardTitle></CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>
                {mine.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.date}</TableCell>
                    <TableCell>
                      <Badge className={cn(
                        r.status === "present" && "bg-success text-success-foreground",
                        r.status === "late" && "bg-warning text-warning-foreground",
                        r.status === "absent" && "bg-destructive text-destructive-foreground",
                      )}>{r.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {mine.length === 0 && <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground py-8">No records yet.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
