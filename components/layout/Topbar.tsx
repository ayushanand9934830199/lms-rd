"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  ChevronDown,
  LogOut,
  Settings,
  User,
  BookOpen,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn, timeAgo } from "@/lib/utils";
import type { Profile, Notification } from "@/types/database";

interface TopbarProps {
  profile: Profile;
  breadcrumbs?: { label: string; href?: string }[];
  notifications?: Notification[];
}

export default function Topbar({
  profile,
  breadcrumbs = [],
  notifications = [],
}: TopbarProps) {
  const router = useRouter();
  const supabase = createClient();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs] = useState<Notification[]>(notifications);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifs.filter((n) => !n.read).length;

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Realtime notification subscription
  useEffect(() => {
    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${profile.id}`,
        },
        (payload) => {
          setNotifs((prev) => [payload.new as Notification, ...prev].slice(0, 20));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [profile.id, supabase]);

  const markAllRead = async () => {
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", profile.id)
      .eq("read", false);
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const avatarFallback = profile.full_name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="h-14 bg-rd-surface border-b border-rd-border flex items-center px-4 gap-4">
      {/* Breadcrumbs */}
      <nav className="flex-1 flex items-center gap-1.5 text-sm overflow-hidden">
        {breadcrumbs.map((crumb, i) => (
          <span key={i} className="flex items-center gap-1.5 min-w-0">
            {i > 0 && <span className="text-rd-border">/</span>}
            {crumb.href ? (
              <Link
                href={crumb.href}
                className="text-rd-muted hover:text-rd-ink truncate transition-colors"
              >
                {crumb.label}
              </Link>
            ) : (
              <span className="text-rd-ink font-medium truncate">{crumb.label}</span>
            )}
          </span>
        ))}
      </nav>

      {/* Notification Bell */}
      <div className="relative" ref={notifRef}>
        <button
          onClick={() => { setNotifOpen(!notifOpen); setDropdownOpen(false); }}
          className="relative w-8 h-8 flex items-center justify-center rounded-md hover:bg-rd-accent-lt text-rd-muted hover:text-rd-ink transition-colors"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-rd-danger text-white text-[9px] font-bold rounded-full flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        {notifOpen && (
          <div className="absolute right-0 top-10 w-80 bg-rd-surface border border-rd-border rounded-card shadow-sm z-50 overflow-hidden animate-fade-in">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-rd-border">
              <span className="text-sm font-semibold text-rd-ink">Notifications</span>
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-xs text-rd-accent hover:text-rd-accent-dk">
                  Mark all read
                </button>
              )}
            </div>
            <ul className="max-h-80 overflow-y-auto divide-y divide-rd-border">
              {notifs.length === 0 ? (
                <li className="px-4 py-8 text-center text-sm text-rd-muted">
                  No notifications yet
                </li>
              ) : (
                notifs.slice(0, 10).map((n) => (
                  <li key={n.id}>
                    <Link
                      href={n.link || "#"}
                      onClick={() => setNotifOpen(false)}
                      className={cn(
                        "flex gap-3 px-4 py-3 hover:bg-rd-accent-lt transition-colors",
                        !n.read && "bg-amber-50/60"
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-xs font-medium text-rd-ink leading-snug", !n.read && "font-semibold")}>
                          {n.title}
                        </p>
                        {n.body && (
                          <p className="text-xs text-rd-muted mt-0.5 truncate">{n.body}</p>
                        )}
                        <p className="text-[10px] text-rd-muted mt-1">{timeAgo(n.created_at)}</p>
                      </div>
                      {!n.read && (
                        <div className="w-2 h-2 rounded-full bg-rd-accent shrink-0 mt-1" />
                      )}
                    </Link>
                  </li>
                ))
              )}
            </ul>
            <div className="px-4 py-2 border-t border-rd-border">
              <Link href="/notifications" className="text-xs text-rd-accent hover:text-rd-accent-dk font-medium" onClick={() => setNotifOpen(false)}>
                View all →
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* User Avatar Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => { setDropdownOpen(!dropdownOpen); setNotifOpen(false); }}
          className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-md hover:bg-rd-accent-lt transition-colors"
        >
          <div className="w-7 h-7 rounded-full bg-rd-accent text-white text-xs font-bold flex items-center justify-center overflow-hidden">
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
            ) : (
              avatarFallback
            )}
          </div>
          <span className="text-sm font-medium text-rd-ink max-w-[120px] truncate hidden sm:block">
            {profile.full_name.split(" ")[0]}
          </span>
          <ChevronDown className="w-3 h-3 text-rd-muted hidden sm:block" />
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 top-10 w-52 bg-rd-surface border border-rd-border rounded-card shadow-sm z-50 py-1 animate-fade-in">
            <div className="px-3 py-2 border-b border-rd-border mb-1">
              <p className="text-sm font-semibold text-rd-ink truncate">{profile.full_name}</p>
              <p className="text-xs text-rd-muted truncate">@{profile.username}</p>
            </div>
            <Link href={`/profile/${profile.username}`} className="flex items-center gap-2 px-3 py-2 text-sm text-rd-muted hover:text-rd-ink hover:bg-rd-accent-lt transition-colors" onClick={() => setDropdownOpen(false)}>
              <User className="w-4 h-4" /> Profile
            </Link>
            <Link href="/my-courses" className="flex items-center gap-2 px-3 py-2 text-sm text-rd-muted hover:text-rd-ink hover:bg-rd-accent-lt transition-colors" onClick={() => setDropdownOpen(false)}>
              <BookOpen className="w-4 h-4" /> My Courses
            </Link>
            <Link href="/settings" className="flex items-center gap-2 px-3 py-2 text-sm text-rd-muted hover:text-rd-ink hover:bg-rd-accent-lt transition-colors" onClick={() => setDropdownOpen(false)}>
              <Settings className="w-4 h-4" /> Settings
            </Link>
            <div className="border-t border-rd-border mt-1 pt-1">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rd-danger hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" /> Sign out
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
