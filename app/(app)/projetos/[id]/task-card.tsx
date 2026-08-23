"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageSquare } from "lucide-react";
import { isOverdue, PRIORITY_LABEL, PRIORITY_VARIANT, type TaskWithRelations } from "./types";

export function TaskCard({
  task,
  onClick,
}: {
  task: TaskWithRelations;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { status: task.status },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const overdue = isOverdue(task);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={cn(
        "cursor-grab space-y-2 rounded-md border bg-card p-3 text-sm shadow-sm transition-colors active:cursor-grabbing",
        isDragging && "opacity-40",
        overdue ? "border-destructive/50 bg-destructive/5" : "hover:border-primary/40"
      )}
    >
      <p className={cn("font-medium leading-snug", overdue && "text-destructive")}>{task.title}</p>

      <div className="flex items-center justify-between">
        <Badge variant={PRIORITY_VARIANT[task.priority]} className="text-[10px]">
          {PRIORITY_LABEL[task.priority]}
        </Badge>

        {task.assignee && (
          <Avatar className="h-6 w-6">
            <AvatarFallback className="text-[10px]">
              {task.assignee.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className={cn(overdue && "font-medium text-destructive")}>
          {task.dueDate
            ? new Date(task.dueDate).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
            : "Sem prazo"}
        </span>
        {task.comments.length > 0 && (
          <span className="flex items-center gap-1">
            <MessageSquare className="h-3 w-3" />
            {task.comments.length}
          </span>
        )}
      </div>
    </div>
  );
}
