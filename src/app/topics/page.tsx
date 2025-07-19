import React from "react";

const topics = [
  { name: "AI", color: "from-blue-500 to-blue-300" },
  { name: "Cybersecurity", color: "from-purple-600 to-indigo-400" },
  { name: "SaaS", color: "from-green-500 to-teal-300" },
  { name: "Programming", color: "from-pink-500 to-red-300" },
  { name: "News", color: "from-yellow-400 to-orange-300" },
  { name: "Fun", color: "from-fuchsia-500 to-pink-300" },
];

export default function TopicsPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-100 py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-extrabold mb-8 text-blue-700 text-center">Topics</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          {topics.map((topic) => (
            <div key={topic.name} className={`rounded-2xl shadow-lg p-8 text-center text-white font-bold text-xl bg-gradient-to-br ${topic.color} hover:scale-105 transition-transform cursor-pointer`}>
              {topic.name}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
} 