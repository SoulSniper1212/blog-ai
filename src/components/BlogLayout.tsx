"use client";
import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
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
          <Image 
            src={blog.image || "/file.svg"} 
            alt={blog.title} 
            fill
            className="object-cover object-center"
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
      {/* Article Content - Centered and Professional */}
      <div className="w-full flex justify-center py-16">
        <div className="max-w-4xl w-full px-4 sm:px-6 lg:px-8">
          <article className={`prose prose-lg max-w-none text-gray-800 ${fontSizeClass} article-content`}> 
            <div 
              dangerouslySetInnerHTML={{ __html: blog.content }}
              className="article-body"
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
      </div>
      {/* Enhanced Article Styles for Professional Typography */}
      <style jsx global>{`
        .article-content {
          font-family: 'Georgia', 'Times New Roman', serif;
          line-height: 1.75;
          letter-spacing: 0.01em;
          color: #1f2937;
        }
        
        .article-body {
          text-align: justify;
          hyphens: auto;
          word-break: break-word;
        }
        
        .article-content p {
          margin-top: 0;
          margin-bottom: 1.75em;
          text-indent: 0;
          text-align: left;
          max-width: 100%;
        }
        
        .article-content h1, 
        .article-content h2, 
        .article-content h3, 
        .article-content h4 {
          font-family: 'Georgia', 'Times New Roman', serif;
          margin-top: 2.5em;
          margin-bottom: 1em;
          line-height: 1.3;
          font-weight: 700;
          color: #111827;
          text-align: left;
        }
        
        .article-content h1 {
          font-size: 2.25em;
          margin-top: 0;
          margin-bottom: 1em;
        }
        
        .article-content h2 {
          font-size: 1.875em;
          margin-top: 2.5em;
          margin-bottom: 0.75em;
        }
        
        .article-content h3 {
          font-size: 1.5em;
          margin-top: 2em;
          margin-bottom: 0.75em;
        }
        
        .article-content h4 {
          font-size: 1.25em;
          margin-top: 1.75em;
          margin-bottom: 0.5em;
        }
        
        .article-content ul, 
        .article-content ol {
          margin-top: 1.5em;
          margin-bottom: 1.75em;
          padding-left: 1.5em;
          text-align: left;
        }
        
        .article-content li {
          margin-bottom: 0.5em;
          line-height: 1.6;
        }
        
        .article-content blockquote {
          margin: 2em 0;
          padding: 1.5em 2em;
          border-left: 4px solid #3b82f6;
          background: #f8fafc;
          font-style: italic;
          color: #4b5563;
          border-radius: 0 8px 8px 0;
          font-size: 1.1em;
          line-height: 1.6;
        }
        
        .article-content a {
          color: #2563eb;
          text-decoration: underline;
          text-decoration-thickness: 1px;
          text-underline-offset: 2px;
        }
        
        .article-content a:hover {
          color: #1d4ed8;
          text-decoration-thickness: 2px;
        }
        
        .article-content strong {
          font-weight: 700;
          color: #111827;
        }
        
        .article-content em {
          font-style: italic;
          color: #374151;
        }
        
        .article-content code {
          background: #f3f4f6;
          padding: 0.125em 0.25em;
          border-radius: 0.25em;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 0.875em;
        }
        
        .article-content pre {
          background: #1f2937;
          color: #f9fafb;
          padding: 1.5em;
          border-radius: 0.5em;
          overflow-x: auto;
          margin: 2em 0;
        }
        
        .article-content pre code {
          background: none;
          padding: 0;
          color: inherit;
        }
        
        .article-content img {
          margin: 2em auto;
          border-radius: 0.5em;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          max-width: 100%;
          height: auto;
          display: block;
        }
        
        .article-content hr {
          margin: 3em 0;
          border: none;
          border-top: 1px solid #e5e7eb;
        }
        
        .article-content table {
          width: 100%;
          border-collapse: collapse;
          margin: 2em 0;
          font-size: 0.9em;
        }
        
        .article-content th,
        .article-content td {
          border: 1px solid #e5e7eb;
          padding: 0.75em;
          text-align: left;
        }
        
        .article-content th {
          background: #f9fafb;
          font-weight: 600;
        }
        
        /* Responsive adjustments */
        @media (max-width: 768px) {
          .article-content {
            font-size: 1rem;
            line-height: 1.7;
          }
          
          .article-content h1 {
            font-size: 1.875em;
          }
          
          .article-content h2 {
            font-size: 1.5em;
          }
          
          .article-content h3 {
            font-size: 1.25em;
          }
          
          .article-content h4 {
            font-size: 1.125em;
          }
          
          .article-content blockquote {
            padding: 1em 1.5em;
            margin: 1.5em 0;
          }
        }
        
        /* Print styles */
        @media print {
          .article-content {
            font-size: 12pt;
            line-height: 1.6;
            color: #000;
          }
          
          .article-content a {
            color: #000;
            text-decoration: underline;
          }
        }
      `}</style>
    </main>
  );
};

export default BlogLayout;
