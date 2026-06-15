import { useSyncExternalStore } from "react";

export type Role = "admin" | "staff" | "student";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  password: string;
  linkedId?: string; // staffId or studentId
}

export interface ClassRoom {
  id: string;
  name: string; // e.g. "CSE-A Year 3"
  department: string;
  staffId?: string; // assigned faculty
}

export interface Student {
  id: string;
  rollNo: string;
  name: string;
  email: string;
  phone: string;
  classId: string;
  gender: "Male" | "Female" | "Other";
  joinedOn: string; // ISO date
}

export interface Staff {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  classIds: string[];
}

export type AttendanceStatus = "present" | "absent" | "late";

export interface AttendanceRecord {
  id: string; // `${date}-${studentId}`
  date: string; // YYYY-MM-DD
  studentId: string;
  classId: string;
  status: AttendanceStatus;
  markedBy: string; // userId
  markedAt: string;
}

export interface ActivityLog {
  id: string;
  at: string;
  actor: string;
  message: string;
}

export interface AMSData {
  users: User[];
  classes: ClassRoom[];
  students: Student[];
  staff: Staff[];
  attendance: AttendanceRecord[];
  activity: ActivityLog[];
  session: { userId: string | null };
}

const KEY = "ams.data.v1";

const uid = () => Math.random().toString(36).slice(2, 10);

function seed(): AMSData {
  const classes: ClassRoom[] = [
    { id: "c1", name: "CSE-A Year 3", department: "Computer Science" },
    { id: "c2", name: "CSE-B Year 3", department: "Computer Science" },
    { id: "c3", name: "ECE-A Year 2", department: "Electronics" },
    { id: "c4", name: "MECH-A Year 4", department: "Mechanical" },
  ];

  const staff: Staff[] = [
    { id: "s1", employeeId: "EMP001", name: "Dr. Anita Rao", email: "anita.rao@college.edu", phone: "+91 90000 11111", department: "Computer Science", designation: "Associate Professor", classIds: ["c1", "c2"] },
    { id: "s2", employeeId: "EMP002", name: "Prof. Rahul Mehta", email: "rahul.mehta@college.edu", phone: "+91 90000 22222", department: "Electronics", designation: "Assistant Professor", classIds: ["c3"] },
    { id: "s3", employeeId: "EMP003", name: "Dr. Priya Nair", email: "priya.nair@college.edu", phone: "+91 90000 33333", department: "Mechanical", designation: "Professor", classIds: ["c4"] },
  ];
  classes[0].staffId = "s1";
  classes[1].staffId = "s1";
  classes[2].staffId = "s2";
  classes[3].staffId = "s3";

  const firstNames = ["Aarav","Vivaan","Aditya","Vihaan","Arjun","Sai","Reyansh","Krishna","Ishaan","Rudra","Ananya","Diya","Aadhya","Saanvi","Myra","Aaradhya","Anika","Navya","Kiara","Pari","Rohan","Kabir","Dev","Ayaan","Ishita","Tara","Riya","Meera","Aanya","Zara"];
  const lastNames = ["Sharma","Verma","Iyer","Patel","Reddy","Khan","Gupta","Singh","Nair","Das","Bose","Joshi","Pillai","Mehta","Chopra","Bhat","Kapoor","Menon","Rao","Shetty"];

  const students: Student[] = [];
  let n = 1;
  classes.forEach((c, ci) => {
    const count = 12 + ci;
    for (let i = 0; i < count; i++) {
      const fn = firstNames[(ci * 7 + i) % firstNames.length];
      const ln = lastNames[(ci * 3 + i) % lastNames.length];
      students.push({
        id: `st${n}`,
        rollNo: `${c.id.toUpperCase()}-${String(i + 1).padStart(3, "0")}`,
        name: `${fn} ${ln}`,
        email: `${fn.toLowerCase()}.${ln.toLowerCase()}${n}@college.edu`,
        phone: `+91 9${String(100000000 + n * 137).slice(0, 9)}`,
        classId: c.id,
        gender: i % 3 === 0 ? "Female" : "Male",
        joinedOn: "2023-08-01",
      });
      n++;
    }
  });

  const users: User[] = [
    { id: "u1", name: "Admin", email: "admin", password: "admin", role: "admin" },
    { id: "u2", name: "Dr. Anita Rao", email: "staff", password: "staff", role: "staff", linkedId: "s1" },
    { id: "u3", name: students[0].name, email: "student", password: "student", role: "student", linkedId: students[0].id },
  ];

  // Seed last 14 days of attendance
  const attendance: AttendanceRecord[] = [];
  const today = new Date();
  for (let d = 14; d >= 1; d--) {
    const dt = new Date(today);
    dt.setDate(today.getDate() - d);
    const dateStr = dt.toISOString().slice(0, 10);
    if (dt.getDay() === 0) continue; // skip Sundays
    students.forEach((st, idx) => {
      const r = (idx * 13 + d * 7) % 10;
      const status: AttendanceStatus = r < 8 ? "present" : r < 9 ? "late" : "absent";
      attendance.push({
        id: `${dateStr}-${st.id}`,
        date: dateStr,
        studentId: st.id,
        classId: st.classId,
        status,
        markedBy: "u1",
        markedAt: dt.toISOString(),
      });
    });
  }

  return {
    users,
    classes,
    students,
    staff,
    attendance,
    activity: [
      { id: uid(), at: new Date().toISOString(), actor: "system", message: "System initialized with seed data" },
    ],
    session: { userId: null },
  };
}

