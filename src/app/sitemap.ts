import { MetadataRoute } from 'next';
import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();
const URL = 'https://aitechblog.vercel.app';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const blogs = await prisma.blog.findMany({
    where: {
      isPrivate: false,
      isArchived: false,
    },
    select: {
      id: true,
      updatedAt: true,
    },
  });

  const blogUrls = blogs.map((blog) => ({
    url: `${URL}/blog/${blog.id}`,
    lastModified: blog.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  const staticUrls = [
    {
      url: URL,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1.0,
    },
    {
      url: `${URL}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
    {
      url: `${URL}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
    {
        url: `${URL}/newsletter`,
        lastModified: new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.5,
    },
    {
        url: `${URL}/topics`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
    },
    {
        url: `${URL}/archive`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
    }
  ];

  return [...staticUrls, ...blogUrls];
}
