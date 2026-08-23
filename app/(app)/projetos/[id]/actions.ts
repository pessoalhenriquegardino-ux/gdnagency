"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import type { TaskStatus } from "@prisma/client";

const TASK_STATUSES = ["TODO", "DOING", "REVIEW", "DONE"] as const;

async function assertProjectAccess(projectId: string) {
  const user = await requireUser();
  if (user.role === "ADMIN") return user;

  const hasTask = await prisma.task.findFirst({
    where: { projectId, assigneeId: user.id },
    select: { id: true },
  });
  if (!hasTask) throw new Error("Você não tem acesso a este projeto.");
  return user;
}

// ---------- Tarefas ----------

const quickTaskSchema = z.object({
  projectId: z.string().min(1),
  title: z.string().min(2, "Informe um título"),
  status: z.enum(TASK_STATUSES),
});

export async function createTask(input: { projectId: string; title: string; status: TaskStatus }) {
  await assertProjectAccess(input.projectId);
  const parsed = quickTaskSchema.parse(input);

  const lastInColumn = await prisma.task.findFirst({
    where: { projectId: parsed.projectId, status: parsed.status },
    orderBy: { order: "desc" },
  });

  const task = await prisma.task.create({
    data: {
      projectId: parsed.projectId,
      title: parsed.title,
      status: parsed.status,
      order: (lastInColumn?.order ?? -1) + 1,
    },
  });

  revalidatePath(`/projetos/${parsed.projectId}`);
  return task;
}

export async function moveTask(input: {
  taskId: string;
  projectId: string;
  status: TaskStatus;
  order: number;
}) {
  await assertProjectAccess(input.projectId);

  await prisma.task.update({
    where: { id: input.taskId },
    data: { status: input.status, order: input.order },
  });

  revalidatePath(`/projetos/${input.projectId}`);
  revalidatePath("/dashboard");
  revalidatePath("/calendario");
}

const taskDetailSchema = z.object({
  title: z.string().min(2, "Informe um título"),
  description: z.string().optional(),
  assigneeId: z.string().optional(),
  dueDate: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]),
  estimatedHours: z.string().optional(),
});

export type TaskDetailFormState = { error?: string } | undefined;

export async function updateTaskDetails(
  taskId: string,
  projectId: string,
  _prev: TaskDetailFormState,
  formData: FormData
): Promise<TaskDetailFormState> {
  await assertProjectAccess(projectId);

  const parsed = taskDetailSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    assigneeId: formData.get("assigneeId"),
    dueDate: formData.get("dueDate"),
    priority: formData.get("priority"),
    estimatedHours: formData.get("estimatedHours"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  await prisma.task.update({
    where: { id: taskId },
    data: {
      title: parsed.data.title,
      description: parsed.data.description || null,
      assigneeId: parsed.data.assigneeId || null,
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
      priority: parsed.data.priority,
      estimatedHours:
        parsed.data.estimatedHours && parsed.data.estimatedHours.trim() !== ""
          ? Number(parsed.data.estimatedHours)
          : null,
    },
  });

  revalidatePath(`/projetos/${projectId}`);
  revalidatePath("/dashboard");
  revalidatePath("/calendario");
  revalidatePath("/equipe");
  return undefined;
}

export async function deleteTask(taskId: string, projectId: string) {
  await assertProjectAccess(projectId);
  await prisma.task.delete({ where: { id: taskId } });
  revalidatePath(`/projetos/${projectId}`);
}

// ---------- Comentários ----------

export async function addComment(taskId: string, projectId: string, content: string) {
  const user = await assertProjectAccess(projectId);
  if (!content.trim()) return;

  await prisma.comment.create({
    data: { taskId, authorId: user.id, content: content.trim() },
  });

  revalidatePath(`/projetos/${projectId}`);
}
