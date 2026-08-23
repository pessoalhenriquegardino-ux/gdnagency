"use client";

import { useState, useTransition } from "react";
import { useFormState, useFormStatus } from "react-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2 } from "lucide-react";
import { updateTaskDetails, deleteTask, addComment, type TaskDetailFormState } from "./actions";
import type { ProjectMember, TaskWithRelations } from "./types";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Salvando..." : "Salvar alterações"}
    </Button>
  );
}

export function TaskDetailDialog({
  task,
  projectId,
  members,
  open,
  onOpenChange,
}: {
  task: TaskWithRelations;
  projectId: string;
  members: ProjectMember[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const boundAction = updateTaskDetails.bind(null, task.id, projectId);
  const [state, formAction] = useFormState<TaskDetailFormState, FormData>(boundAction, undefined);
  const [isPending, startTransition] = useTransition();
  const [commentText, setCommentText] = useState("");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Detalhes da tarefa</DialogTitle>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input id="title" name="title" defaultValue={task.title} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              name="description"
              rows={3}
              defaultValue={task.description ?? ""}
              placeholder="Detalhes da tarefa..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="assigneeId">Responsável</Label>
              <Select name="assigneeId" defaultValue={task.assigneeId ?? "none"}>
                <SelectTrigger id="assigneeId">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem responsável</SelectItem>
                  {members.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Prioridade</Label>
              <Select name="priority" defaultValue={task.priority}>
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Baixa</SelectItem>
                  <SelectItem value="MEDIUM">Média</SelectItem>
                  <SelectItem value="HIGH">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dueDate">Prazo</Label>
              <Input
                id="dueDate"
                name="dueDate"
                type="date"
                defaultValue={task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="estimatedHours">Horas estimadas</Label>
              <Input
                id="estimatedHours"
                name="estimatedHours"
                type="number"
                step="0.5"
                min="0"
                defaultValue={task.estimatedHours?.toString() ?? ""}
              />
            </div>
          </div>

          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

          <DialogFooter className="justify-between sm:justify-between">
            <Button
              type="button"
              variant="ghost"
              className="text-destructive hover:text-destructive"
              disabled={isPending}
              onClick={() => {
                if (confirm("Excluir esta tarefa?")) {
                  startTransition(async () => {
                    await deleteTask(task.id, projectId);
                    onOpenChange(false);
                  });
                }
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </Button>
            <SubmitButton />
          </DialogFooter>
        </form>

        {/* Comentários */}
        <div className="space-y-3 border-t pt-4">
          <Label>Comentários</Label>
          <div className="max-h-48 space-y-3 overflow-y-auto pr-1">
            {task.comments.map((comment) => (
              <div key={comment.id} className="flex gap-2">
                <Avatar className="h-7 w-7 shrink-0">
                  <AvatarFallback className="text-[10px]">
                    {comment.author.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 rounded-md bg-muted px-3 py-2 text-sm">
                  <div className="mb-0.5 flex items-center justify-between">
                    <span className="font-medium">{comment.author.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(comment.createdAt).toLocaleString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="text-muted-foreground">{comment.content}</p>
                </div>
              </div>
            ))}
            {task.comments.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhum comentário ainda.</p>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!commentText.trim()) return;
              startTransition(async () => {
                await addComment(task.id, projectId, commentText);
                setCommentText("");
              });
            }}
            className="flex gap-2"
          >
            <Input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Escreva um comentário..."
              disabled={isPending}
            />
            <Button type="submit" disabled={isPending || !commentText.trim()}>
              Enviar
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
