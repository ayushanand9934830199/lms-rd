import Link from "next/link";
import { Flame, ArrowRight, BookOpen, Users, Award, TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import CourseCard from "@/components/courses/CourseCard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Restless Dreamers — Learn without limits",
  description:
    "Structured courses, live batches, real community. Built for the curious and ambitious.",
};

const TESTIMONIALS = [
  {
    quote:
      "The course structure is exactly what I needed. Clean, focused, and no fluff. I landed my first dev role 3 months after completing the web dev path.",
    name: "Meera Krishnan",
    role: "Frontend Engineer at Razorpay",
    initials: "MK",
  },
  {
    quote:
      "What sets Restless Dreamers apart is the community. The discussion threads are genuinely helpful — not just questions left unanswered.",
    name: "Arjun Patel",
    role: "Product Manager at Groww",
    initials: "AP",
  },
  {
    quote:
      "I've tried Coursera, Udemy, everything. This is the first platform where I actually finished a course. The certificate meant something.",
    name: "Priya Nair",
    role: "Data Analyst at PhonePe",
    initials: "PN",
  },
];

export default async function HomePage() {
  const supabase = await createClient();

  // Featured courses
  const { data: featuredCourses } = await supabase
    .from("courses")
    .select(`
      *,
      instructor:profiles!instructor_id(id, full_name, username, avatar_url, headline),
      chapters(id, lessons(id, duration_sec))
    `)
    .eq("status", "published")
    .eq("is_featured", true)
    .limit(6);

  // Stats
  const [
    { count: courseCount },
    { count: learnerCount },
    { count: instructorCount },
    { count: certCount },
  ] = await Promise.all([
    supabase.from("courses").select("*", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "student"),
    supabase.from("profiles").select("*", { count: "exact", head: true }).in("role", ["instructor", "moderator"]),
    supabase.from("certificates").select("*", { count: "exact", head: true }),
  ]);

  const stats = [
    { label: "Courses", value: courseCount ?? 0, icon: BookOpen },
    { label: "Learners", value: learnerCount ?? 0, icon: Users },
    { label: "Instructors", value: instructorCount ?? 0, icon: TrendingUp },
    { label: "Certificates", value: certCount ?? 0, icon: Award },
  ];

  return (
    <div className="min-h-screen bg-rd-paper">
      {/* ── Nav ───────────────────────────────────────────── */}
      <nav className="sticky top-0 z-40 bg-rd-paper/80 backdrop-blur-sm border-b border-rd-border">
        <div className="max-w-content mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-rd-accent" />
            <span className="font-display font-semibold text-rd-ink">Restless Dreamers</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/courses" className="rd-btn-ghost text-sm">Courses</Link>
            <Link href="/login" className="rd-btn-secondary text-sm">Sign in</Link>
            <Link href="/signup" className="rd-btn text-sm">Start for free</Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ──────────────────────────────────────────── */}
      <section className="max-w-content mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 rd-badge mb-6 text-sm px-3 py-1">
          <Flame className="w-3.5 h-3.5" />
          <span>Learn without limits</span>
        </div>

        <h1 className="font-display text-5xl md:text-7xl font-semibold text-rd-ink leading-[1.06] mb-6 max-w-3xl mx-auto">
          Knowledge is not<br />
          <em className="text-rd-accent not-italic">something to collect.</em>
        </h1>

        <p className="text-lg md:text-xl text-rd-muted max-w-xl mx-auto mb-10 leading-relaxed">
          Structured courses. Live batches. Real community.<br />
          Built for the restless.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/courses" className="rd-btn text-base px-6 py-3">
            Explore Courses <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/signup" className="rd-btn-secondary text-base px-6 py-3">
            Start for Free →
          </Link>
        </div>
      </section>

      {/* ── Stats ─────────────────────────────────────────── */}
      <section className="border-y border-rd-border bg-rd-surface">
        <div className="max-w-content mx-auto px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map(({ label, value, icon: Icon }) => (
            <div key={label} className="text-center animate-count-up">
              <Icon className="w-5 h-5 text-rd-accent mx-auto mb-2" />
              <div className="font-display text-3xl font-semibold text-rd-ink">
                {value.toLocaleString("en-IN")}
              </div>
              <div className="text-sm text-rd-muted mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Featured Courses ──────────────────────────────── */}
      {featuredCourses && featuredCourses.length > 0 && (
        <section className="max-w-content mx-auto px-6 py-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="rd-badge mb-2">★ Featured</div>
              <h2 className="font-display text-3xl font-semibold text-rd-ink">
                Handpicked for you
              </h2>
            </div>
            <Link href="/courses" className="rd-btn-secondary text-sm">
              View all courses →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredCourses.map((course) => {
              const chaps = (course as any).chapters ?? [];
              const lessons = chaps.flatMap((c: any) => c.lessons ?? []);
              const totalSec = lessons.reduce(
                (acc: number, l: any) => acc + (l.duration_sec ?? 0), 0
              );
              const instructor = (course as any).instructor;

              return (
                <CourseCard
                  key={course.id}
                  title={course.title}
                  slug={course.slug}
                  coverImage={course.cover_image}
                  instructor={{
                    name: instructor?.full_name ?? "Instructor",
                    avatar: instructor?.avatar_url,
                  }}
                  lessonCount={lessons.length}
                  durationHours={totalSec / 3600}
                  isFeatured
                  isPaid={course.is_paid}
                  price={course.price}
                  currency={course.currency}
                  tags={course.tags ?? []}
                />
              );
            })}
          </div>
        </section>
      )}

      {/* ── Testimonials ──────────────────────────────────── */}
      <section className="bg-rd-surface border-y border-rd-border py-16">
        <div className="max-w-content mx-auto px-6">
          <h2 className="font-display text-3xl font-semibold text-rd-ink text-center mb-12">
            Learners who didn&apos;t stop
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="rd-card">
                <p className="text-rd-muted leading-relaxed mb-5 text-sm">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-rd-accent text-white text-sm font-bold flex items-center justify-center shrink-0">
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-rd-ink">{t.name}</p>
                    <p className="text-xs text-rd-muted">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────── */}
      <section className="max-w-content mx-auto px-6 py-20 text-center">
        <h2 className="font-display text-4xl font-semibold text-rd-ink mb-4">
          Ready to be restless?
        </h2>
        <p className="text-rd-muted mb-8 text-lg">
          Join learners who chose curiosity over comfort.
        </p>
        <Link href="/signup" className="rd-btn text-base px-8 py-3">
          Start for Free <ArrowRight className="w-4 h-4" />
        </Link>
      </section>

      {/* ── Footer ────────────────────────────────────────── */}
      <footer className="border-t border-rd-border bg-rd-surface">
        <div className="max-w-content mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-rd-accent" />
            <span className="font-display font-semibold text-rd-ink text-sm">Restless Dreamers</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-rd-muted">
            <Link href="/courses" className="hover:text-rd-ink transition-colors">Courses</Link>
            <Link href="/login" className="hover:text-rd-ink transition-colors">Sign in</Link>
            <Link href="/signup" className="hover:text-rd-ink transition-colors">Sign up</Link>
          </div>
          <p className="text-xs text-rd-muted">Made with ❤ by Restless Dreamers</p>
        </div>
      </footer>
    </div>
  );
}
