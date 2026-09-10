import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  const matheus = await prisma.employee.findFirst({ where: { name: { contains: "Matheus", mode: "insensitive" } } });
  
  if (!matheus) return NextResponse.json({ msg: "Matheus not found" });

  await prisma.punch.deleteMany({ where: { employeeId: matheus.id } });
  await prisma.pendingPunch.deleteMany({ where: { employeeId: matheus.id } });
  await prisma.dayEvent.deleteMany({ where: { employeeId: matheus.id } });
  await prisma.workSchedule.deleteMany({ where: { employeeId: matheus.id } });
  await prisma.employee.delete({ where: { id: matheus.id } });
  
  return NextResponse.json({ msg: "Matheus DELETED" });
}
