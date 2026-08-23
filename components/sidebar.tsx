"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Building2,
  FolderKanban,
  CalendarDays,
  Users,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clientes", label: "Clientes", icon: Building2 },
  { href: "/projetos", label: "Projetos", icon: FolderKanban },
  { href: "/calendario", label: "Calendário", icon: CalendarDays },
  { href: "/equipe", label: "Equipe", icon: Users },
];

type SidebarProps = {
  userName: string;
  userRole: "ADMIN" | "MEMBER";
  onSignOut: () => Promise<void>;
};

export function Sidebar({ userName, userRole, onSignOut }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r bg-card">
      <div className="flex items-center gap-2 border-b px-6 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
          G
        </div>
        <div>
          <p className="text-sm font-semibold leading-tight">GDN Agency</p>
          <p className="text-xs text-muted-foreground">Gestão interna</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-3">
        <div className="mb-2 flex items-center gap-3 rounded-md px-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-xs font-semibold">
            {userName.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{userName}</p>
            <p className="text-xs text-muted-foreground">
              {userRole === "ADMIN" ? "Administrador" : "Membro da equipe"}
            </p>
          </div>
        </div>
        <form action={onSignOut}>
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-3 text-muted-foreground"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </form>
      </div>
    </aside>
  );
}
