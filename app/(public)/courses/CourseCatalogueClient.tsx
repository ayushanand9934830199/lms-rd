"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { Search, X, SlidersHorizontal, Flame } from "lucide-react";
import CourseCard from "@/components/courses/CourseCard";
import { cn } from "@/lib/utils";
import { COURSES_PER_PAGE, SEARCH_DEBOUNCE_MS } from "@/lib/constants";
import { useDebounce } from "@/lib/hooks/useDebounce";

interface RawCourse {
  id: string;
  title: string;
  slug: string;
  cover_image: string | null;
  is_featured: boolean;
  is_paid: boolean;
  price: number;
  currency: string;
  tags: string[];
  created_at: string;
  instructor: {
    id: string;
    full_name: string;
    username: string;
    avatar_url: string | null;
  } | null;
  chapters: Array<{
    id: string;
    lessons: Array<{ id: string; duration_sec: number | null }>;
  }>;
}

interface Props {
  courses: RawCourse[];
  allTags: string[];
}

type SortOption = "newest" | "oldest" | "alphabetical";

export default function CourseCatalogueClient({ courses, allTags }: Props) {
  const [search, setSearch] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [filterPaid, setFilterPaid] = useState<"all" | "free" | "paid">("all");
  const [sort, setSort] = useState<SortOption>("newest");
  const [page, setPage] = useState(1);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const debouncedSearch = useDebounce(search, SEARCH_DEBOUNCE_MS);

  const toggleTag = useCallback((tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
    setPage(1);
  }, []);

  const clearFilters = () => {
    setSearch("");
    setSelectedTags([]);
    setFilterPaid("all");
    setSort("newest");
    setPage(1);
  };

  const filtered = useMemo(() => {
    let result = [...courses];

    // Search
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.instructor?.full_name.toLowerCase().includes(q) ||
          c.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    // Tags
    if (selectedTags.length > 0) {
      result = result.filter((c) => selectedTags.every((t) => c.tags.includes(t)));
    }

    // Paid filter
    if (filterPaid === "free") result = result.filter((c) => !c.is_paid);
    if (filterPaid === "paid") result = result.filter((c) => c.is_paid);

    // Sort
    if (sort === "newest") result.sort((a, b) => b.created_at.localeCompare(a.created_at));
    if (sort === "oldest") result.sort((a, b) => a.created_at.localeCompare(b.created_at));
    if (sort === "alphabetical") result.sort((a, b) => a.title.localeCompare(b.title));

    return result;
  }, [courses, debouncedSearch, selectedTags, filterPaid, sort]);

  const totalPages = Math.ceil(filtered.length / COURSES_PER_PAGE);
  const paginated = filtered.slice((page - 1) * COURSES_PER_PAGE, page * COURSES_PER_PAGE);
  const hasFilters = debouncedSearch || selectedTags.length > 0 || filterPaid !== "all";

  const FilterPanel = () => (
    <div className="space-y-6">
      {/* Search */}
      <div>
        <label className="text-xs font-semibold uppercase tracking-widest text-rd-muted block mb-2">
          Search
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-rd-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search courses…"
            className="rd-input pl-9"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-rd-muted hover:text-rd-ink">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Tags */}
      {allTags.length > 0 && (
        <div>
          <label className="text-xs font-semibold uppercase tracking-widest text-rd-muted block mb-2">
            Topics
          </label>
          <div className="flex flex-wrap gap-2">
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={cn(
                  "rd-tag cursor-pointer transition-all",
                  selectedTags.includes(tag)
                    ? "bg-rd-accent text-white border-rd-accent"
                    : "hover:bg-rd-accent-lt"
                )}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Type */}
      <div>
        <label className="text-xs font-semibold uppercase tracking-widest text-rd-muted block mb-2">
          Type
        </label>
        <div className="space-y-1.5">
          {(["all", "free", "paid"] as const).map((opt) => (
            <label key={opt} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="filterPaid"
                checked={filterPaid === opt}
                onChange={() => { setFilterPaid(opt); setPage(1); }}
                className="accent-rd-accent"
              />
              <span className="text-sm text-rd-ink capitalize">{opt === "all" ? "All courses" : opt}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Sort */}
      <div>
        <label className="text-xs font-semibold uppercase tracking-widest text-rd-muted block mb-2">
          Sort by
        </label>
        <select
          value={sort}
          onChange={(e) => { setSort(e.target.value as SortOption); setPage(1); }}
          className="rd-input text-sm"
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="alphabetical">A → Z</option>
        </select>
      </div>

      {/* Clear */}
      {hasFilters && (
        <button onClick={clearFilters} className="text-sm text-rd-accent hover:text-rd-accent-dk font-medium">
          Clear all filters
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-rd-paper">
      {/* Top nav */}
      <nav className="sticky top-0 z-40 bg-rd-paper/80 backdrop-blur-sm border-b border-rd-border">
        <div className="max-w-content mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-rd-accent" />
            <span className="font-display font-semibold text-rd-ink">Restless Dreamers</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="rd-btn-secondary text-sm">Sign in</Link>
            <Link href="/signup" className="rd-btn text-sm">Start for free</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-content mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-4xl font-semibold text-rd-ink mb-2">All Courses</h1>
          <p className="text-rd-muted">
            {courses.length} course{courses.length !== 1 ? "s" : ""} to explore
          </p>
        </div>

        {/* Mobile filter toggle */}
        <button
          className="md:hidden flex items-center gap-2 rd-btn-secondary text-sm mb-4 w-full justify-center"
          onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
        >
          <SlidersHorizontal className="w-4 h-4" />
          {mobileFilterOpen ? "Hide filters" : "Show filters"}
          {hasFilters && (
            <span className="w-5 h-5 rounded-full bg-rd-accent text-white text-[10px] font-bold flex items-center justify-center">
              {(selectedTags.length + (filterPaid !== "all" ? 1 : 0) + (search ? 1 : 0))}
            </span>
          )}
        </button>

        <div className="flex gap-8">
          {/* Filter panel desktop */}
          <aside className="hidden md:block w-filter-panel shrink-0">
            <div className="sticky top-20">
              <FilterPanel />
            </div>
          </aside>

          {/* Mobile filter panel */}
          {mobileFilterOpen && (
            <div className="md:hidden fixed inset-0 z-50 bg-rd-paper overflow-y-auto p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-xl font-semibold">Filters</h2>
                <button onClick={() => setMobileFilterOpen(false)}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              <FilterPanel />
              <button
                className="rd-btn w-full mt-6"
                onClick={() => setMobileFilterOpen(false)}
              >
                Show {filtered.length} result{filtered.length !== 1 ? "s" : ""}
              </button>
            </div>
          )}

          {/* Course grid */}
          <div className="flex-1 min-w-0">
            {paginated.length === 0 ? (
              <div className="text-center py-20">
                <BookOpenEmpty />
                <p className="text-rd-muted mt-4">No courses match your filters.</p>
                {hasFilters && (
                  <button onClick={clearFilters} className="rd-btn mt-4">Clear filters</button>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {paginated.map((course) => {
                    const lessons = course.chapters.flatMap((c) => c.lessons);
                    const totalSec = lessons.reduce((acc, l) => acc + (l.duration_sec ?? 0), 0);

                    return (
                      <CourseCard
                        key={course.id}
                        title={course.title}
                        slug={course.slug}
                        coverImage={course.cover_image}
                        instructor={{
                          name: course.instructor?.full_name ?? "Instructor",
                          avatar: course.instructor?.avatar_url,
                        }}
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

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-10">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="rd-btn-secondary text-sm px-3 py-1.5 disabled:opacity-40"
                    >
                      ← Prev
                    </button>
                    <span className="text-sm text-rd-muted px-3">
                      Page {page} of {totalPages}
                    </span>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="rd-btn-secondary text-sm px-3 py-1.5 disabled:opacity-40"
                    >
                      Next →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function BookOpenEmpty() {
  return (
    <div className="w-16 h-16 mx-auto rounded-full bg-rd-accent-lt flex items-center justify-center">
      <Search className="w-7 h-7 text-rd-accent" />
    </div>
  );
}
