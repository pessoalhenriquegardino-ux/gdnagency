import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Ativo",
  PAUSED: "Pausado",
  ENDED: "Encerrado",
  PLANNING: "Planejamento",
  IN_PROGRESS: "Em andamento",
  DONE: "Concluído",
  ON_HOLD: "Em espera",
};

const CLIENT_STATUS_VARIANT: Record<string, "success" | "warning" | "secondary"> = {
  ACTIVE: "success",
  PAUSED: "warning",
  ENDED: "secondary",
};

const PROJECT_STATUS_VARIANT: Record<string, "success" | "warning" | "secondary" | "default"> = {
  PLANNING: "secondary",
  IN_PROGRESS: "default",
  DONE: "success",
  ON_HOLD: "warning",
};

function formatCurrency(value: unknown) {
  if (value === null || value === undefined) return "—";
  return Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(date: Date | null) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("pt-BR");
}

export default async function ClienteDetalhePage({ params }: { params: { id: string } }) {
  await requireUser();

  const client = await prisma.client.findUnique({
    where: { id: params.id },
    include: {
      projects: {
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { tasks: true } } },
      },
    },
  });

  if (!client) notFound();

  return (
    <div className="space-y-6">
      <Link
        href="/clientes"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para clientes
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{client.name}</h1>
          <p className="text-sm text-muted-foreground">
            {formatCurrency(client.monthlyValue)} / mês
          </p>
        </div>
        <Badge variant={CLIENT_STATUS_VARIANT[client.status]}>{STATUS_LABEL[client.status]}</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground">
            Projetos ({client.projects.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {client.projects.map((project) => (
            <Link
              key={project.id}
              href={`/projetos/${project.id}`}
              className="flex items-center justify-between rounded-md border px-4 py-3 hover:bg-accent/40"
            >
              <div>
                <p className="text-sm font-medium">{project.name}</p>
                <p className="text-xs text-muted-foreground">
                  {project._count.tasks} tarefa(s) · prazo {formatDate(project.dueDate)}
                </p>
              </div>
              <Badge variant={PROJECT_STATUS_VARIANT[project.status]}>
                {STATUS_LABEL[project.status]}
              </Badge>
            </Link>
          ))}
          {client.projects.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Nenhum projeto cadastrado para este cliente ainda.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
