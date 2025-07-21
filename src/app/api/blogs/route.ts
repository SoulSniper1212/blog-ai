import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Simple in-memory cache (per serverless instance)
let blogCache: { key: string, data: any, timestamp: number } | null = null;
const CACHE_TTL = 10 * 1000; // 10 seconds

// GET - Fetch all blogs with filtering options
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const archived = searchParams.get('archived');
    const privateOnly = searchParams.get('private');
    
    const skip = (page - 1) * limit;
    
    // Build where clause
    const where: any = {};
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
        { topic: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (archived !== null) {
      where.isArchived = archived === 'true';
    }
    
    if (privateOnly !== null) {
      where.isPrivate = privateOnly === 'true';
    }
    
    // Cache key based on query
    const cacheKey = JSON.stringify({ page, limit, search, archived, privateOnly });
    if (blogCache && blogCache.key === cacheKey && Date.now() - blogCache.timestamp < CACHE_TTL) {
      return NextResponse.json(blogCache.data);
    }

    const [blogs, total] = await Promise.all([
      prisma.blog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.blog.count({ where })
    ]);
    
    const responseData = {
      blogs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
    blogCache = { key: cacheKey, data: responseData, timestamp: Date.now() };
    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error('Error fetching blogs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blogs' },
      { status: 500 }
    );
  }
}

// POST - Create a new blog
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, metaDescription, content, image, topic, isPrivate = false } = body;
    
    if (!title || !content || !topic) {
      return NextResponse.json(
        { error: 'Title, content, and topic are required' },
        { status: 400 }
      );
    }
    
    const blog = await prisma.blog.create({
      data: {
        title,
        metaDescription,
        content,
        image,
        topic,
        isPrivate,
        isArchived: false
      }
    });
    
    return NextResponse.json({ blog, message: 'Blog created successfully' });
  } catch (error: any) {
    console.error('Error creating blog:', error);
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'A blog with this title already exists' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create blog' },
      { status: 500 }
    );
  }
}

// PUT - Update a blog
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, title, metaDescription, content, image, topic, isArchived, isPrivate } = body;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Blog ID is required' },
        { status: 400 }
      );
    }
    
    const blog = await prisma.blog.update({
      where: { id: parseInt(id) },
      data: {
        title,
        metaDescription,
        content,
        image,
        topic,
        isArchived,
        isPrivate
      }
    });
    
    return NextResponse.json({ blog, message: 'Blog updated successfully' });
  } catch (error: any) {
    console.error('Error updating blog:', error);
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Blog not found' },
        { status: 404 }
      );
    }
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'A blog with this title already exists' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update blog' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a blog
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Blog ID is required' },
        { status: 400 }
      );
    }
    
    await prisma.blog.delete({
      where: { id: parseInt(id) }
    });
    
    return NextResponse.json({ message: 'Blog deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting blog:', error);
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Blog not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to delete blog' },
      { status: 500 }
    );
  }
} 