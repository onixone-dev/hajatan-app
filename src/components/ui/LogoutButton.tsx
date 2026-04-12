"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <button onClick={handleLogout}
      className="text-red-500 hover:bg-red-50 px-3 py-2 rounded-xl text-sm font-semibold transition-colors">
      Keluar
    </button>
  );
}