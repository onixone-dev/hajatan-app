"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import type { AcaraFormData } from "@/types";

export default function TambahAcaraForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [terbuka, setTerbuka] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formEl = e.currentTarget;
    const data = new FormData(formEl);

    const formData: AcaraFormData = {
      nama_acara: data.get("nama_acara") as string,
      jenis_acara: data.get("jenis_acara") as AcaraFormData["jenis_acara"],
      tanggal: data.get("tanggal") as string,
      lokasi: data.get("lokasi") as string,
      nama_tuan_rumah: data.get("nama_tuan_rumah") as string,
      catatan: (data.get("catatan") as string) || undefined,
    };

    try {
      const { data: acara, error: sbError } = await supabase
        .from("acara")
        .insert(formData)
        .select()
        .single();

      if (sbError) throw sbError;

      // Hard redirect ke halaman acara — paling andal untuk refresh data
      window.location.href = `/acara/${acara.id}`;
    } catch (err: any) {
      console.error("Error tambah acara:", err);
      setError(`Gagal menyimpan: ${err.message ?? "Coba lagi."}`);
      setLoading(false);
    }
  }

  if (!terbuka) {
    return (
      <button
        onClick={() => setTerbuka(true)}
        className="btn-primary w-full"
      >
        + Buat Acara Baru
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Nama acara */}
      <div>
        <label className="block text-base font-semibold text-gray-700 mb-1">
          Nama Acara <span className="text-red-500">*</span>
        </label>
        <input
          name="nama_acara"
          required
          placeholder="Contoh: Pernikahan Budi & Siti"
          className="input-field"
        />
      </div>

      {/* Jenis acara */}
      <div>
        <label className="block text-base font-semibold text-gray-700 mb-1">
          Jenis Acara <span className="text-red-500">*</span>
        </label>
        <select name="jenis_acara" required className="input-field bg-white">
          <option value="">-- Pilih Jenis --</option>
          <option value="pernikahan">💍 Pernikahan</option>
          <option value="sunatan">✂️ Sunatan</option>
          <option value="aqiqah">🐑 Aqiqah</option>
          <option value="syukuran">🙏 Syukuran</option>
          <option value="lainnya">🎉 Lainnya</option>
        </select>
      </div>

      {/* Nama tuan rumah */}
      <div>
        <label className="block text-base font-semibold text-gray-700 mb-1">
          Nama Tuan Rumah <span className="text-red-500">*</span>
        </label>
        <input
          name="nama_tuan_rumah"
          required
          placeholder="Contoh: Pak Ahmad"
          className="input-field"
        />
      </div>

      {/* Tanggal */}
      <div>
        <label className="block text-base font-semibold text-gray-700 mb-1">
          Tanggal Acara <span className="text-red-500">*</span>
        </label>
        <input
          name="tanggal"
          type="date"
          required
          className="input-field"
        />
      </div>

      {/* Lokasi */}
      <div>
        <label className="block text-base font-semibold text-gray-700 mb-1">
          Lokasi <span className="text-red-500">*</span>
        </label>
        <input
          name="lokasi"
          required
          placeholder="Contoh: Jl. Merdeka No. 12, Palembang"
          className="input-field"
        />
      </div>

      {/* Catatan opsional */}
      <div>
        <label className="block text-base font-semibold text-gray-700 mb-1">
          Catatan (opsional)
        </label>
        <textarea
          name="catatan"
          rows={2}
          placeholder="Catatan tambahan..."
          className="input-field resize-none"
        />
      </div>

      {/* Error */}
      {error && (
        <p className="text-red-500 text-sm font-medium">⚠️ {error}</p>
      )}

      {/* Tombol */}
      <div className="flex gap-3">
        <button type="submit" disabled={loading} className="btn-primary flex-1">
          {loading ? "Menyimpan..." : "💾 Simpan Acara"}
        </button>
        <button
          type="button"
          onClick={() => setTerbuka(false)}
          className="btn-secondary"
        >
          Batal
        </button>
      </div>
    </form>
  );
}
