import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClientFormDialog } from "./client-form-dialog";
import { DeleteClientButton } from "./delete-client-button";

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Ativo",
  PAUSED: "Pausado",
  ENDED: "Encerrado",
};

const STATUS_VARIANT: Record<string, "success" | "warning" | "secondary"> = {
  ACTIVE: "success",
  PAUSED: "warning",
  ENDED: "secondary",
};

function formatCurrency(value: unknown) {
  if (value === null || value === undefined) return "—";
  const n = Number(value);
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function ClientesPage() {
  const user = await requireUser();
  const isAdmin = user.role === "ADMIN";

  const clients = await prisma.client.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { projects: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Clientes</h1>
          <p className="text-sm text-muted-foreground">
            Cadastro e status dos clientes da agência.
          </p>
        </div>
        {isAdmin && <ClientFormDialog />}
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="px-6 py-3 font-medium">Nome</th>
                <th className="px-6 py-3 font-medium">Valor mensal</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Projetos</th>
                {isAdmin && <th className="px-6 py-3 font-medium text-right">Ações</th>}
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr key={client.id} className="border-b last:border-0 hover:bg-accent/40">
                  <td className="px-6 py-3">
                    <Link href={`/clientes/${client.id}`} className="font-medium hover:underline">
                      {client.name}
                    </Link>
                  </td>
                  <td className="px-6 py-3 text-muted-foreground">
                    {formatCurrency(client.monthlyValue)}
                  </td>
                  <td className="px-6 py-3">
                    <Badge variant={STATUS_VARIANT[client.status]}>
                      {STATUS_LABEL[client.status]}
                    </Badge>
                  </td>
                  <td className="px-6 py-3 text-muted-foreground">{client._count.projects}</td>
                  {isAdmin && (
                    <td className="px-6 py-3">
                      <div className="flex justify-end gap-1">
                        <ClientFormDialog
                          client={{
                            id: client.id,
                            name: client.name,
                            monthlyValue: client.monthlyValue?.toString() ?? null,
                            status: client.status,
                          }}
                        />
                        <DeleteClientButton id={client.id} name={client.name} />
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {clients.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                    Nenhum cliente cadastrado ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
