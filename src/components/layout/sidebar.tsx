"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Wand2,
  BookOpen,
  FileStack,
  Download,
  Settings,
  Shield,
  LogIn,
  UserPlus,
} from "lucide-react";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Generate", href: "/generate", icon: Wand2 },
  { name: "Books", href: "/books", icon: BookOpen },
  { name: "Templates", href: "/templates", icon: FileStack },
  { name: "Export", href: "/export", icon: Download },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  
  const isAdmin = session?.user?.role === "admin";

  return (
    <aside className="w-16 bg-sidebar border-r border-sidebar-border flex flex-col items-center py-4 gap-2">
      {/* Logo */}
      <Link 
        href="/dashboard"
        className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg mb-4 hover:opacity-90 transition-opacity"
        title="Kids Book Creator"
      >
        KB
      </Link>

      {/* Main Navigation */}
      <nav className="flex flex-col gap-1">
        {navItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "w-12 h-12 rounded-lg flex items-center justify-center transition-colors hover:bg-sidebar-accent",
              pathname === item.href && "bg-sidebar-accent text-primary"
            )}
            title={item.name}
          >
            <item.icon className="w-5 h-5" />
          </Link>
        ))}
      </nav>

      <div className="flex-1" />

      {/* Bottom Navigation */}
      <div className="flex flex-col gap-1">
        {/* Admin - only for admins */}
        {isAdmin && (
          <Link
            href="/admin"
            className={cn(
              "w-12 h-12 rounded-lg flex items-center justify-center transition-colors hover:bg-sidebar-accent",
              pathname === "/admin" && "bg-sidebar-accent text-primary"
            )}
            title="Admin"
          >
            <Shield className="w-5 h-5" />
          </Link>
        )}

        {/* Settings */}
        <Link
          href="/settings"
          className={cn(
            "w-12 h-12 rounded-lg flex items-center justify-center transition-colors hover:bg-sidebar-accent",
            pathname === "/settings" && "bg-sidebar-accent text-primary"
          )}
          title="Settings"
        >
          <Settings className="w-5 h-5" />
        </Link>

        {/* Auth Links - only when not logged in */}
        {!session && (
          <>
            <Link
              href="/auth/signin"
              className={cn(
                "w-12 h-12 rounded-lg flex items-center justify-center transition-colors hover:bg-sidebar-accent text-muted-foreground hover:text-foreground"
              )}
              title="Sign In"
            >
              <LogIn className="w-5 h-5" />
            </Link>
            <Link
              href="/auth/signup"
              className={cn(
                "w-12 h-12 rounded-lg flex items-center justify-center transition-colors bg-primary/10 hover:bg-primary/20 text-primary"
              )}
              title="Sign Up"
            >
              <UserPlus className="w-5 h-5" />
            </Link>
          </>
        )}
      </div>
    </aside>
  );
}
