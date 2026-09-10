import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const matheus = await prisma.employee.findFirst({ where: { name: { contains: "Matheus", mode: "insensitive" } } });
  
  if (!matheus) {
    console.log("Matheus not found.");
    return;
  }

  console.log("Found Matheus:", matheus.id);
  
  // Delete related data
  await prisma.punch.deleteMany({ where: { employeeId: matheus.id } });
  await prisma.pendingPunch.deleteMany({ where: { employeeId: matheus.id } });
  await prisma.dayEvent.deleteMany({ where: { employeeId: matheus.id } });
  await prisma.workSchedule.deleteMany({ where: { employeeId: matheus.id } });
  
  // Delete Matheus
  await prisma.employee.delete({ where: { id: matheus.id } });
  
  console.log("Deleted Matheus and all associated data.");
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
