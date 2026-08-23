"use client";

import { useMemo, useState, useTransition } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { TaskStatus } from "@prisma/client";
import { cn } from "@/lib/utils";
import { TaskCard } from "./task-card";
import { QuickAddTask } from "./quick-add-task";
import { TaskDetailDialog } from "./task-detail-dialog";
import { createTask, moveTask } from "./actions";
import { COLUMNS, type ProjectMember, type TaskWithRelations } from "./types";

function Column({
  status,
  label,
  tasks,
  onTaskClick,
  onAddTask,
}: {
  status: TaskStatus;
  label: string;
  tasks: TaskWithRelations[];
  onTaskClick: (task: TaskWithRelations) => void;
  onAddTask: (title: string, status: TaskStatus) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div className="flex w-72 shrink-0 flex-col rounded-lg bg-muted/40">
      <div className="flex items-center justify-between px-3 py-3">
        <h3 className="text-sm font-semibold">{label}</h3>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          {tasks.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 space-y-2 overflow-y-auto px-2 pb-2 transition-colors",
          isOver && "bg-primary/5"
        )}
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} />
          ))}
        </SortableContext>
      </div>

      <div className="px-2 pb-2">
        <QuickAddTask status={status} onAdd={(title) => onAddTask(title, status)} />
      </div>
    </div>
  );
}

export function KanbanBoard({
  projectId,
  initialTasks,
  members,
}: {
  projectId: string;
  initialTasks: TaskWithRelations[];
  members: ProjectMember[];
}) {
  const [tasks, setTasks] = useState(initialTasks);
  const [activeTask, setActiveTask] = useState<TaskWithRelations | null>(null);
  const [selectedTask, setSelectedTask] = useState<TaskWithRelations | null>(null);
  const [, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const tasksByColumn = useMemo(() => {
    const map: Record<TaskStatus, TaskWithRelations[]> = {
      TODO: [],
      DOING: [],
      REVIEW: [],
      DONE: [],
    };
    for (const task of tasks) {
      map[task.status].push(task);
    }
    for (const status of Object.keys(map) as TaskStatus[]) {
      map[status].sort((a, b) => a.order - b.order);
    }
    return map;
  }, [tasks]);

  function handleDragStart(event: DragStartEvent) {
    const task = tasks.find((t) => t.id === event.active.id);
    setActiveTask(task ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const activeTaskItem = tasks.find((t) => t.id === active.id);
    if (!activeTaskItem) return;

    // `over.id` é o id de outra tarefa (mesma coluna ou coluna diferente) ou o id da própria coluna (vazia)
    const overTask = tasks.find((t) => t.id === over.id);
    const overColumn = COLUMNS.find((c) => c.status === over.id)?.status;
    const targetStatus = overTask?.status ?? overColumn ?? activeTaskItem.status;

    if (targetStatus === activeTaskItem.status && over.id === active.id) return;

    setTasks((prev) => {
      const withoutActive = prev.filter((t) => t.id !== activeTaskItem.id);
      const columnTasks = withoutActive
        .filter((t) => t.status === targetStatus)
        .sort((a, b) => a.order - b.order);

      const overIndex = overTask ? columnTasks.findIndex((t) => t.id === overTask.id) : columnTasks.length;
      const insertAt = overIndex === -1 ? columnTasks.length : overIndex;

      columnTasks.splice(insertAt, 0, { ...activeTaskItem, status: targetStatus });
      const reordered = columnTasks.map((t, idx) => ({ ...t, order: idx }));

      const newOrder = reordered.find((t) => t.id === activeTaskItem.id)?.order ?? 0;

      startTransition(() => {
        moveTask({ taskId: activeTaskItem.id, projectId, status: targetStatus, order: newOrder });
      });

      return [...withoutActive.filter((t) => t.status !== targetStatus), ...reordered];
    });
  }

  async function handleAddTask(title: string, status: TaskStatus) {
    const optimisticId = `optimistic-${Date.now()}`;
    const optimisticTask: TaskWithRelations = {
      id: optimisticId,
      projectId,
      title,
      description: null,
      assigneeId: null,
      assignee: null,
      dueDate: null,
      priority: "MEDIUM",
      status,
      estimatedHours: null,
      order: tasksByColumn[status].length,
      createdAt: new Date(),
      updatedAt: new Date(),
      comments: [],
    };
    setTasks((prev) => [...prev, optimisticTask]);

    const created = await createTask({ projectId, title, status });
    setTasks((prev) =>
      prev.map((t) => (t.id === optimisticId ? { ...created, assignee: null, comments: [] } : t))
    );
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {COLUMNS.map((col) => (
            <Column
              key={col.status}
              status={col.status}
              label={col.label}
              tasks={tasksByColumn[col.status]}
              onTaskClick={setSelectedTask}
              onAddTask={handleAddTask}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask && <TaskCard task={activeTask} onClick={() => {}} />}
        </DragOverlay>
      </DndContext>

      {selectedTask && (
        <TaskDetailDialog
          task={tasks.find((t) => t.id === selectedTask.id) ?? selectedTask}
          projectId={projectId}
          members={members}
          open={!!selectedTask}
          onOpenChange={(open) => !open && setSelectedTask(null)}
        />
      )}
    </>
  );
}
