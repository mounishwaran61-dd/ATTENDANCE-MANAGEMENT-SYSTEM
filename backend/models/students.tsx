import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { useAMS, addStudent, updateStudent, deleteStudent, type Student, currentUser } from "@/lib/ams-store";
import { toast } from "sonner";

export const Route = createFileRoute("/students")({
  head: () => ({ meta: [{ title: "Students — AMS" }] }),
  component: () => <AppShell title="Students"><StudentsPage /></AppShell>,
});

const empty: Omit<Student, "id"> = {
  rollNo: "", name: "", email: "", phone: "", classId: "", gender: "Male", joinedOn: new Date().toISOString().slice(0,10),
};

function StudentsPage() {
  const students = useAMS((d) => d.students);
  const classes = useAMS((d) => d.classes);
  const me = currentUser()!;
  const canEdit = me.role === "admin";

  const [q, setQ] = useState("");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [form, setForm] = useState<Omit<Student, "id">>(empty);

  const filtered = useMemo(() => {
    return students.filter((s) => {
      if (classFilter !== "all" && s.classId !== classFilter) return false;
      if (!q) return true;
      const t = q.toLowerCase();
      return s.name.toLowerCase().includes(t) || s.rollNo.toLowerCase().includes(t) || s.email.toLowerCase().includes(t);
    });
  }, [students, q, classFilter]);

  function openNew() {
    setEditing(null);
    setForm({ ...empty, classId: classes[0]?.id ?? "" });
    setOpen(true);
  }
  function openEdit(s: Student) {
    setEditing(s);
    const { id: _id, ...rest } = s;
    void _id;
    setForm(rest);
    setOpen(true);
  }
  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.rollNo || !form.classId) { toast.error("Fill required fields"); return; }
    if (editing) { updateStudent(editing.id, form); toast.success("Student updated"); }
    else { addStudent(form); toast.success("Student added"); }
    setOpen(false);
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Student Directory</h2>
          <p className="text-sm text-muted-foreground">{filtered.length} of {students.length} students</p>
        </div>
        {canEdit && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNew}><Plus className="size-4" /> Add Student</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editing ? "Edit student" : "Add student"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Roll No</Label>
                  <Input value={form.rollNo} onChange={(e) => setForm({ ...form, rollNo: e.target.value })} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Full Name</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Email</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Phone</Label>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Gender</Label>
                  <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v as Student["gender"] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Class</Label>
                  <Select value={form.classId} onValueChange={(v) => setForm({ ...form, classId: v })}>
                    <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                    <SelectContent>
                      {classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Joined</Label>
                  <Input type="date" value={form.joinedOn} onChange={(e) => setForm({ ...form, joinedOn: e.target.value })} />
                </div>
                <DialogFooter className="sm:col-span-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button type="submit">{editing ? "Save changes" : "Add student"}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search name, roll no, email…" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <Select value={classFilter} onValueChange={setClassFilter}>
              <SelectTrigger className="sm:w-56"><SelectValue placeholder="All classes" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All classes</SelectItem>
                {classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Roll No</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden md:table-cell">Class</TableHead>
                  <TableHead className="hidden lg:table-cell">Email</TableHead>
                  <TableHead className="hidden sm:table-cell">Gender</TableHead>
                  {canEdit && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((s) => {
                  const cls = classes.find((c) => c.id === s.classId);
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="font-mono text-xs">{s.rollNo}</TableCell>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="secondary">{cls?.name ?? "—"}</Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground">{s.email}</TableCell>
                      <TableCell className="hidden sm:table-cell">{s.gender}</TableCell>
                      {canEdit && (
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(s)}><Pencil className="size-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => { if (confirm(`Delete ${s.name}?`)) deleteStudent(s.id); }}>
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={canEdit ? 6 : 5} className="text-center text-muted-foreground py-8">No students found.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
