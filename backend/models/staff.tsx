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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { useAMS, addStaff, updateStaff, deleteStaff, type Staff } from "@/lib/ams-store";
import { toast } from "sonner";

export const Route = createFileRoute("/staff")({
  head: () => ({ meta: [{ title: "Staff — AMS" }] }),
  component: () => <AppShell title="Staff Management"><StaffPage /></AppShell>,
});

const empty: Omit<Staff, "id"> = {
  employeeId: "", name: "", email: "", phone: "",
  department: "", designation: "", classIds: [],
};

function StaffPage() {
  const staff = useAMS((d) => d.staff);
  const classes = useAMS((d) => d.classes);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Staff | null>(null);
  const [form, setForm] = useState<Omit<Staff, "id">>(empty);

  const filtered = useMemo(() => staff.filter((s) =>
    !q || [s.name, s.email, s.department, s.employeeId].some((f) => f.toLowerCase().includes(q.toLowerCase()))
  ), [staff, q]);

  function openNew() { setEditing(null); setForm(empty); setOpen(true); }
  function openEdit(s: Staff) { setEditing(s); const { id: _id, ...rest } = s; void _id; setForm(rest); setOpen(true); }
  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.employeeId) { toast.error("Fill required fields"); return; }
    if (editing) { updateStaff(editing.id, form); toast.success("Staff updated"); }
    else { addStaff(form); toast.success("Staff added"); }
    setOpen(false);
  }

  function toggleClass(cid: string) {
    setForm((f) => ({
      ...f,
      classIds: f.classIds.includes(cid) ? f.classIds.filter((x) => x !== cid) : [...f.classIds, cid],
    }));
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Faculty & Staff</h2>
          <p className="text-sm text-muted-foreground">{staff.length} members</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew}><Plus className="size-4" /> Add Staff</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? "Edit staff" : "Add staff"}</DialogTitle></DialogHeader>
            <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5"><Label>Employee ID</Label><Input value={form.employeeId} onChange={(e) => setForm({...form, employeeId: e.target.value})} required /></div>
              <div className="space-y-1.5"><Label>Full Name</Label><Input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} required /></div>
              <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} /></div>
              <div className="space-y-1.5"><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} /></div>
              <div className="space-y-1.5"><Label>Department</Label><Input value={form.department} onChange={(e) => setForm({...form, department: e.target.value})} /></div>
              <div className="space-y-1.5"><Label>Designation</Label><Input value={form.designation} onChange={(e) => setForm({...form, designation: e.target.value})} /></div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Assigned Classes</Label>
                <div className="grid grid-cols-2 gap-2 rounded-md border p-3">
                  {classes.map((c) => (
                    <label key={c.id} className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox checked={form.classIds.includes(c.id)} onCheckedChange={() => toggleClass(c.id)} />
                      {c.name}
                    </label>
                  ))}
                </div>
              </div>
              <DialogFooter className="sm:col-span-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit">{editing ? "Save changes" : "Add staff"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="relative">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search staff…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Emp ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden md:table-cell">Department</TableHead>
                  <TableHead className="hidden lg:table-cell">Designation</TableHead>
                  <TableHead className="hidden md:table-cell">Classes</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-mono text-xs">{s.employeeId}</TableCell>
                    <TableCell className="font-medium">{s.name}<div className="text-xs text-muted-foreground lg:hidden">{s.designation}</div></TableCell>
                    <TableCell className="hidden md:table-cell">{s.department}</TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground">{s.designation}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {s.classIds.map((cid) => {
                          const c = classes.find((x) => x.id === cid);
                          return <Badge key={cid} variant="secondary">{c?.name ?? cid}</Badge>;
                        })}
                        {s.classIds.length === 0 && <span className="text-xs text-muted-foreground">—</span>}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(s)}><Pencil className="size-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => { if (confirm(`Remove ${s.name}?`)) deleteStaff(s.id); }}>
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No staff found.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
