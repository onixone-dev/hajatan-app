"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import KartuStatistik from "@/components/ui/KartuStatistik";
import { formatRupiah } from "@/lib/utils";
import type { Acara } from "@/types";

interface Biaya {
  id: string;
  acara_id: string;
  nama_biaya: string;
  kategori: string;
  jumlah: number;
  sudah_bayar: number;
  catatan?: string;
  created_at: string;
}

interface StateEdit {
  nama_biaya: string;
  kategori: string;
  nilaiJumlah: string;
  nilaiSudahBayar: string;
  catatan: string;
}

interface Props {
  acara: Acara;
  biayaAwal: Biaya[];
}

const KATEGORI_LIST = [
  { id: "konsumsi",    label: "🍽️ Konsumsi"    },
  { id: "dekorasi",    label: "🌸 Dekorasi"     },
  { id: "dokumentasi", label: "📸 Dokumentasi"  },
  { id: "hiburan",     label: "🎵 Hiburan"      },
  { id: "transport",   label: "🚗 Transport"    },
  { id: "pakaian",     label: "👗 Pakaian"      },
  { id: "administrasi",label: "📋 Administrasi" },
  { id: "lainnya",     label: "📦 Lainnya"      },
];

export default function BiayaClient({ acara, biayaAwal }: Props) {
  const [list, setList] = useState<Biaya[]>(biayaAwal);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sukses, setSukses] = useState("");
  const [suksesEdit, setSuksesEdit] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [menghapus, setMenghapus] = useState<string | null>(null);
  const [edit, setEdit] = useState<StateEdit>({
    nama_biaya: "", kategori: "lainnya",
    nilaiJumlah: "", nilaiSudahBayar: "", catatan: "",
  });

  // State form tambah
  const [nilaiJumlah, setNilaiJumlah] = useState("");
  const [nilaiSudahBayar, setNilaiSudahBayar] = useState("");

  // ── Statistik ──
  const totalBiaya     = list.reduce((s, b) => s + b.jumlah, 0);
  const totalSudahBayar = list.reduce((s, b) => s + b.sudah_bayar, 0);
  const totalSisa      = totalBiaya - totalSudahBayar;
  const totalItem      = list.length;

  // ── Helpers ──
  function formatUang(raw: string): string {
    const angka = raw.replace(/\D/g, "");
    if (angka === "") return "";
    return parseInt(angka).toLocaleString("id-ID");
  }

  function uangKeAngka(formatted: string): number {
    return parseInt(formatted.replace(/\./g, "")) || 0;
  }

  function hitungStatusBayar(jumlah: number, sudahBayar: number) {
    if (sudahBayar <= 0) return { label: "Belum Bayar", warna: "bg-red-100 text-red-700 border-red-300", icon: "🔴" };
    if (sudahBayar >= jumlah) return { label: "Lunas", warna: "bg-green-100 text-green-700 border-green-300", icon: "🟢" };
    return { label: "Sebagian", warna: "bg-yellow-100 text-yellow-700 border-yellow-300", icon: "🟡" };
  }

  function labelKategori(id: string): string {
    return KATEGORI_LIST.find((k) => k.id === id)?.label ?? "📦 Lainnya";
  }

  // ── Tambah ──
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(""); setSukses(""); setLoading(true);

    const formEl = e.currentTarget;
    const data = new FormData(formEl);
    const namaBiaya = (data.get("nama_biaya") as string).trim();

    const payload = {
      acara_id:    acara.id,
      nama_biaya:  namaBiaya,
      kategori:    data.get("kategori") as string,
      jumlah:      uangKeAngka(nilaiJumlah),
      sudah_bayar: uangKeAngka(nilaiSudahBayar),
      catatan:     (data.get("catatan") as string).trim() || null,
    };

    try {
      const { data: baru, error: sbError } = await supabase
        .from("biaya").insert(payload).select().single();
      if (sbError) throw sbError;

      setList([baru, ...list]);
      formEl.reset();
      setNilaiJumlah("");
      setNilaiSudahBayar("");
      setSukses(`✅ ${namaBiaya} berhasil ditambahkan!`);
      setTimeout(() => setSukses(""), 2000);
    } catch (err: any) {
      setError(`Gagal: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  // ── Buka edit ──
  function bukaEdit(b: Biaya) {
    setEditId(b.id);
    setEdit({
      nama_biaya:      b.nama_biaya,
      kategori:        b.kategori,
      nilaiJumlah:     b.jumlah > 0 ? b.jumlah.toLocaleString("id-ID") : "",
      nilaiSudahBayar: b.sudah_bayar > 0 ? b.sudah_bayar.toLocaleString("id-ID") : "",
      catatan:         b.catatan ?? "",
    });
  }

  // ── Simpan edit ──
  async function handleSimpanEdit(id: string) {
    if (!edit.nama_biaya.trim()) { alert("Nama biaya tidak boleh kosong."); return; }
    try {
      const payload = {
        nama_biaya:  edit.nama_biaya.trim(),
        kategori:    edit.kategori,
        jumlah:      uangKeAngka(edit.nilaiJumlah),
        sudah_bayar: uangKeAngka(edit.nilaiSudahBayar),
        catatan:     edit.catatan.trim() || null,
      };

      const { error } = await supabase.from("biaya").update(payload).eq("id", id);
      if (error) throw error;

      setList((prev) => prev.map((b) =>
        b.id === id ? { ...b, ...payload } : b
      ));
      setEditId(null);
      setSuksesEdit(`✅ ${edit.nama_biaya} berhasil diperbarui!`);
      setTimeout(() => setSuksesEdit(""), 3000);
    } catch (err: any) {
      alert(`Gagal: ${err.message}`);
    }
  }

  // ── Hapus ──
  async function handleHapus(id: string, nama: string) {
    if (!confirm(`Hapus biaya ${nama}?`)) return;
    setMenghapus(id);
    try {
      const { error } = await supabase.from("biaya").delete().eq("id", id);
      if (error) throw error;
      setList((prev) => prev.filter((b) => b.id !== id));
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
      <section className="card bg-red-50 border-red-200">
        <div className="flex items-center gap-3">
          <span className="text-4xl">💸</span>
          <div>
            <h2 className="text-xl font-bold text-red-800">Catatan Biaya</h2>
            <p className="text-gray-500 text-sm">{acara.nama_acara}</p>
          </div>
        </div>
      </section>

      {/* Statistik */}
      <div className="grid grid-cols-2 gap-3">
        <KartuStatistik label="Total Biaya" nilai={formatRupiah(totalBiaya)} ikon="💸" kecil />
        <KartuStatistik label="Sisa Bayar" nilai={formatRupiah(totalSisa)} ikon="🔴" kecil />
        <KartuStatistik label="Sudah Bayar" nilai={formatRupiah(totalSudahBayar)} ikon="🟢" kecil />
        <KartuStatistik label="Total Item" nilai={totalItem.toString()} ikon="📋" />
      </div>

      {/* Form tambah */}
      <section className="card">
        <h3 className="text-xl font-bold text-batik-700 mb-4">✍️ Tambah Biaya</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-base font-semibold text-gray-700 mb-1">
              Nama Biaya <span className="text-red-500">*</span>
            </label>
            <input name="nama_biaya" required
              placeholder="Contoh: Catering, Dekorasi Bunga..."
              className="input-field" autoComplete="off" />
          </div>

          <div>
            <label className="block text-base font-semibold text-gray-700 mb-1">Kategori</label>
            <select name="kategori" className="input-field bg-white">
              {KATEGORI_LIST.map((k) => (
                <option key={k.id} value={k.id}>{k.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-base font-semibold text-gray-700 mb-1">
              Total Biaya (Rp)
            </label>
            <input value={nilaiJumlah}
              onChange={(e) => setNilaiJumlah(formatUang(e.target.value))}
              placeholder="Contoh: 5.000.000"
              className="input-field" inputMode="numeric" autoComplete="off" />
            {nilaiJumlah !== "" && (
              <p className="text-sm text-batik-600 font-semibold mt-1">
                = {formatRupiah(uangKeAngka(nilaiJumlah))}
              </p>
            )}
          </div>

          {/* Sudah bayar */}
          <div className="bg-gray-50 rounded-xl p-3 space-y-2 border border-gray-200">
            <p className="text-sm font-bold text-gray-600">💳 Sudah Dibayar</p>
            <input value={nilaiSudahBayar}
              onChange={(e) => setNilaiSudahBayar(formatUang(e.target.value))}
              placeholder="Kosongkan jika belum bayar"
              className="input-field" inputMode="numeric" autoComplete="off" />
            {nilaiSudahBayar !== "" && (
              <p className="text-sm font-semibold mt-1">
                = {formatRupiah(uangKeAngka(nilaiSudahBayar))}
              </p>
            )}

            {/* Preview status */}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-sm text-gray-500">Status:</span>
              {(() => {
                const st = hitungStatusBayar(uangKeAngka(nilaiJumlah), uangKeAngka(nilaiSudahBayar));
                return (
                  <span className={`text-xs font-bold px-3 py-1 rounded-full border-2 ${st.warna}`}>
                    {st.icon} {st.label}
                  </span>
                );
              })()}
            </div>
          </div>

          <div>
            <label className="block text-base font-semibold text-gray-700 mb-1">
              Catatan <span className="text-gray-400 text-sm font-normal">(opsional)</span>
            </label>
            <input name="catatan" placeholder="Catatan tambahan..."
              className="input-field" />
          </div>

          {sukses && (
            <div className="bg-green-50 border-2 border-green-400 rounded-xl p-3
              text-green-700 font-semibold text-center">{sukses}</div>
          )}
          {error && <p className="text-red-500 text-sm">⚠️ {error}</p>}

          <button type="submit" disabled={loading} className="btn-primary w-full text-xl py-5">
            {loading ? "Menyimpan..." : "➕ Tambah Biaya"}
          </button>
        </form>
      </section>

      {/* Daftar biaya */}
      <section>
        <h3 className="text-xl font-bold text-batik-700 mb-3 flex items-center gap-2">
          <span>📋</span> Daftar Biaya
          <span className="ml-auto text-base font-normal text-gray-500">
            {list.length} item
          </span>
        </h3>

        {list.length === 0 ? (
          <div className="card text-center py-10 text-gray-400">
            <p className="text-4xl mb-2">💸</p>
            <p className="text-lg">Belum ada catatan biaya.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {list.map((b) => {
              const statusBayar = hitungStatusBayar(b.jumlah, b.sudah_bayar);
              return (
                <div key={b.id} className="card">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full bg-red-100 text-red-700 font-bold
                      flex items-center justify-center text-2xl flex-shrink-0">
                      💸
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-800 text-lg leading-tight">
                        {b.nama_biaya}
                      </p>
                      <p className="text-gray-400 text-xs">{labelKategori(b.kategori)}</p>

                      {b.jumlah > 0 && (
                        <p className="text-gray-700 text-sm mt-1">
                          💰 {formatRupiah(b.jumlah)}
                          {b.sudah_bayar > 0 && (
                            <span className="text-green-600 ml-2">
                              · Bayar {formatRupiah(b.sudah_bayar)}
                            </span>
                          )}
                        </p>
                      )}

                      {b.jumlah > 0 && b.sudah_bayar > 0 && b.sudah_bayar < b.jumlah && (
                        <p className="text-red-500 text-sm">
                          Sisa {formatRupiah(b.jumlah - b.sudah_bayar)}
                        </p>
                      )}

                      {b.catatan && (
                        <p className="text-gray-400 text-sm italic mt-1">"{b.catatan}"</p>
                      )}

                      {/* Badge status */}
                      <div className="mt-2">
                        <span className={`text-xs font-bold px-3 py-1 rounded-full border-2 ${statusBayar.warna}`}>
                          {statusBayar.icon} {statusBayar.label}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1 flex-shrink-0">
                      <button onClick={() => editId === b.id ? setEditId(null) : bukaEdit(b)}
                        className="text-batik-400 hover:text-batik-600 hover:bg-batik-50 p-2 rounded-lg transition-colors text-lg">
                        {editId === b.id ? "✖️" : "✏️"}
                      </button>
                      <button onClick={() => handleHapus(b.id, b.nama_biaya)}
                        disabled={menghapus === b.id}
                        className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors text-lg">
                        {menghapus === b.id ? "..." : "🗑️"}
                      </button>
                    </div>
                  </div>

                  {/* Panel edit */}
                  {editId === b.id && (
                    <div className="mt-4 pt-4 border-t border-red-100 space-y-3">
                      <p className="text-sm font-bold text-red-700">✏️ Edit Biaya</p>

                      <div>
                        <label className="block text-sm font-semibold text-gray-600 mb-1">Nama Biaya</label>
                        <input value={edit.nama_biaya}
                          onChange={(e) => setEdit((p) => ({ ...p, nama_biaya: e.target.value }))}
                          className="input-field" />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-600 mb-1">Kategori</label>
                        <select value={edit.kategori}
                          onChange={(e) => setEdit((p) => ({ ...p, kategori: e.target.value }))}
                          className="input-field bg-white">
                          {KATEGORI_LIST.map((k) => (
                            <option key={k.id} value={k.id}>{k.label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-600 mb-1">Total Biaya (Rp)</label>
                        <input value={edit.nilaiJumlah}
                          onChange={(e) => setEdit((p) => ({ ...p, nilaiJumlah: formatUang(e.target.value) }))}
                          className="input-field" inputMode="numeric" />
                        {edit.nilaiJumlah !== "" && (
                          <p className="text-sm text-batik-600 font-semibold mt-1">
                            = {formatRupiah(uangKeAngka(edit.nilaiJumlah))}
                          </p>
                        )}
                      </div>

                      <div className="bg-gray-50 rounded-xl p-3 space-y-2 border border-gray-200">
                        <p className="text-sm font-bold text-gray-600">💳 Sudah Dibayar</p>
                        <input value={edit.nilaiSudahBayar}
                          onChange={(e) => setEdit((p) => ({ ...p, nilaiSudahBayar: formatUang(e.target.value) }))}
                          className="input-field" inputMode="numeric" />
                        {edit.nilaiSudahBayar !== "" && (
                          <p className="text-sm font-semibold mt-1">
                            = {formatRupiah(uangKeAngka(edit.nilaiSudahBayar))}
                          </p>
                        )}
                        <div className="flex items-center gap-2 pt-1">
                          <span className="text-sm text-gray-500">Status:</span>
                          {(() => {
                            const st = hitungStatusBayar(
                              uangKeAngka(edit.nilaiJumlah),
                              uangKeAngka(edit.nilaiSudahBayar)
                            );
                            return (
                              <span className={`text-xs font-bold px-3 py-1 rounded-full border-2 ${st.warna}`}>
                                {st.icon} {st.label}
                              </span>
                            );
                          })()}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-600 mb-1">Catatan</label>
                        <input value={edit.catatan}
                          onChange={(e) => setEdit((p) => ({ ...p, catatan: e.target.value }))}
                          placeholder="Catatan tambahan..." className="input-field" />
                      </div>

                      <div className="flex gap-2">
                        <button onClick={() => handleSimpanEdit(b.id)}
                          className="btn-primary flex-1 py-3 text-base">💾 Simpan</button>
                        <button onClick={() => setEditId(null)}
                          className="btn-secondary py-3 px-5 text-base">Batal</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Toast notifikasi edit */}
      {suksesEdit && (
        <div className="fixed bottom-6 left-4 right-4 z-50 bg-green-600 text-white
          font-semibold text-center py-4 px-6 rounded-2xl shadow-xl animate-bounce">
          {suksesEdit}
        </div>
      )}
    </div>
  );
}