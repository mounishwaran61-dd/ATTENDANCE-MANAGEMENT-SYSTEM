import { createFileRoute, Link } from "@tanstack/react-router";
import { GraduationCap, ClipboardCheck, BarChart3, Users, ShieldCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AttendEase — Attendance Management System" },
      { name: "description", content: "Digital attendance tracking for schools and colleges. Manage students, teachers, classes and generate reports in one place." },
      { property: "og:title", content: "AttendEase — Attendance Management System" },
      { property: "og:description", content: "Digital attendance tracking for schools and colleges." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold">
            <div className="w-8 h-8 rounded-lg bg-[var(--gradient-hero)] flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-primary-foreground" />
            </div>
            AttendEase
          </Link>
          <Link to="/auth">
            <Button>Sign In</Button>
          </Link>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{ background: "var(--gradient-hero)" }}
        />
        <div className="relative max-w-6xl mx-auto px-6 py-20 lg:py-28 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-medium mb-6">
            <ShieldCheck className="w-3.5 h-3.5" />
            Trusted by educational institutions
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            Attendance management,
            <br />
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "var(--gradient-hero)" }}
            >
              made effortless.
            </span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Replace paper registers with a fast, accurate digital system.
            Track attendance, manage students and teachers, and generate
            reports — all from one secure dashboard.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/auth">
              <Button size="lg" className="gap-2">
                Get Started <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
          <div className="mt-8 text-xs text-muted-foreground">
            Default admin login: <code className="px-2 py-1 rounded bg-muted">admin</code> / <code className="px-2 py-1 rounded bg-muted">admin123</code>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: Users, title: "User Management", desc: "Role-based access for admins, teachers and students." },
            { icon: GraduationCap, title: "Student Records", desc: "Maintain complete student profiles and class assignments." },
            { icon: ClipboardCheck, title: "Mark Attendance", desc: "Quick daily attendance with present, absent and late status." },
            { icon: BarChart3, title: "Reports & Stats", desc: "Monthly, yearly summaries and per-student analytics." },
          ].map((f) => (
            <div key={f.title} className="p-6 rounded-xl border border-border bg-card hover:shadow-[var(--shadow-soft)] transition-shadow">
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center mb-4">
                <f.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold mb-1">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} AttendEase — Attendance Management System
      </footer>
    </div>
  );
}
