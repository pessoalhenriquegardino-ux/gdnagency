import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AlertTriangle } from "lucide-react";

// Limiares de sobrecarga — ajustáveis conforme a realidade da agência.
const OVERLOAD_TASKS_THRESHOLD = 10;
const OVERLOAD_HOURS_THRESHOLD = 40;

export default async function EquipePage() {
  const user = await requireUser();
  // Carga de trabalho é uma visão gerencial — só faz sentido para ADMIN.
  if (user.role !== "ADMIN") redirect("/dashboard");

  const users = await prisma.user.findMany({
    orderBy: { name: "asc" },
    include: {
      tasks: {
        where: { status: { not: "DONE" } },
        select: { estimatedHours: true, status: true, dueDate: true },
      },
    },
  });

  const rows = users.map((u) => {
    const openTasks = u.tasks.length;
    const totalHours = u.tasks.reduce((sum, t) => sum + Number(t.estimatedHours ?? 0), 0);
    const overdueTasks = u.tasks.filter((t) => t.dueDate && new Date(t.dueDate) < new Date(new Date().toDateString())).length;
    const overloaded = openTasks >= OVERLOAD_TASKS_THRESHOLD || totalHours >= OVERLOAD_HOURS_THRESHOLD;
    return { id: u.id, name: u.name, role: u.role, openTasks, totalHours, overdueTasks, overloaded };
  });

  const maxTasks = Math.max(1, ...rows.map((r) => r.openTasks));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Equipe</h1>
        <p className="text-sm text-muted-foreground">
          Carga de trabalho de cada pessoa da agência (tarefas em aberto).
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {rows.map((row) => (
          <Card key={row.id} className={row.overloaded ? "border-destructive/40" : undefined}>
            <CardContent className="space-y-3 p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>{row.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium leading-tight">{row.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {row.role === "ADMIN" ? "Administrador" : "Membro da equipe"}
                    </p>
                  </div>
                </div>
                {row.overloaded && (
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Sobrecarregado
                  </Badge>
                )}
              </div>

              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={row.overloaded ? "h-full bg-destructive" : "h-full bg-primary"}
                  style={{ width: `${Math.min(100, (row.openTasks / maxTasks) * 100)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <span>
                  <strong>{row.openTasks}</strong>{" "}
                  <span className="text-muted-foreground">tarefas abertas</span>
                </span>
                <span>
                  <strong>{row.totalHours}h</strong>{" "}
                  <span className="text-muted-foreground">estimadas</span>
                </span>
                {row.overdueTasks > 0 && (
                  <span className="text-destructive">{row.overdueTasks} atrasada(s)</span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {rows.length === 0 && (
          <p className="col-span-full py-8 text-center text-sm text-muted-foreground">
            Nenhum membro cadastrado ainda.
          </p>
        )}
      </div>
    </div>
  );
}
