import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Github, Linkedin, Globe, BookOpen, Award } from "lucide-react";
import { formatDate } from "@/lib/utils";
import CourseCard from "@/components/courses/CourseCard";
import type { Metadata } from "next";

interface Props { params: { username: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("full_name, headline").eq("username", params.username).single();
  return { title: data?.full_name ?? "Profile", description: data?.headline ?? undefined };
}

export default async function ProfilePage({ params }: Props) {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", params.username)
    .single();

  if (!profile) notFound();

  const isInstructor = profile.role === "instructor" || profile.role === "moderator";

  // Instructor courses
  let courses: any[] = [];
  if (isInstructor) {
    const { data } = await supabase
      .from("courses")
      .select(`
        id, title, slug, cover_image, is_featured, is_paid, price, currency, tags, created_at,
        chapters(id, lessons(id, duration_sec)),
        enrollments:enrollments(count)
      `)
      .eq("instructor_id", profile.id)
      .eq("status", "published")
      .order("created_at", { ascending: false });
    courses = data ?? [];
  }

  // Certificates earned
  const { data: certificates } = await supabase
    .from("certificates")
    .select("id, cert_id, issued_at, course:courses(title)")
    .eq("student_id", profile.id)
    .order("issued_at", { ascending: false })
    .limit(5);

  return (
    <div className="min-h-screen bg-rd-paper">
      <div className="max-w-content mx-auto px-6 py-10">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <div className="md:w-72 shrink-0">
            <div className="rd-card sticky top-20">
              {/* Avatar */}
              <div className="flex flex-col items-center text-center mb-5">
                <div className="w-20 h-20 rounded-full bg-rd-accent text-white text-2xl font-bold flex items-center justify-center overflow-hidden mb-3">
                  {profile.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
                  ) : (
                    profile.full_name[0]
                  )}
                </div>
                <h1 className="font-display text-xl font-semibold text-rd-ink">{profile.full_name}</h1>
                <p className="text-xs text-rd-muted">@{profile.username}</p>
                {profile.role !== "student" && (
                  <span className="mt-2 rd-badge capitalize">{profile.role}</span>
                )}
              </div>

              {/* Headline */}
              {profile.headline && (
                <p className="text-sm text-rd-muted text-center mb-4">{profile.headline}</p>
              )}

              {/* Bio */}
              {profile.bio && (
                <p className="text-sm text-rd-ink leading-relaxed border-t border-rd-border pt-4 mb-4">
                  {profile.bio}
                </p>
              )}

              {/* Social links */}
              <div className="flex flex-col gap-2">
                {profile.github_url && (
                  <a href={profile.github_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-rd-muted hover:text-rd-ink transition-colors">
                    <Github className="w-4 h-4 shrink-0" /> GitHub
                  </a>
                )}
                {profile.linkedin_url && (
                  <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-rd-muted hover:text-rd-ink transition-colors">
                    <Linkedin className="w-4 h-4 shrink-0" /> LinkedIn
                  </a>
                )}
                {profile.website_url && (
                  <a href={profile.website_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-rd-muted hover:text-rd-ink transition-colors">
                    <Globe className="w-4 h-4 shrink-0" /> Website
                  </a>
                )}
              </div>

              {/* Joined */}
              <p className="text-xs text-rd-muted mt-4 pt-4 border-t border-rd-border">
                Joined {formatDate(profile.created_at)}
              </p>
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Instructor courses */}
            {isInstructor && courses.length > 0 && (
              <section className="mb-10">
                <h2 className="font-display text-2xl font-semibold text-rd-ink flex items-center gap-2 mb-5">
                  <BookOpen className="w-5 h-5 text-rd-accent" />
                  Courses ({courses.length})
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {courses.map((course) => {
                    const lessons = (course.chapters ?? []).flatMap((c: any) => c.lessons ?? []);
                    const totalSec = lessons.reduce((a: number, l: any) => a + (l.duration_sec ?? 0), 0);
                    return (
                      <CourseCard
                        key={course.id}
                        title={course.title}
                        slug={course.slug}
                        coverImage={course.cover_image}
                        instructor={{ name: profile.full_name, avatar: profile.avatar_url }}
                        lessonCount={lessons.length}
                        durationHours={totalSec / 3600}
                        isFeatured={course.is_featured}
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

            {/* Certificates */}
            {certificates && certificates.length > 0 && (
              <section>
                <h2 className="font-display text-2xl font-semibold text-rd-ink flex items-center gap-2 mb-5">
                  <Award className="w-5 h-5 text-rd-accent" />
                  Certificates ({certificates.length})
                </h2>
                <div className="space-y-2">
                  {certificates.map((cert: any) => (
                    <a
                      key={cert.id}
                      href={`/verify/${cert.cert_id}`}
                      className="flex items-center justify-between rd-card hover:border-rd-accent transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <Award className="w-5 h-5 text-rd-accent shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-rd-ink">{cert.course?.title}</p>
                          <p className="text-xs text-rd-muted">{formatDate(cert.issued_at)}</p>
                        </div>
                      </div>
                      <span className="text-xs text-rd-accent group-hover:text-rd-accent-dk font-mono">{cert.cert_id}</span>
                    </a>
                  ))}
                </div>
              </section>
            )}

            {/* Empty state for students */}
            {!isInstructor && (!certificates || certificates.length === 0) && (
              <div className="text-center py-16">
                <p className="text-rd-muted">No public activity yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
