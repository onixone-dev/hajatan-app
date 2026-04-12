"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [kode, setKode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kode }),
      });

      const data = await res.json();

      if (!res.ok) { setError(data.error); return; }

      if (data.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/");
      }

      router.refresh();
    } catch {
      setError("Gagal login. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen batik-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">🏡</div>
          <h1 className="text-2xl font-bold text-batik-700">Catatan Hajatan</h1>
          <p className="text-gray-500 mt-1">Masukkan kode acara Anda</p>
        </div>

        {/* Form */}
        <div className="card">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-base font-semibold text-gray-700 mb-1">
                Kode Acara / Panitia
              </label>
              <input
                value={kode}
                onChange={(e) => setKode(e.target.value.toUpperCase())}
                placeholder="Contoh: BUDI2025"
                className="input-field text-center text-xl tracking-widest font-bold"
                autoComplete="off"
                autoFocus
              />
            </div>

            {error && (
              <div className="bg-red-50 border-2 border-red-300 rounded-xl p-3 text-red-600 text-center font-medium">
                ⚠️ {error}
              </div>
            )}

            <button type="submit" disabled={loading || kode.trim() === ""}
              className="btn-primary w-full text-xl py-5">
              {loading ? "Memeriksa..." : "🔓 Masuk"}
            </button>
          </form>
        </div>

        <p className="text-center text-gray-400 text-sm mt-6">
          Belum punya kode? Hubungi admin.
        </p>
      </div>
    </div>
  );
}