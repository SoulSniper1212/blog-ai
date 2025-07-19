import React from "react";

export default function ArchivePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-100 py-16 px-4">
      <div className="max-w-3xl mx-auto bg-white/95 rounded-3xl shadow-xl ring-1 ring-gray-200 p-8 md:p-14 lg:p-16">
        <h1 className="text-3xl font-extrabold mb-6 text-blue-700 text-center">Archive</h1>
        <p className="mb-8 text-gray-700 text-center text-lg">Browse all our AI-generated posts by date. (Feature coming soon!)</p>
        <div className="text-center text-gray-400">No posts yet. Stay tuned!</div>
      </div>
    </main>
  );
} 