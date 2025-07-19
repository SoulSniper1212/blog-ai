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

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const res = await fetch("/api/blogs");
        if (!res.ok) {
          throw new Error("Failed to fetch blogs");
        }
        const data = await res.json();
        setBlogs(data.blogs || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchBlogs();
  }, []);

  return (
    <main className="min-h-screen bg-white">
      <Navigation />
      <Hero />
      <BlogList blogs={blogs} loading={loading} error={error} />
      <footer className="mt-16 py-8 text-center text-sm text-gray-500">
        <span>
          We are devoted to giving credit to Reddit users and websites that inspire our posts, and we proudly acknowledge the use of AI in writing. <br />
          <Link href="/about" className="text-blue-600 hover:underline">Learn more</Link> about our mission and credits.
        </span>
      </footer>
    </main>
  );
}
