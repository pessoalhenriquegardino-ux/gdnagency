"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

const projectSchema = z.object({
  name: z.string().min(2, "Informe o nome do projeto"),
  clientId: z.string().min(1, "Selecione um cliente"),
  status: z.enum(["PLANNING", "IN_PROGRESS", "DONE", "ON_HOLD"]),
  startDate: z
    .string()
    .optional()
    .transform((v) => (v ? new Date(v) : null)),
  dueDate: z
    .string()
    .optional()
    .transform((v) => (v ? new Date(v) : null)),
});

export type ProjectFormState = { error?: string } | undefined;

export async function createProject(_prev: ProjectFormState, formData: FormData): Promise<ProjectFormState> {
  await requireAdmin();

  const parsed = projectSchema.safeParse({
    name: formData.get("name"),
    clientId: formData.get("clientId"),
    status: formData.get("status"),
    startDate: formData.get("startDate"),
    dueDate: formData.get("dueDate"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const project = await prisma.project.create({ data: parsed.data });

  revalidatePath("/projetos");
  revalidatePath(`/clientes/${parsed.data.clientId}`);
  redirect(`/projetos/${project.id}`);
}

export async function deleteProject(id: string) {
  await requireAdmin();
  const project = await prisma.project.delete({ where: { id } });
  revalidatePath("/projetos");
  revalidatePath(`/clientes/${project.clientId}`);
}
