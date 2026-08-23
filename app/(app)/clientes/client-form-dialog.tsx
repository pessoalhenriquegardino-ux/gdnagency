"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil } from "lucide-react";
import { createClient, updateClient, type ClientFormState } from "./actions";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Salvando..." : label}
    </Button>
  );
}

type ClientData = {
  id: string;
  name: string;
  monthlyValue: string | null; // já formatado como string p/ input
  status: "ACTIVE" | "PAUSED" | "ENDED";
};

export function ClientFormDialog({ client }: { client?: ClientData }) {
  const [open, setOpen] = useState(false);
  const isEdit = !!client;

  const action = isEdit ? updateClient.bind(null, client.id) : createClient;
  const [state, formAction] = useFormState<ClientFormState, FormData>(action, undefined);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
      }}
    >
      <DialogTrigger asChild>
        {isEdit ? (
          <Button variant="ghost" size="icon">
            <Pencil className="h-4 w-4" />
          </Button>
        ) : (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Novo cliente
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar cliente" : "Novo cliente"}</DialogTitle>
        </DialogHeader>

        <form
          action={async (formData) => {
            await formAction(formData);
            setOpen(false);
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="name">Nome do cliente</Label>
            <Input id="name" name="name" defaultValue={client?.name} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="monthlyValue">Valor mensal (R$)</Label>
            <Input
              id="monthlyValue"
              name="monthlyValue"
              type="number"
              step="0.01"
              min="0"
              placeholder="Opcional"
              defaultValue={client?.monthlyValue ?? undefined}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select name="status" defaultValue={client?.status ?? "ACTIVE"}>
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Ativo</SelectItem>
                <SelectItem value="PAUSED">Pausado</SelectItem>
                <SelectItem value="ENDED">Encerrado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

          <DialogFooter>
            <SubmitButton label={isEdit ? "Salvar alterações" : "Criar cliente"} />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
