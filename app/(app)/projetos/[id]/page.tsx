import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { KanbanBoard } from "./kanban-board";

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

export default async function ProjetoKanbanPage({ params }: { params: { id: string } }) {
  const user = await requireUser();

  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: { client: true },
  });
  if (!project) notFound();

  // MEMBER só acessa o Kanban se tiver ao menos uma tarefa atribuída no projeto.
  if (user.role !== "ADMIN") {
    const hasTask = await prisma.task.findFirst({
      where: { projectId: project.id, assigneeId: user.id },
      select: { id: true },
    });
    if (!hasTask) redirect("/projetos");
  }

  const [tasks, members] = await Promise.all([
    prisma.task.findMany({
      where: { projectId: project.id },
      orderBy: { order: "asc" },
      include: { assignee: true, comments: { include: { author: true }, orderBy: { createdAt: "asc" } } },
    }),
    prisma.user.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, email: true } }),
  ]);

  return (
    <div className="space-y-6">
      <Link
        href="/projetos"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para projetos
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{project.name}</h1>
          <p className="text-sm text-muted-foreground">
            <Link href={`/clientes/${project.clientId}`} className="hover:underline">
              {project.client.name}
            </Link>
          </p>
        </div>
        <Badge variant={STATUS_VARIANT[project.status]}>{STATUS_LABEL[project.status]}</Badge>
      </div>

      <KanbanBoard projectId={project.id} initialTasks={tasks} members={members} />
    </div>
  );
}
