import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Prisma } from "@prisma/client";

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function buildMonthGrid(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const startOffset = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export default async function CalendarioPage({
  searchParams,
}: {
  searchParams: { year?: string; month?: string; clientId?: string; assigneeId?: string };
}) {
  const user = await requireUser();
  const isAdmin = user.role === "ADMIN";

  const today = new Date();
  const year = searchParams.year ? Number(searchParams.year) : today.getFullYear();
  const month = searchParams.month ? Number(searchParams.month) - 1 : today.getMonth();

  const rangeStart = new Date(year, month, 1);
  const rangeEnd = new Date(year, month + 1, 1);

  const where: Prisma.TaskWhereInput = {
    dueDate: { gte: rangeStart, lt: rangeEnd },
  };
  if (searchParams.clientId) where.project = { clientId: searchParams.clientId };
  if (searchParams.assigneeId) where.assigneeId = searchParams.assigneeId;
  if (!isAdmin) where.assigneeId = user.id;

  const [tasks, clients, members] = await Promise.all([
    prisma.task.findMany({
      where,
      include: { project: { include: { client: true } }, assignee: true },
      orderBy: { dueDate: "asc" },
    }),
    prisma.client.findMany({ orderBy: { name: "asc" } }),
    prisma.user.findMany({ orderBy: { name: "asc" } }),
  ]);

  const cells = buildMonthGrid(year, month);

  const prevMonth = month === 0 ? { year: year - 1, month: 12 } : { year, month };
  const nextMonth = month === 11 ? { year: year + 1, month: 1 } : { year, month: month + 2 };

  function qs(params: Record<string, string | undefined>) {
    const search = new URLSearchParams();
    const merged = { year: String(year), month: String(month + 1), ...searchParams, ...params };
    for (const [k, v] of Object.entries(merged)) if (v) search.set(k, v);
    return `/calendario?${search.toString()}`;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Calendário</h1>
          <p className="text-sm text-muted-foreground">
            {isAdmin ? "Todos os prazos de tarefas." : "Seus prazos de tarefas."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={qs({ year: String(prevMonth.year), month: String(prevMonth.month) })}
            className="rounded-md border p-2 hover:bg-accent"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <span className="w-40 text-center text-sm font-medium">
            {MONTH_NAMES[month]} {year}
          </span>
          <Link
            href={qs({ year: String(nextMonth.year), month: String(nextMonth.month) })}
            className="rounded-md border p-2 hover:bg-accent"
          >
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {isAdmin && (
        <form className="flex flex-wrap gap-3" method="get">
          <input type="hidden" name="year" value={year} />
          <input type="hidden" name="month" value={month + 1} />
          <select
            name="clientId"
            defaultValue={searchParams.clientId ?? ""}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">Todos os clientes</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select
            name="assigneeId"
            defaultValue={searchParams.assigneeId ?? ""}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">Todos os responsáveis</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
          <button type="submit" className="h-10 rounded-md border border-input px-4 text-sm hover:bg-accent">
            Filtrar
          </button>
        </form>
      )}

      <Card className="overflow-hidden p-0">
        <div className="grid grid-cols-7 border-b bg-muted/40 text-center text-xs font-medium text-muted-foreground">
          {WEEKDAYS.map((d) => (
            <div key={d} className="py-2">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((date, idx) => {
            const dayTasks = date ? tasks.filter((t) => t.dueDate && sameDay(new Date(t.dueDate), date)) : [];
            const isToday = date && sameDay(date, today);
            return (
              <div
                key={idx}
                className={cn(
                  "min-h-28 border-b border-r p-1.5 last:border-r-0",
                  !date && "bg-muted/10"
                )}
              >
                {date && (
                  <>
                    <div
                      className={cn(
                        "mb-1 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs",
                        isToday && "bg-primary text-primary-foreground"
                      )}
                    >
                      {date.getDate()}
                    </div>
                    <div className="space-y-1">
                      {dayTasks.slice(0, 3).map((task) => {
                        const overdue = task.status !== "DONE" && new Date(task.dueDate!) < new Date(today.toDateString());
                        return (
                          <Link
                            key={task.id}
                            href={`/projetos/${task.projectId}`}
                            className={cn(
                              "block truncate rounded px-1.5 py-0.5 text-[11px] hover:opacity-80",
                              overdue ? "bg-destructive/15 text-destructive" : "bg-primary/10 text-primary"
                            )}
                            title={`${task.title} — ${task.project.client.name}`}
                          >
                            {task.title}
                          </Link>
                        );
                      })}
                      {dayTasks.length > 3 && (
                        <span className="block text-[10px] text-muted-foreground">
                          +{dayTasks.length - 3} mais
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-primary/60" /> No prazo
        </span>
        <span className="flex items-center gap-1">
          <Badge variant="destructive" className="h-2 w-2 rounded-full p-0" /> Atrasada
        </span>
      </div>
    </div>
  );
}
