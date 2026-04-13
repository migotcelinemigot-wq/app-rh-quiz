"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  BookOpen,
  History,
  Library,
  FileText,
  UserCircle,
  MessageSquare,
  Newspaper,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/quiz", label: "Quiz", icon: BookOpen },
  { href: "/history", label: "Historique", icon: History },
  { href: "/library", label: "Bibliothèque", icon: Library },
  { href: "/revisions", label: "Révisions", icon: FileText },
  { href: "/problematique", label: "Problématique", icon: MessageSquare },
  { href: "/veille", label: "Veille RH", icon: Newspaper },
  { href: "/profile", label: "Profil", icon: UserCircle },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-full w-56 bg-white border-r border-border flex flex-col z-10">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <h1 className="text-lg font-bold text-primary">App RH</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Formation & Compétences</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <p className="text-xs text-muted-foreground text-center">
          CC 0086 · Code du travail
        </p>
      </div>
    </aside>
  );
}
