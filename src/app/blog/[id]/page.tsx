import { PrismaClient } from "@/generated/prisma";
import { notFound } from "next/navigation";
import BlogLayout from "@/components/BlogLayout";
import { Blog } from "@/types";
import { Metadata } from "next";

const prisma = new PrismaClient();

async function getBlog(id: number): Promise<Blog | null> {
  try {
    const blog = await prisma.blog.findUnique({
      where: { id },
    });
    return blog as Blog | null;
  } catch (error) {
    console.error("Failed to fetch blog:", error);
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const blog = await getBlog(Number(id));

  if (!blog) {
    return {
      title: "Blog not found",
    };
  }

  return {
    title: blog.title,
    description: blog.metaDescription,
  };
}

export default async function BlogDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const blog = await getBlog(Number(id));

  if (!blog) {
    return notFound();
  }

  return <BlogLayout blog={blog} />;
}
