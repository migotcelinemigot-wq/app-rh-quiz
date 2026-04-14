"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, BookOpen, History, Library,
  FileText, UserCircle, MessageSquare, Newspaper,
  ChevronLeft, ChevronRight,
} from "lucide-react";

const navItems = [
  { href: "/",              label: "Dashboard",      icon: LayoutDashboard },
  { href: "/quiz",          label: "Quiz",           icon: BookOpen },
  { href: "/history",       label: "Historique",     icon: History },
  { href: "/library",       label: "Bibliothèque",   icon: Library },
  { href: "/revisions",     label: "Révisions",      icon: FileText },
  { href: "/problematique", label: "Problématique",  icon: MessageSquare },
  { href: "/veille",        label: "Veille RH",      icon: Newspaper },
  { href: "/profile",       label: "Profil",         icon: UserCircle },
];

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  // Mémoriser la préférence
  useEffect(() => {
    const saved = localStorage.getItem("navCollapsed");
    if (saved === "true") setCollapsed(true);
  }, []);

  const toggle = () => {
    setCollapsed((v) => {
      localStorage.setItem("navCollapsed", String(!v));
      return !v;
    });
  };

  const sidebarWidth = collapsed ? "w-16" : "w-56";
  const mainMargin  = collapsed ? "ml-16" : "ml-56";

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={cn(
        "fixed left-0 top-0 h-full bg-white border-r border-border flex flex-col z-10 transition-all duration-300",
        sidebarWidth
      )}>
        {/* Logo + bouton toggle */}
        <div className="p-4 border-b border-border flex items-center justify-between min-h-[72px]">
          {!collapsed && (
            <div>
              <h1 className="text-lg font-bold text-primary leading-tight">App RH</h1>
              <p className="text-xs text-muted-foreground mt-0.5">Formation & Compétences</p>
            </div>
          )}
          <button
            onClick={toggle}
            className={cn(
              "h-7 w-7 rounded-full border border-border bg-white hover:bg-accent flex items-center justify-center transition-colors flex-shrink-0",
              collapsed && "mx-auto"
            )}
            title={collapsed ? "Ouvrir le menu" : "Réduire le menu"}
          >
            {collapsed
              ? <ChevronRight className="h-4 w-4 text-muted-foreground" />
              : <ChevronLeft  className="h-4 w-4 text-muted-foreground" />
            }
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                title={collapsed ? label : undefined}
                className={cn(
                  "flex items-center gap-3 px-2 py-2.5 rounded-md text-sm font-medium transition-colors",
                  collapsed ? "justify-center" : "",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                {!collapsed && <span>{label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        {!collapsed && (
          <div className="p-4 border-t border-border">
            <p className="text-xs text-muted-foreground text-center">CC 0086 · Code du travail</p>
          </div>
        )}
      </aside>

      {/* Contenu principal */}
      <main className={cn("flex-1 p-8 min-h-screen transition-all duration-300", mainMargin)}>
        {children}
      </main>
    </div>
  );
}
