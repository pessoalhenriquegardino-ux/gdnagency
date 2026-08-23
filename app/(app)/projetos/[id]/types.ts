import type { Task, Comment, User, TaskPriority, TaskStatus } from "@prisma/client";

export type TaskWithRelations = Task & {
  assignee: User | null;
  comments: (Comment & { author: User })[];
};

export type ProjectMember = Pick<User, "id" | "name" | "email">;

export const COLUMNS: { status: TaskStatus; label: string }[] = [
  { status: "TODO", label: "A Fazer" },
  { status: "DOING", label: "Fazendo" },
  { status: "REVIEW", label: "Revisão" },
  { status: "DONE", label: "Concluído" },
];

export const PRIORITY_LABEL: Record<TaskPriority, string> = {
  LOW: "Baixa",
  MEDIUM: "Média",
  HIGH: "Alta",
};

export const PRIORITY_VARIANT: Record<TaskPriority, "secondary" | "warning" | "destructive"> = {
  LOW: "secondary",
  MEDIUM: "warning",
  HIGH: "destructive",
};

export function isOverdue(task: Pick<Task, "dueDate" | "status">) {
  if (!task.dueDate || task.status === "DONE") return false;
  return new Date(task.dueDate) < new Date(new Date().toDateString());
}
