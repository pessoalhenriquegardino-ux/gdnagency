"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

const clientSchema = z.object({
  name: z.string().min(2, "Informe o nome do cliente"),
  monthlyValue: z
    .string()
    .optional()
    .transform((v) => (v && v.trim() !== "" ? Number(v) : null)),
  status: z.enum(["ACTIVE", "PAUSED", "ENDED"]),
});

export type ClientFormState = { error?: string } | undefined;

export async function createClient(_prev: ClientFormState, formData: FormData): Promise<ClientFormState> {
  await requireAdmin();

  const parsed = clientSchema.safeParse({
    name: formData.get("name"),
    monthlyValue: formData.get("monthlyValue"),
    status: formData.get("status"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  await prisma.client.create({
    data: {
      name: parsed.data.name,
      monthlyValue: parsed.data.monthlyValue,
      status: parsed.data.status,
    },
  });

  revalidatePath("/clientes");
  return undefined;
}

export async function updateClient(
  id: string,
  _prev: ClientFormState,
  formData: FormData
): Promise<ClientFormState> {
  await requireAdmin();

  const parsed = clientSchema.safeParse({
    name: formData.get("name"),
    monthlyValue: formData.get("monthlyValue"),
    status: formData.get("status"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  await prisma.client.update({
    where: { id },
    data: {
      name: parsed.data.name,
      monthlyValue: parsed.data.monthlyValue,
      status: parsed.data.status,
    },
  });

  revalidatePath("/clientes");
  revalidatePath(`/clientes/${id}`);
  return undefined;
}

export async function deleteClient(id: string) {
  await requireAdmin();
  // onDelete: Cascade no schema remove projetos/tarefas/comentários vinculados.
  await prisma.client.delete({ where: { id } });
  revalidatePath("/clientes");
}
