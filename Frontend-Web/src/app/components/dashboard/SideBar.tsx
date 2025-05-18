"use client";

import Link from "next/link";
import { useAuth } from "@/lib/context/AuthContext";
import { useRouter } from "next/navigation";

export default function SideBar() {
  // You can rename to NavBar if you want
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <nav className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-center px-8 py-4 shadow-lg">
      <div className="flex-1 flex items-center gap-8">
        <span className="font-extrabold text-2xl tracking-tight">
          Query Bot
        </span>
        <Link href="/dashboard" className="hover:underline font-medium">
          Dashboard
        </Link>
        <Link href="/dashboard/schemas" className="hover:underline font-medium">
          Schemas
        </Link>
        <Link href="/dashboard/profile" className="hover:underline font-medium">
          Profile
        </Link>
        <Link
          href="/dashboard/settings"
          className="hover:underline font-medium"
        >
          Settings
        </Link>
        <Link href="/dashboard/query" className="hover:underline font-medium">
          Query
        </Link>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-200">{user?.email}</span>
        <button
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-700 px-4 py-2 rounded text-white text-sm font-semibold transition"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
