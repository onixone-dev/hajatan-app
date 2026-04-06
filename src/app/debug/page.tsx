"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface HasilCek {
  label: string;
  status: "ok" | "error" | "loading";
  pesan: string;
}

export default function DebugPage() {
  const [hasil, setHasil] = useState<HasilCek[]>([]);

  useEffect(() => {
    async function cekSemua() {
      const list: HasilCek[] = [];

      // 1. Cek env vars
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      list.push({
        label: "NEXT_PUBLIC_SUPABASE_URL",
        status: url ? "ok" : "error",
        pesan: url ? `✅ Terisi: ${url}` : "❌ Kosong! Isi di .env.local",
      });

      list.push({
        label: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
        status: key ? "ok" : "error",
        pesan: key
          ? `✅ Terisi: ${key.substring(0, 20)}...`
          : "❌ Kosong! Isi di .env.local",
      });

      setHasil([...list]);

      if (!url || !key) return;

      // 2. Cek koneksi ke tabel acara
      try {
        const { data, error } = await supabase.from("acara").select("count");
        list.push({
          label: "Koneksi ke tabel 'acara'",
          status: error ? "error" : "ok",
          pesan: error
            ? `❌ Error: ${error.message} (code: ${error.code})`
            : "✅ Berhasil terhubung",
        });
      } catch (e: any) {
        list.push({
          label: "Koneksi ke tabel 'acara'",
          status: "error",
          pesan: `❌ Exception: ${e.message}`,
        });
      }

      // 3. Cek tabel sumbangan
      try {
        const { data, error } = await supabase.from("sumbangan").select("count");
        list.push({
          label: "Koneksi ke tabel 'sumbangan'",
          status: error ? "error" : "ok",
          pesan: error
            ? `❌ Error: ${error.message} (code: ${error.code})`
            : "✅ Berhasil terhubung",
        });
      } catch (e: any) {
        list.push({
          label: "Koneksi ke tabel 'sumbangan'",
          status: "error",
          pesan: `❌ Exception: ${e.message}`,
        });
      }

      // 4. Coba insert data dummy lalu hapus (test RLS policy)
      try {
        const { data: insertData, error: insertError } = await supabase
          .from("acara")
          .insert({
            nama_acara: "TEST_DEBUG",
            jenis_acara: "lainnya",
            tanggal: "2025-01-01",
            lokasi: "Test",
            nama_tuan_rumah: "Test",
          })
          .select()
          .single();

        if (insertError) throw insertError;

        // Langsung hapus data test
        await supabase.from("acara").delete().eq("id", insertData.id);

        list.push({
          label: "Test INSERT ke tabel 'acara'",
          status: "ok",
          pesan: "✅ Insert & delete berhasil — RLS policy OK",
        });
      } catch (e: any) {
        list.push({
          label: "Test INSERT ke tabel 'acara'",
          status: "error",
          pesan: `❌ Gagal insert: ${e.message} — Cek RLS policy di Supabase`,
        });
      }

      setHasil([...list]);
    }

    cekSemua();
  }, []);

  return (
    <div className="space-y-4">
      <div className="card bg-yellow-50 border-yellow-200">
        <h2 className="text-xl font-bold text-yellow-800 mb-1">🔧 Halaman Debug</h2>
        <p className="text-yellow-700 text-sm">
          Halaman ini untuk mengecek koneksi Supabase. Hapus atau sembunyikan setelah selesai.
        </p>
      </div>

      {hasil.length === 0 && (
        <div className="card text-center py-8 text-gray-400 animate-pulse">
          Sedang mengecek koneksi...
        </div>
      )}

      {hasil.map((h, i) => (
        <div
          key={i}
          className={`card border-2 ${
            h.status === "ok"
              ? "border-green-300 bg-green-50"
              : h.status === "error"
              ? "border-red-300 bg-red-50"
              : "border-gray-200"
          }`}
        >
          <p className="font-bold text-gray-700 text-sm">{h.label}</p>
          <p className="text-sm mt-1 font-mono break-all">{h.pesan}</p>
        </div>
      ))}

      <div className="card bg-blue-50 border-blue-200 text-sm text-blue-800 space-y-2">
        <p className="font-bold">📋 Checklist jika ada error:</p>
        <ol className="list-decimal list-inside space-y-1">
          <li>Pastikan file <code className="bg-blue-100 px-1 rounded">.env.local</code> sudah ada dan terisi</li>
          <li>Restart server: <code className="bg-blue-100 px-1 rounded">Ctrl+C</code> lalu <code className="bg-blue-100 px-1 rounded">npm run dev</code></li>
          <li>Pastikan SQL schema sudah dijalankan di Supabase SQL Editor</li>
          <li>Cek RLS Policy di Supabase → Authentication → Policies</li>
        </ol>
      </div>
    </div>
  );
}
