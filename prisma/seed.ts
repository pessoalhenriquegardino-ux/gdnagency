import { PrismaClient, Role, ClientStatus, ProjectStatus, TaskPriority, TaskStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("senha123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@verticecreate.com" },
    update: {},
    create: {
      name: "Henrique (Admin)",
      email: "admin@verticecreate.com",
      passwordHash,
      role: Role.ADMIN,
    },
  });

  const membro = await prisma.user.upsert({
    where: { email: "camila@verticecreate.com" },
    update: {},
    create: {
      name: "Camila Souza",
      email: "camila@verticecreate.com",
      passwordHash,
      role: Role.MEMBER,
    },
  });

  const cliente = await prisma.client.upsert({
    where: { id: "cliente-demo" },
    update: {},
    create: {
      id: "cliente-demo",
      name: "Clínica Vitalis",
      monthlyValue: 4500,
      status: ClientStatus.ACTIVE,
    },
  });

  const projeto = await prisma.project.upsert({
    where: { id: "projeto-demo" },
    update: {},
    create: {
      id: "projeto-demo",
      name: "Gestão de Tráfego — Clínica Vitalis",
      clientId: cliente.id,
      status: ProjectStatus.IN_PROGRESS,
      startDate: new Date("2026-08-01"),
      dueDate: new Date("2026-09-30"),
    },
  });

  await prisma.task.createMany({
    data: [
      {
        projectId: projeto.id,
        title: "Criar criativos da campanha de agosto",
        assigneeId: membro.id,
        priority: TaskPriority.HIGH,
        status: TaskStatus.DOING,
        dueDate: new Date("2026-08-25"),
        estimatedHours: 6,
      },
      {
        projectId: projeto.id,
        title: "Relatório mensal de tráfego",
        assigneeId: membro.id,
        priority: TaskPriority.MEDIUM,
        status: TaskStatus.TODO,
        dueDate: new Date("2026-08-21"), // atrasada de propósito para testar o destaque
        estimatedHours: 3,
      },
    ],
    skipDuplicates: true,
  });

  console.log("Seed concluído:", { admin: admin.email, membro: membro.email });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
