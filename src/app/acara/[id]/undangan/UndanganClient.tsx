"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import KartuStatistik from "@/components/ui/KartuStatistik";
import type { Acara } from "@/types";

interface Undangan {
  id: string;
  acara_id: string;
  nama: string;
  alamat?: string;
  status: "hadir" | "tidak_hadir" | "belum";
  catatan?: string;
  created_at: string;
}

interface Props {
  acara: Acara;
  undanganAwal: Undangan[];
}

const STATUS_LABEL: Record<string, { label: string; warna: string; icon: string }> = {
  hadir:       { label: "Hadir",       warna: "bg-green-100 text-green-700 border-green-300", icon: "✅" },
  tidak_hadir: { label: "Tidak Hadir", warna: "bg-red-100   text-red-700   border-red-300",   icon: "❌" },
  belum:       { label: "Belum",       warna: "bg-gray-100  text-gray-600  border-gray-300",  icon: "⏳" },
};

export default function UndanganClient({ acara, undanganAwal }: Props) {
  const [list, setList] = useState<Undangan[]>(undanganAwal);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sukses, setSukses] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [menghapus, setMenghapus] = useState<string | null>(null);
  const [edit, setEdit] = useState<Partial<Undangan>>({});

  // ── Statistik ──
  const totalHadir      = list.filter((u) => u.status === "hadir").length;
  const totalTidakHadir = list.filter((u) => u.status === "tidak_hadir").length;
  const totalBelum      = list.filter((u) => u.status === "belum").length;

  // Otomatis ubah status "belum" → "tidak_hadir" setelah jam 18:00
