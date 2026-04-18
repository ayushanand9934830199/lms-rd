"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  BookOpen,
  Calendar,
  MessageSquare,
  Award,
  Briefcase,
  User,
  Bell,
  Settings,
  PlusCircle,
  LayoutDashboard,
  Users,
  ClipboardList,
  Flame,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/constants";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
}

interface SidebarProps {
  role: UserRole;
  unreadCount?: number;
}

const learnNav: NavItem[] = [
  { href: "/my-courses", label: "My Courses", icon: BookOpen },
  { href: "/batches",    label: "Batches",    icon: Calendar },
  { href: "/discussions", label: "Discussions", icon: MessageSquare },
  { href: "/certificates", label: "Certificates", icon: Award },
  { href: "/jobs",       label: "Jobs",       icon: Briefcase },
];

const accountNav: NavItem[] = [
  { href: "/profile",    label: "Profile",      icon: User },
  { href: "/settings",   label: "Settings",     icon: Settings },
];

const manageNav: NavItem[] = [
  { href: "/admin/dashboard",  label: "Dashboard",   icon: LayoutDashboard },
  { href: "/admin/courses/new", label: "New Course",  icon: PlusCircle },
  { href: "/admin/students",   label: "Students",    icon: Users },
  { href: "/admin/evaluations", label: "Evaluations", icon: ClipboardList },
];

export default function Sidebar({ role, unreadCount = 0 }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/my-courses") return pathname === "/my-courses" || pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-sidebar bg-rd-surface border-r border-rd-border flex flex-col z-30">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 h-14 border-b border-rd-border shrink-0">
        <Flame className="w-5 h-5 text-rd-accent shrink-0" />
        <span className="font-display text-rd-ink font-semibold text-sm leading-tight">
          Restless<br />Dreamers
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-6">
        {/* LEARN section */}
        <div>
          <p className="rd-section-title">Learn</p>
          <ul className="space-y-0.5">
            {/* Home is always first */}
            <li>
              <Link
                href="/my-courses"
                className={cn("sidebar-link", isActive("/my-courses") && "active")}
              >
                <Home className="w-4 h-4 shrink-0" />
                <span>Home</span>
              </Link>
            </li>
            {learnNav.slice(1).map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn("sidebar-link", isActive(item.href) && "active")}
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* ACCOUNT section */}
        <div>
          <p className="rd-section-title">Account</p>
          <ul className="space-y-0.5">
            {accountNav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn("sidebar-link", isActive(item.href) && "active")}
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
            {/* Notifications with badge */}
            <li>
              <Link
                href="/notifications"
                className={cn("sidebar-link", isActive("/notifications") && "active")}
              >
                <Bell className="w-4 h-4 shrink-0" />
                <span className="flex-1">Notifications</span>
                {unreadCount > 0 && (
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-rd-danger text-white text-[10px] font-bold">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>
            </li>
          </ul>
        </div>

        {/* MANAGE section — instructor/moderator only */}
        {(role === "instructor" || role === "moderator") && (
          <div>
            <p className="rd-section-title">Manage</p>
            <ul className="space-y-0.5">
              {manageNav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn("sidebar-link", isActive(item.href) && "active")}
                  >
                    <item.icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </nav>

      {/* Browse courses link at bottom */}
      <div className="px-2 py-3 border-t border-rd-border shrink-0">
        <Link
          href="/courses"
          className={cn("sidebar-link text-rd-muted", isActive("/courses") && "active")}
        >
          <BookOpen className="w-4 h-4 shrink-0" />
          <span>Browse Courses</span>
        </Link>
      </div>
    </aside>
  );
}
