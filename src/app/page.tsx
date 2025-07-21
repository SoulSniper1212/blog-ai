"use client";

import React, { useEffect, useState } from "react";
import Hero from "../components/Hero";
import BlogList from "../components/BlogList";
import Navigation from "../components/Navigation";
import Link from "next/link";

import { Blog } from "../types";

export default function Home() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  useEffect(() => {
    const fetchBlogs = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/blogs?archived=false&private=false&limit=${limit}&page=${page}`);
        if (!res.ok) {
          throw new Error("Failed to fetch blogs");
        }
        const data = await res.json();
        setBlogs(data.blogs || []);
        setTotalPages(data.pagination?.pages || 1);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred");
      } finally {
        setLoading(false);
      }
    };
    fetchBlogs();
  }, [page]);

  return (
    <main className="min-h-screen bg-white">
      <Navigation />
      <Hero />
      <BlogList blogs={blogs} loading={loading} error={error} />
      <div className="flex justify-center gap-4 my-8">
        <button
          className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          Previous
        </button>
        <span className="self-center">Page {page} of {totalPages}</span>
        <button
          className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
        >
          Next
        </button>
      </div>
      <footer className="mt-16 py-8 text-center text-sm text-gray-500">
        <span>
          We are devoted to giving credit to Reddit users and websites that inspire our posts, and we proudly acknowledge the use of AI in writing. <br />
          <Link href="/about" className="text-blue-600 hover:underline">Learn more</Link> about our mission and credits.
        </span>
      </footer>
    </main>
  );
}