let data: AMSData | null = null;
const listeners = new Set<() => void>();

function load(): AMSData {
  if (typeof window === "undefined") return seed();
  if (data) return data;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) data = JSON.parse(raw) as AMSData;
    else data = seed();
  } catch {
    data = seed();
  }
  return data!;
}

function persist() {
  if (typeof window === "undefined" || !data) return;
  localStorage.setItem(KEY, JSON.stringify(data));
  listeners.forEach((l) => l());
}

export function getData(): AMSData {
  return load();
}

function update(mut: (d: AMSData) => void, log?: string) {
  const d = load();
  mut(d);
  if (log) {
    const actor = d.users.find((u) => u.id === d.session.userId)?.name ?? "system";
    d.activity.unshift({ id: uid(), at: new Date().toISOString(), actor, message: log });
    d.activity = d.activity.slice(0, 50);
  }
  persist();
}

export function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useAMS<T>(selector: (d: AMSData) => T): T {
  return useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => listeners.delete(cb); },
    () => selector(load()),
    () => selector(seed()),
  );
}

// Auth
export function login(email: string, password: string): User | null {
  const d = load();
  const u = d.users.find((x) => x.email.toLowerCase() === email.toLowerCase() && x.password === password);
  if (!u) return null;
  update((dd) => { dd.session.userId = u.id; }, `${u.name} signed in`);
  return u;
}

export function logout() {
  const d = load();
  const u = d.users.find((x) => x.id === d.session.userId);
  update((dd) => { dd.session.userId = null; }, u ? `${u.name} signed out` : undefined);
}

export function currentUser(): User | null {
  const d = load();
  return d.users.find((u) => u.id === d.session.userId) ?? null;
}

// Students
export function addStudent(s: Omit<Student, "id">) {
  update((d) => { d.students.push({ ...s, id: "st" + uid() }); }, `Added student ${s.name}`);
}
export function updateStudent(id: string, patch: Partial<Student>) {
  update((d) => {
    const i = d.students.findIndex((x) => x.id === id);
    if (i >= 0) d.students[i] = { ...d.students[i], ...patch };
  }, `Updated student ${patch.name ?? id}`);
}
export function deleteStudent(id: string) {
  update((d) => {
    const s = d.students.find((x) => x.id === id);
    d.students = d.students.filter((x) => x.id !== id);
    d.attendance = d.attendance.filter((a) => a.studentId !== id);
    if (s) d.activity.unshift({ id: uid(), at: new Date().toISOString(), actor: currentUser()?.name ?? "system", message: `Deleted student ${s.name}` });
  });
}

// Staff
export function addStaff(s: Omit<Staff, "id">) {
  update((d) => { d.staff.push({ ...s, id: "s" + uid() }); }, `Added staff ${s.name}`);
}
export function updateStaff(id: string, patch: Partial<Staff>) {
  update((d) => {
    const i = d.staff.findIndex((x) => x.id === id);
    if (i >= 0) d.staff[i] = { ...d.staff[i], ...patch };
    // sync classes assignment
    if (patch.classIds) {
      d.classes.forEach((c) => {
        if (patch.classIds!.includes(c.id)) c.staffId = id;
        else if (c.staffId === id) c.staffId = undefined;
      });
    }
  }, `Updated staff ${patch.name ?? id}`);
}
export function deleteStaff(id: string) {
  update((d) => {
    const s = d.staff.find((x) => x.id === id);
    d.staff = d.staff.filter((x) => x.id !== id);
    d.classes.forEach((c) => { if (c.staffId === id) c.staffId = undefined; });
    if (s) d.activity.unshift({ id: uid(), at: new Date().toISOString(), actor: currentUser()?.name ?? "system", message: `Removed staff ${s.name}` });
  });
}

// Attendance
export function markAttendance(date: string, classId: string, entries: Record<string, AttendanceStatus>) {
  update((d) => {
    const me = d.users.find((u) => u.id === d.session.userId);
    Object.entries(entries).forEach(([studentId, status]) => {
      const id = `${date}-${studentId}`;
      const existing = d.attendance.findIndex((a) => a.id === id);
      const rec: AttendanceRecord = {
        id, date, studentId, classId, status,
        markedBy: me?.id ?? "system",
        markedAt: new Date().toISOString(),
      };
      if (existing >= 0) d.attendance[existing] = rec;
      else d.attendance.push(rec);
    });
  }, `Marked attendance for ${date}`);
}

export function resetData() {
  if (typeof window !== "undefined") localStorage.removeItem(KEY);
  data = null;
  load();
  persist();
}
