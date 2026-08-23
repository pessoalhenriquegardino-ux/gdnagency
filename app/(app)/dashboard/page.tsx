import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WeeklyCompletedChart } from "@/components/dashboard/weekly-completed-chart";
import {
  AlertTriangle,
  CalendarClock,
  Building2,
  FolderKanban,
} from "lucide-react";
import type { Prisma } from "@prisma/client";

const WEEKDAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}
function endOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}
function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

export default async function DashboardPage() {
  const user = await requireUser();
  const isAdmin = user.role === "ADMIN";

  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  // Escopo por papel: ADMIN vê tudo, MEMBER só o que está atribuído a ele.
  const scopeTasks: Prisma.TaskWhereInput = isAdmin ? {} : { assigneeId: user.id };

  const sevenDaysAgo = new Date(todayStart);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

  const [
    tasksDueToday,
    tasksOverdue,
    activeClients,
    projectsInProgress,
    tasksByPersonRaw,
    completedThisWeek,
    overdueList,
    allUsers,
  ] = await Promise.all([
    prisma.task.count({
      where: { ...scopeTasks, dueDate: { gte: todayStart, lte: todayEnd }, status: { not: "DONE" } },
    }),
    prisma.task.count({
      where: { ...scopeTasks, dueDate: { lt: todayStart }, status: { not: "DONE" } },
    }),
    prisma.client.count({ where: { status: "ACTIVE" } }),
    prisma.project.count({
      where: {
        status: "IN_PROGRESS",
        ...(isAdmin ? {} : { tasks: { some: { assigneeId: user.id } } }),
      },
    }),
    isAdmin
      ? prisma.task.groupBy({
          by: ["assigneeId"],
          where: { status: { not: "DONE" }, assigneeId: { not: null } },
          _count: { _all: true },
        })
      : Promise.resolve([]),
    prisma.task.findMany({
      where: { ...scopeTasks, status: "DONE", updatedAt: { gte: sevenDaysAgo } },
      select: { updatedAt: true },
    }),
    prisma.task.findMany({
      where: { ...scopeTasks, dueDate: { lt: todayStart }, status: { not: "DONE" } },
      orderBy: { dueDate: "asc" },
      take: 6,
      include: { project: true, assignee: true },
    }),
    isAdmin ? prisma.user.findMany({ select: { id: true, name: true } }) : Promise.resolve([]),
  ]);

  const tasksByPerson = tasksByPersonRaw
    .map((row) => ({
      name: allUsers.find((u) => u.id === row.assigneeId)?.name ?? "Sem responsável",
      open: row._count._all,
    }))
    .sort((a, b) => b.open - a.open);

  // Monta os 7 dias da semana (dom→sáb) com contagem de tarefas concluídas
  const weeklyCompleted = Array.from({ length: 7 }).map((_, i) => {
    const day = new Date(sevenDaysAgo);
    day.setDate(day.getDate() + i);
    const count = completedThisWeek.filter((t) => {
      const d = new Date(t.updatedAt);
      return (
        d.getFullYear() === day.getFullYear() &&
        d.getMonth() === day.getMonth() &&
        d.getDate() === day.getDate()
      );
    }).length;
    return { day: WEEKDAY_LABELS[day.getDay()], concluidas: count };
  });

  const firstName = user.name?.split(" ")[0] ?? "";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Olá, {firstName} 👋</h1>
        <p className="text-sm text-muted-foreground">
          Aqui está a visão geral{isAdmin ? " da agência" : " das suas tarefas"} hoje,{" "}
          {now.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Tarefas vencendo hoje</CardTitle>
            <CalendarClock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasksDueToday}</div>
            <p className="text-xs text-muted-foreground">
              {isAdmin ? "em todos os projetos" : "atribuídas a você"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-destructive/30">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Tarefas atrasadas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{tasksOverdue}</div>
            <p className="text-xs text-muted-foreground">requerem atenção imediata</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Clientes ativos</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeClients}</div>
            <p className="text-xs text-muted-foreground">com contrato em vigor</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Projetos em andamento</CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projectsInProgress}</div>
            <p className="text-xs text-muted-foreground">status &quot;Em andamento&quot;</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground">
              Tarefas concluídas na semana
            </CardTitle>
          </CardHeader>
          <CardContent>
            <WeeklyCompletedChart data={weeklyCompleted} />
          </CardContent>
        </Card>

        {isAdmin && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold text-foreground">
                Tarefas abertas por pessoa
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {tasksByPerson.map((person) => {
                const overloaded = person.open >= 10;
                return (
                  <div key={person.name} className="flex items-center justify-between">
                    <span className="text-sm">{person.name}</span>
                    <Badge variant={overloaded ? "destructive" : "secondary"}>
                      {person.open} abertas
                    </Badge>
                  </div>
                );
              })}
              {tasksByPerson.length === 0 && (
                <p className="text-sm text-muted-foreground">Sem tarefas atribuídas ainda.</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground">Tarefas atrasadas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {overdueList.map((task) => (
            <div
              key={task.id}
              className="flex items-center justify-between rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium text-foreground">{task.title}</p>
                <p className="text-xs text-muted-foreground">
                  {task.project.name}
                  {task.assignee ? ` · ${task.assignee.name}` : ""}
                </p>
              </div>
              <Badge variant="destructive">Venceu em {formatDate(task.dueDate!)}</Badge>
            </div>
          ))}
          {overdueList.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhuma tarefa atrasada 🎉</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
