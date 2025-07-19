import { NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

export async function GET() {
  const blogs = await prisma.blog.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ blogs });
} 