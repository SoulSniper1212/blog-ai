import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Blog } from "../types";

interface BlogCardProps {
  blog: Blog;
}

const BlogCard: React.FC<BlogCardProps> = ({ blog }) => {
  return (
    <article className="group relative bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 hover:shadow-lg transition-all duration-300 overflow-hidden">
      <Link href={`/blog/${blog.id}`} className="block">
        <div className="aspect-[16/10] overflow-hidden">
          <Image
            src={blog.image || "/file.svg"}
            alt={blog.title}
            width={400}
            height={250}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
      </Link>
      
      <div className="p-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
            {blog.topic}
          </span>
          <span className="text-xs text-gray-500">
            {new Date(blog.createdAt).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric',
              year: 'numeric'
            })}
          </span>
        </div>
        
        <Link href={`/blog/${blog.id}`} className="block group">
          <h3 className="text-xl font-semibold leading-tight text-gray-900 group-hover:text-blue-600 transition-colors duration-200 line-clamp-2 mb-3">
            {blog.title}
          </h3>
        </Link>
        
        <p className="text-gray-600 text-sm leading-relaxed line-clamp-3 mb-4">
          {blog.content.replace(/<[^>]*>/g, '').substring(0, 150)}...
        </p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center text-sm text-gray-500">
            <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
            AI Writer
          </div>
          
          <Link 
            href={`/blog/${blog.id}`}
            className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors duration-200"
          >
            Read more
            <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </article>
  );
};

export default BlogCard;
