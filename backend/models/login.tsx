import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { GanttChartSquare, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login, currentUser } from "@/lib/ams-store";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Attendance Management System" },
      { name: "description", content: "Secure login for administrators, staff, and students." },
    ],
  }),
  component: LoginPage,
});

const demo = [
  { role: "Admin", email: "admin", password: "admin" },
  { role: "Staff", email: "staff", password: "staff" },
  { role: "Student", email: "student", password: "student" },
];

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin");
  const [password, setPassword] = useState("admin");
  const [busy, setBusy] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (currentUser()) navigate({ to: "/dashboard", replace: true });
  }, [navigate]);

  if (!mounted) return null;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const u = login(email.trim(), password);
    setBusy(false);
    if (!u) { toast.error("Invalid credentials"); return; }
    toast.success(`Welcome, ${u.name}`);
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="hidden lg:flex flex-col justify-between p-12 bg-sidebar text-sidebar-foreground relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{ background: "radial-gradient(600px 400px at 20% 10%, oklch(0.55 0.16 255 / 0.4), transparent), radial-gradient(500px 300px at 90% 90%, oklch(0.65 0.18 300 / 0.3), transparent)" }}
        />
        <div className="relative flex items-center gap-3">
          <div className="size-10 rounded-lg bg-primary-glow/20 grid place-items-center">
            <GanttChartSquare className="size-6 text-primary-glow" />
          </div>
          <div>
            <div className="font-semibold tracking-tight">Attendance Management</div>
            <div className="text-xs text-sidebar-foreground/60">For colleges & universities</div>
          </div>
        </div>
        <div className="relative space-y-6 max-w-md">
          <h2 className="text-4xl font-semibold leading-tight">
            Track attendance with clarity and confidence.
          </h2>
          <p className="text-sidebar-foreground/70">
            Real-time marking, automatic percentages, and beautiful reports — built
            for administrators, faculty, and students.
          </p>
          <div className="grid grid-cols-3 gap-4 pt-4">
            {[
              { k: "Daily", v: "Marking" },
              { k: "Class-wise", v: "Reports" },
              { k: "Live", v: "Analytics" },
            ].map((s) => (
              <div key={s.k} className="rounded-lg bg-sidebar-accent/40 p-3">
                <div className="text-sm font-semibold">{s.k}</div>
                <div className="text-xs text-sidebar-foreground/60">{s.v}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative text-xs text-sidebar-foreground/50">
          © {new Date().getFullYear()} College AMS
        </div>
      </div>

      <div className="flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-2">
            <div className="lg:hidden flex items-center gap-2 mb-4">
              <div className="size-9 rounded-lg bg-primary/10 grid place-items-center">
                <GanttChartSquare className="size-5 text-primary" />
              </div>
              <span className="font-semibold">AMS</span>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
            <p className="text-sm text-muted-foreground">Access your attendance dashboard.</p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Username / Email</Label>
              <Input id="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <div className="rounded-lg border bg-muted/40 p-4 text-xs space-y-2">
            <div className="flex items-center gap-2 font-medium text-foreground">
              <ShieldCheck className="size-4 text-primary" /> Demo credentials
            </div>
            <div className="grid grid-cols-3 gap-2">
              {demo.map((d) => (
                <button
                  key={d.role}
                  type="button"
                  onClick={() => { setEmail(d.email); setPassword(d.password); }}
                  className="rounded-md border bg-card px-2 py-2 text-left hover:border-primary/50 transition-colors"
                >
                  <div className="font-medium text-foreground">{d.role}</div>
                  <div className="text-muted-foreground">{d.email} / {d.password}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
