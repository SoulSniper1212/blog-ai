"use client";
import React, { useState } from "react";
import Link from "next/link";
import { Blog } from "../types";
import Navigation from "./Navigation";

const FONT_SIZE_OPTIONS = [
  { label: "Small", value: "text-base lg:text-lg" },
  { label: "Medium", value: "text-lg lg:text-xl" },
  { label: "Large", value: "text-xl lg:text-2xl" },
  { label: "Extra Large", value: "text-2xl lg:text-3xl" },
];

interface BlogLayoutProps {
  blog: Blog;
}

const BlogLayout: React.FC<BlogLayoutProps> = ({ blog }) => {
  const [fontSizeClass, setFontSizeClass] = useState(FONT_SIZE_OPTIONS[1].value); // Default to Medium

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <Navigation />
      {/* Hero Section */}
      <div className="relative w-full bg-white shadow-lg mb-0">
        <div className="absolute inset-0">
          <img 
            src={blog.image || "/file.svg"} 
            alt={blog.title} 
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
        </div>
        <div className="relative w-full max-w-7xl mx-auto px-8 py-20 lg:py-28">
          <div className="flex items-center gap-2 mb-6">
            <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
              {blog.topic}
            </span>
            <span className="text-sm text-gray-300">
              {new Date(blog.createdAt).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </span>
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight text-white drop-shadow-lg mb-6 leading-tight">
            {blog.title}
          </h1>
          <div className="mt-6 flex items-center text-gray-300">
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-full bg-gray-600 flex items-center justify-center">
                <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="ml-3 text-base font-medium">AI Writer</span>
            </div>
          </div>
        </div>
      </div>
      {/* Font Size Picker */}
      <div className="w-full max-w-7xl mx-auto px-8 pt-8 flex justify-end">
        <label className="text-sm text-gray-600 mr-2 font-medium">Font Size:</label>
        <select
          className="border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-400"
          value={fontSizeClass}
          onChange={e => setFontSizeClass(e.target.value)}
        >
          {FONT_SIZE_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
      {/* Article Content */}
      <div className={`w-full px-2 sm:px-4 md:px-8 lg:px-16 xl:px-32 py-16`}> 
        <article className={`prose max-w-none text-gray-900 ${fontSizeClass} custom-prose`}> 
          <div 
            dangerouslySetInnerHTML={{ __html: blog.content }}
          />
        </article>
        <div className="mt-16 pt-8 border-t border-gray-200 flex items-center justify-between">
          <div className="flex items-center text-sm text-gray-500">
            <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            {new Date(blog.createdAt).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
          <Link 
            href="/" 
            className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors duration-200"
          >
            <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to All Articles
          </Link>
        </div>
      </div>
      {/* Custom Prose Styles for Best Spacing */}
      <style jsx global>{`
        .custom-prose {
          line-height: 1.8;
          letter-spacing: 0.01em;
          /* Remove max-width for full-bleed effect */
          max-width: none !important;
        }
        .custom-prose p {
          margin-top: 0;
          margin-bottom: 2em;
        }
        .custom-prose h1, .custom-prose h2, .custom-prose h3, .custom-prose h4 {
          margin-top: 2.5em;
          margin-bottom: 1.2em;
          line-height: 1.25;
        }
        .custom-prose ul, .custom-prose ol {
          margin-top: 1.5em;
          margin-bottom: 2em;
        }
        .custom-prose img {
          margin-top: 2em;
          margin-bottom: 2em;
          border-radius: 1em;
        }
        .custom-prose blockquote {
          margin-top: 2em;
          margin-bottom: 2em;
          padding-left: 1.5em;
          border-left: 4px solid #3b82f6;
          color: #64748b;
          font-style: italic;
          background: #f8fafc;
        }
        @media (max-width: 768px) {
          .custom-prose {
            max-width: 100vw;
            padding-left: 0.5em;
            padding-right: 0.5em;
          }
        }
      `}</style>
    </main>
  );
};

export default BlogLayout;