// di tanggal acara
useEffect(() => {
  async function cekPenutupan() {
    const sekarang = new Date();
    const tanggalAcara = new Date(acara.tanggal);

    // Samakan tanggal (tanpa jam)
    const hariIni = new Date(
      sekarang.getFullYear(),
      sekarang.getMonth(),
      sekarang.getDate()
    );
    const hariAcara = new Date(
      tanggalAcara.getFullYear(),
      tanggalAcara.getMonth(),
      tanggalAcara.getDate()
    );

    const sudahJam18 = sekarang.getHours() >= 18;
    const hariSama = hariIni.getTime() === hariAcara.getTime();

    // Hanya jalankan kalau hari acara dan sudah lewat jam 18
    if (!hariSama || !sudahJam18) return;

    // Ambil semua yang masih "belum"
    const yangBelum = list.filter((u) => u.status === "belum");
    if (yangBelum.length === 0) return;

    // Update ke Supabase sekaligus
    const ids = yangBelum.map((u) => u.id);
    const { error } = await supabase
      .from("undangan")
      .update({ status: "tidak_hadir" })
      .in("id", ids);

    if (error) { console.error("Gagal auto-update status:", error); return; }

    // Update state lokal
    setList((prev) =>
      prev.map((u) => u.status === "belum" ? { ...u, status: "tidak_hadir" } : u)
    );

    console.log(`${yangBelum.length} undangan otomatis diubah ke Tidak Hadir.`);
  }

  cekPenutupan();

  // Cek ulang setiap 1 menit — antisipasi halaman dibuka sebelum jam 18
  const interval = setInterval(cekPenutupan, 60 * 1000);
  return () => clearInterval(interval);
}, [acara.tanggal, list]);

  // ── Tambah ──
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(""); setSukses(""); setLoading(true);

    const formEl = e.currentTarget;
    const data = new FormData(formEl);
    const nama = (data.get("nama") as string).trim();

    const payload = {
      acara_id: acara.id,
      nama,
      alamat:   (data.get("alamat") as string).trim() || null,
      status:   "belum" as const,
      catatan:  (data.get("catatan") as string).trim() || null,
    };

    try {
      const { data: baru, error: sbError } = await supabase
        .from("undangan").insert(payload).select().single();
      if (sbError) throw sbError;

      setList([baru, ...list]);
      formEl.reset();
      setSukses(`✅ ${nama} berhasil ditambahkan!`);
      setTimeout(() => setSukses(""), 2000);
    } catch (err: any) {
      setError(`Gagal: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  // ── Update status ──
  async function handleStatusChange(id: string, status: Undangan["status"]) {
    try {
      const { error } = await supabase
        .from("undangan").update({ status }).eq("id", id);
      if (error) throw error;
      setList((prev) => prev.map((u) => u.id === id ? { ...u, status } : u));
    } catch (err: any) {
      alert(`Gagal update status: ${err.message}`);
    }
  }

  // ── Edit ──
  function bukaEdit(u: Undangan) {
    setEditId(u.id);
    setEdit({ nama: u.nama, alamat: u.alamat ?? "", catatan: u.catatan ?? "" });
  }

  async function handleSimpanEdit(id: string) {
    if (!edit.nama?.trim()) { alert("Nama tidak boleh kosong."); return; }
    try {
      const payloadDB = {
        nama:    edit.nama.trim(),
        alamat:  edit.alamat?.trim() || null,
        catatan: edit.catatan?.trim() || null,
      };
      const payloadLokal: Partial<Undangan> = {
        nama:    edit.nama.trim(),
        alamat:  edit.alamat?.trim() || undefined,
        catatan: edit.catatan?.trim() || undefined,
      };
      const { error } = await supabase.from("undangan").update(payloadDB).eq("id", id);
      if (error) throw error;
      setList((prev) => prev.map((u) => u.id === id ? { ...u, ...payloadLokal } : u));
      setEditId(null);
    } catch (err: any) {
      alert(`Gagal: ${err.message}`);
    }
  }

  // ── Hapus ──
  async function handleHapus(id: string, nama: string) {
    if (!confirm(`Hapus undangan ${nama}?`)) return;
    setMenghapus(id);
    try {
      const { error } = await supabase.from("undangan").delete().eq("id", id);
      if (error) throw error;
      setList((prev) => prev.filter((u) => u.id !== id));
    } catch (err: any) {
      alert(`Gagal: ${err.message}`);
    } finally {
      setMenghapus(null);
    }
  }

  return (
    <div className="space-y-6">
      <Link href={`/acara/${acara.id}`}
        className="inline-flex items-center gap-2 text-batik-600 font-semibold text-lg hover:underline">
        ‹ Kembali
      </Link>

      {/* Header */}
      <section className="card bg-purple-50 border-purple-200">
        <div className="flex items-center gap-3">
          <span className="text-4xl">📨</span>
          <div>
            <h2 className="text-xl font-bold text-purple-800">Catatan Undangan</h2>
            <p className="text-gray-500 text-sm">{acara.nama_acara}</p>
          </div>
        </div>
      </section>

      {/* Statistik */}
      <div className="grid grid-cols-3 gap-3">
        <KartuStatistik label="Hadir" nilai={totalHadir.toString()} ikon="✅" />
        <KartuStatistik label="Tidak Hadir" nilai={totalTidakHadir.toString()} ikon="❌" />
        <KartuStatistik label="Belum Konfirmasi" nilai={totalBelum.toString()} ikon="⏳" />
      </div>

      {/* Form tambah */}
      <section className="card">
        <h3 className="text-xl font-bold text-batik-700 mb-4">✍️ Tambah Undangan</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-base font-semibold text-gray-700 mb-1">
              Nama <span className="text-red-500">*</span>
            </label>
            <input name="nama" required placeholder="Contoh: Pak Budi"
              className="input-field" autoComplete="off" />
          </div>
          <div>
            <label className="block text-base font-semibold text-gray-700 mb-1">
              Alamat <span className="text-gray-400 text-sm font-normal">(opsional)</span>
            </label>
            <input name="alamat" placeholder="Contoh: Jaya Bhakti"
              className="input-field" />
          </div>
          <div>
            <label className="block text-base font-semibold text-gray-700 mb-1">
              Catatan <span className="text-gray-400 text-sm font-normal">(opsional)</span>
            </label>
            <input name="catatan" placeholder="Catatan tambahan..."
              className="input-field" />
          </div>

          {sukses && (
            <div className="bg-green-50 border-2 border-green-400 rounded-xl p-3 text-green-700 font-semibold text-center">
              {sukses}
            </div>
          )}
          {error && <p className="text-red-500 text-sm">⚠️ {error}</p>}

          <button type="submit" disabled={loading} className="btn-primary w-full text-xl py-5">
            {loading ? "Menyimpan..." : "➕ Tambah Undangan"}
          </button>
        </form>
      </section>

      {/* Daftar */}
      <section>
        <h3 className="text-xl font-bold text-batik-700 mb-3 flex items-center gap-2">
          <span>📋</span> Daftar Undangan
          <span className="ml-auto text-base font-normal text-gray-500">
            {list.length} undangan
          </span>
        </h3>

        {list.length === 0 ? (
          <div className="card text-center py-10 text-gray-400">
            <p className="text-4xl mb-2">📨</p>
            <p className="text-lg">Belum ada undangan.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {list.map((u) => (
              <div key={u.id} className="card">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-700 font-bold
                    flex items-center justify-center text-lg flex-shrink-0">
                    {u.nama.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-800 text-lg leading-tight">{u.nama}</p>
                    {u.alamat && <p className="text-gray-500 text-sm">📍 {u.alamat}</p>}
                    {u.catatan && <p className="text-gray-400 text-sm italic">"{u.catatan}"</p>}

                    {/* Tombol status */}
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {(["hadir", "tidak_hadir", "belum"] as const).map((s) => (
                        <button key={s}
                          onClick={() => handleStatusChange(u.id, s)}
                          className={`text-xs font-bold px-3 py-1 rounded-full border-2 transition-all
                            ${u.status === s
                              ? STATUS_LABEL[s].warna + " scale-105"
                              : "bg-white text-gray-400 border-gray-200 hover:border-gray-300"
                            }`}>
                          {STATUS_LABEL[s].icon} {STATUS_LABEL[s].label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 flex-shrink-0">
                    <button onClick={() => editId === u.id ? setEditId(null) : bukaEdit(u)}
                      className="text-batik-400 hover:text-batik-600 hover:bg-batik-50 p-2 rounded-lg transition-colors text-lg">
                      {editId === u.id ? "✖️" : "✏️"}
                    </button>
                    <button onClick={() => handleHapus(u.id, u.nama)} disabled={menghapus === u.id}
                      className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors text-lg">
                      {menghapus === u.id ? "..." : "🗑️"}
                    </button>
                  </div>
                </div>

                {/* Panel edit */}
                {editId === u.id && (
                  <div className="mt-4 pt-4 border-t border-purple-100 space-y-3">
                    <p className="text-sm font-bold text-purple-700">✏️ Edit Undangan</p>
                    <div>
                      <label className="block text-sm font-semibold text-gray-600 mb-1">Nama</label>
                      <input value={edit.nama ?? ""}
                        onChange={(e) => setEdit((p) => ({ ...p, nama: e.target.value }))}
                        className="input-field" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-600 mb-1">Alamat</label>
                      <input value={edit.alamat ?? ""}
                        onChange={(e) => setEdit((p) => ({ ...p, alamat: e.target.value }))}
                        className="input-field" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-600 mb-1">Catatan</label>
                      <input value={edit.catatan ?? ""}
                        onChange={(e) => setEdit((p) => ({ ...p, catatan: e.target.value }))}
                        placeholder="Catatan tambahan..." className="input-field" />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleSimpanEdit(u.id)}
                        className="btn-primary flex-1 py-3 text-base">💾 Simpan</button>
                      <button onClick={() => setEditId(null)}
                        className="btn-secondary py-3 px-5 text-base">Batal</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}