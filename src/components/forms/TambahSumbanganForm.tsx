"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import type { SumbanganFormData } from "@/types";

interface Props {
  acaraId: string;
}

export default function TambahSumbanganForm({ acaraId }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sukses, setSukses] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSukses("");
    setLoading(true);

    const formEl = e.currentTarget;
    const data = new FormData(formEl);
    const namaTamu = data.get("nama_tamu") as string;

    const formData: SumbanganFormData = {
      acara_id: acaraId,
      nama_tamu: namaTamu,
      alamat: (data.get("alamat") as string) || undefined,
      jumlah_uang: parseInt(data.get("jumlah_uang") as string) || 0,
      barang: (data.get("barang") as string) || undefined,
      catatan: (data.get("catatan") as string) || undefined,
    };

    try {
      const { error: sbError } = await supabase
        .from("sumbangan")
        .insert(formData);

      if (sbError) throw sbError;

      formEl.reset();
      setSukses(`✅ Sumbangan dari ${namaTamu} berhasil dicatat!`);

      // Hard reload supaya daftar tamu langsung diperbarui dari server
      setTimeout(() => {
        window.location.reload();
      }, 800);
    } catch (err: any) {
      console.error("Error tambah sumbangan:", err);
      setError(`Gagal menyimpan: ${err.message ?? "Coba lagi."}`);
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Nama tamu */}
      <div>
        <label className="block text-base font-semibold text-gray-700 mb-1">
          Nama Tamu <span className="text-red-500">*</span>
        </label>
        <input
          name="nama_tamu"
          required
          placeholder="Contoh: Ibu Romlah"
          className="input-field"
          autoComplete="off"
        />
      </div>

      {/* Alamat */}
      <div>
        <label className="block text-base font-semibold text-gray-700 mb-1">
          Alamat (opsional)
        </label>
        <input
          name="alamat"
          placeholder="Contoh: RT 03 / Plaju"
          className="input-field"
        />
      </div>

      {/* Jumlah uang */}
      <div>
        <label className="block text-base font-semibold text-gray-700 mb-1">
          Jumlah Uang (Rp)
        </label>
        <input
          name="jumlah_uang"
          type="number"
          min="0"
          step="1000"
          placeholder="Contoh: 100000"
          className="input-field"
          inputMode="numeric"
        />
        <p className="text-xs text-gray-400 mt-1">Isi 0 jika tidak memberi uang</p>
      </div>

      {/* Barang */}
      <div>
        <label className="block text-base font-semibold text-gray-700 mb-1">
          Barang Bawaan (opsional)
        </label>
        <input
          name="barang"
          placeholder="Contoh: Gula 5 kg, Teh kotak"
          className="input-field"
        />
      </div>

      {/* Catatan */}
      <div>
        <label className="block text-base font-semibold text-gray-700 mb-1">
          Catatan (opsional)
        </label>
        <input
          name="catatan"
          placeholder="Catatan tambahan..."
          className="input-field"
        />
      </div>

      {/* Pesan sukses / error */}
      {sukses && (
        <div className="bg-hijau-100 border-2 border-hijau-500 rounded-xl p-3 text-hijau-700 font-medium">
          {sukses}
        </div>
      )}
      {error && (
        <p className="text-red-500 text-sm font-medium">⚠️ {error}</p>
      )}

      {/* Tombol submit */}
      <button
        type="submit"
        disabled={loading}
        className="btn-primary w-full text-xl py-5"
      >
        {loading ? "Mencatat..." : "✍️ Catat Sumbangan"}
      </button>
    </form>
  );
}
