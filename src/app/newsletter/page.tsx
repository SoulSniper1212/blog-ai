import React from "react";

export default function NewsletterPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-100 py-16 px-4">
      <div className="max-w-lg mx-auto bg-white/95 rounded-3xl shadow-xl ring-1 ring-gray-200 p-8 md:p-14 lg:p-16 text-center">
        <h1 className="text-3xl font-extrabold mb-6 text-blue-700">Subscribe to Our Newsletter</h1>
        <p className="mb-8 text-gray-700 text-lg">Get the latest AI-generated tech news, tips, and fun delivered straight to your inbox. No spam, just awesome content!</p>
        <form className="flex flex-col sm:flex-row gap-4 justify-center">
          <input type="email" className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400" placeholder="you@email.com" />
          <button type="submit" className="bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg shadow hover:bg-blue-800 transition">Subscribe</button>
        </form>
      </div>
    </main>
  );
} 