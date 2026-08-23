import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProjectFormDialog } from "./project-form-dialog";
import type { Prisma } from "@prisma/client";

const STATUS_LABEL: Record<string, string> = {
  PLANNING: "Planejamento",
  IN_PROGRESS: "Em andamento",
  DONE: "Concluído",
  ON_HOLD: "Em espera",
};

const STATUS_VARIANT: Record<string, "success" | "warning" | "secondary" | "default"> = {
  PLANNING: "secondary",
  IN_PROGRESS: "default",
  DONE: "success",
  ON_HOLD: "warning",
};

function formatDate(date: Date | null) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("pt-BR");
}

export default async function ProjetosPage({
  searchParams,
}: {
  searchParams: { clientId?: string; status?: string };
}) {
  const user = await requireUser();
  const isAdmin = user.role === "ADMIN";

  const where: Prisma.ProjectWhereInput = {};
  if (searchParams.clientId) where.clientId = searchParams.clientId;
  if (searchParams.status) where.status = searchParams.status as Prisma.EnumProjectStatusFilter["equals"];

  // MEMBER só vê projetos onde tem ao menos uma tarefa atribuída.
  if (!isAdmin) {
    where.tasks = { some: { assigneeId: user.id } };
  }

  const [projects, clients] = await Promise.all([
    prisma.project.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { client: true, _count: { select: { tasks: true } } },
    }),
    prisma.client.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Projetos</h1>
          <p className="text-sm text-muted-foreground">
            {isAdmin
              ? "Todos os projetos da agência, filtráveis por cliente e status."
              : "Projetos em que você tem tarefas atribuídas."}
          </p>
        </div>
        {isAdmin && <ProjectFormDialog clients={clients} />}
      </div>

      {/* Filtros via querystring — funcionam sem JS */}
      <form className="flex flex-wrap gap-3" method="get">
        <select
          name="clientId"
          defaultValue={searchParams.clientId ?? ""}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">Todos os clientes</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          name="status"
          defaultValue={searchParams.status ?? ""}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">Todos os status</option>
          {Object.entries(STATUS_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        <button
          type="submit"
          className="h-10 rounded-md border border-input px-4 text-sm hover:bg-accent"
        >
          Filtrar
        </button>
        {(searchParams.clientId || searchParams.status) && (
          <Link
            href="/projetos"
            className="flex h-10 items-center px-2 text-sm text-muted-foreground hover:text-foreground"
          >
            Limpar filtros
          </Link>
        )}
      </form>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <Link key={project.id} href={`/projetos/${project.id}`}>
            <Card className="h-full transition-colors hover:bg-accent/40">
              <CardContent className="space-y-3 p-5">
                <div className="flex items-start justify-between">
                  <h3 className="font-medium leading-tight">{project.name}</h3>
                  <Badge variant={STATUS_VARIANT[project.status]}>
                    {STATUS_LABEL[project.status]}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{project.client.name}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{project._count.tasks} tarefa(s)</span>
                  <span>Prazo: {formatDate(project.dueDate)}</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
        {projects.length === 0 && (
          <p className="col-span-full py-8 text-center text-sm text-muted-foreground">
            Nenhum projeto encontrado.
          </p>
        )}
      </div>
    </div>
  );
}
