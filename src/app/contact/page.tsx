import React from "react";

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-100 py-16 px-4">
      <div className="max-w-lg mx-auto bg-white/95 rounded-3xl shadow-xl ring-1 ring-gray-200 p-8 md:p-14 lg:p-16">
        <h1 className="text-3xl font-extrabold mb-6 text-blue-700 text-center">Contact Us</h1>
        <p className="mb-8 text-gray-700 text-center text-lg">We’d love to hear from you! Whether you want to give credit, request removal, or just say hi, drop us a message below.</p>
        <form className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input type="text" className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400" placeholder="Your name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400" placeholder="you@email.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400" rows={5} placeholder="How can we help?" />
          </div>
          <button type="submit" className="w-full bg-blue-700 text-white font-semibold py-2 rounded-lg shadow hover:bg-blue-800 transition">Send Message</button>
        </form>
      </div>
    </main>
  );
} 