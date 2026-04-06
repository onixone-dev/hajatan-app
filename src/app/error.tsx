"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="card text-center py-16">
      <p className="text-6xl mb-4">⚠️</p>
      <h2 className="text-2xl font-bold text-red-600 mb-2">Terjadi Kesalahan</h2>
      <p className="text-gray-500 mb-6">{error.message || "Ada yang tidak beres. Coba lagi."}</p>
      <button onClick={reset} className="btn-primary">
        🔄 Coba Lagi
      </button>
    </div>
  );
}
