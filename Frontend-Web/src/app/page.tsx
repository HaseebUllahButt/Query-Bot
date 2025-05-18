"use client";

import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100">
      <div className="max-w-md w-full p-10 bg-white/90 rounded-3xl shadow-[0_20px_50px_rgba(8,_112,_184,_0.7)] space-y-8 transform hover:scale-[1.01] transition-all duration-300">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 leading-tight py-1">
            Query Bot
          </h1>
          <p className="mt-2 text-gray-600">
            Manage your database schemas with ease
          </p>
        </div>
        <div className="space-y-6">
          <Link
            href="/login"
            className="w-full flex justify-center py-3 px-6 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
          >
            Login
          </Link>
          <Link
            href="/signup"
            className="w-full flex justify-center py-3 px-6 rounded-lg border border-gray-200 bg-gray-50/50 text-gray-700 font-bold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}
