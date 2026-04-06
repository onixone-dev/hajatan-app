"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatRupiah } from "@/lib/utils";
import type { Sumbangan } from "@/types";

interface Props {
  sumbanganList: Sumbangan[];
  acaraId: string;
}

export default function DaftarSumbangan({ sumbanganList, acaraId }: Props) {
  const [menghapus, setMenghapus] = useState<string | null>(null);

  async function handleHapus(id: string, namaTamu: string) {
    const yakin = confirm(`Hapus catatan sumbangan dari ${namaTamu}?`);
    if (!yakin) return;

    setMenghapus(id);
    try {
      const { error } = await supabase.from("sumbangan").delete().eq("id", id);
      if (error) throw error;
      window.location.reload();
    } catch (err: any) {
      alert(`Gagal menghapus: ${err.message}`);
      setMenghapus(null);
    }
  }

  if (sumbanganList.length === 0) {
    return (
      <div className="card text-center py-10 text-gray-400">
        <p className="text-4xl mb-2">📝</p>
        <p className="text-lg">Belum ada tamu yang dicatat.</p>
        <p className="text-sm mt-1">Gunakan form di atas untuk mencatat!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sumbanganList.map((s) => (
        <div
          key={s.id}
          className="card flex items-start gap-3"
        >
          {/* Avatar inisial */}
          <div className="w-12 h-12 rounded-full bg-batik-100 text-batik-700 font-bold
            flex items-center justify-center text-lg flex-shrink-0">
            {s.nama_tamu.charAt(0).toUpperCase()}
          </div>

          {/* Info tamu */}
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-800 text-lg leading-tight">{s.nama_tamu}</p>

            {s.alamat && (
              <p className="text-gray-500 text-sm">📍 {s.alamat}</p>
            )}

            {/* Sumbangan uang */}
            {s.jumlah_uang > 0 && (
              <p className="text-hijau-700 font-bold text-base mt-1">
                💰 {formatRupiah(s.jumlah_uang)}
              </p>
            )}

            {/* Barang */}
            {s.barang && (
              <p className="text-batik-600 text-sm mt-1">🎁 {s.barang}</p>
            )}

            {/* Catatan */}
            {s.catatan && (
              <p className="text-gray-400 text-sm italic mt-1">"{s.catatan}"</p>
            )}

            {/* Waktu */}
            <p className="text-gray-300 text-xs mt-1">
              {new Date(s.created_at).toLocaleString("id-ID", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>

          {/* Tombol hapus */}
          <button
            onClick={() => handleHapus(s.id, s.nama_tamu)}
            disabled={menghapus === s.id}
            className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg
              transition-colors flex-shrink-0"
            title="Hapus"
            aria-label={`Hapus sumbangan ${s.nama_tamu}`}
          >
            {menghapus === s.id ? "..." : "🗑️"}
          </button>
        </div>
      ))}
    </div>
  );
}
