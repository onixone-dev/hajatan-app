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
  satuan: string;
  harga_satuan: number;
  sudah_bayar: number;
  catatan?: string;
  created_at: string;
}

interface StateEdit {
  nama_biaya: string;
  kategori: string;
  jumlah: string;
  satuan: string;
  nilaiHargaSatuan: string;
  nilaiSudahBayar: string;
  catatan: string;
}

interface Props {
  acara: Acara;
  biayaAwal: Biaya[];
}

const KATEGORI_LIST = [
  { id: "konsumsi",     label: "🍽️ Konsumsi"     },
  { id: "sembako",      label: "🛒 Sembako"       },
  { id: "dekorasi",     label: "🌸 Dekorasi"      },
  { id: "dokumentasi",  label: "📸 Dokumentasi"   },
  { id: "hiburan",      label: "🎵 Hiburan"       },
  { id: "transport",    label: "🚗 Transport"     },
  { id: "pakaian",      label: "👗 Pakaian"       },
  { id: "administrasi", label: "📋 Administrasi"  },
  { id: "lainnya",      label: "📦 Lainnya"       },
];

const SATUAN_PER_KATEGORI: Record<string, string[]> = {
  konsumsi:     ["porsi", "pax", "kotak", "kg", "liter", "paket"],
  sembako:      ["kg", "liter", "buah", "paket", "lusin", "kotak", "dus", "karung"],
  dekorasi:     ["paket", "unit", "set", "meter", "buah"],
  dokumentasi:  ["paket", "jam", "hari", "unit"],
  hiburan:      ["paket", "jam", "malam", "hari"],
  transport:    ["liter", "km", "hari", "unit", "kali"],
  pakaian:      ["stel", "buah", "pasang", "paket"],
  administrasi: ["lembar", "buah", "paket", "kotak"],
  lainnya:      ["unit", "paket", "buah", "set", "kali"],
};

export default function BiayaClient({ acara, biayaAwal }: Props) {
  const [list, setList] = useState<Biaya[]>(biayaAwal);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sukses, setSukses] = useState("");
  const [suksesEdit, setSuksesEdit] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [menghapus, setMenghapus] = useState<string | null>(null);
  const [filterKategori, setFilterKategori] = useState("semua");
  const [edit, setEdit] = useState<StateEdit>({
    nama_biaya: "", kategori: "lainnya", jumlah: "1",
    satuan: "unit", nilaiHargaSatuan: "", nilaiSudahBayar: "", catatan: "",
  });

  // State form tambah
  const [kategoriTambah, setKategoriTambah] = useState("lainnya");
  const [nilaiHargaSatuan, setNilaiHargaSatuan] = useState("");
  const [nilaiSudahBayar, setNilaiSudahBayar] = useState("");
  const [jumlahTambah, setJumlahTambah] = useState(1);

  // ── Statistik ──
  const totalBiaya      = list.reduce((s, b) => s + (b.harga_satuan * b.jumlah), 0);
  const totalSudahBayar = list.reduce((s, b) => s + b.sudah_bayar, 0);
  const totalSisa       = totalBiaya - totalSudahBayar;

  // ── Filter ──
  const listTerfilter = filterKategori === "semua"
    ? list
    : list.filter((b) => b.kategori === filterKategori);

  // ── Helpers ──
  function formatUang(raw: string): string {
    const angka = raw.replace(/\D/g, "");
    if (angka === "") return "";
    return parseInt(angka).toLocaleString("id-ID");
  }

  function uangKeAngka(formatted: string): number {
    return parseInt(formatted.replace(/\./g, "")) || 0;
  }

  function hitungTotal(hargaSatuan: number, jumlah: number): number {
    return hargaSatuan * jumlah;
  }

  function hitungStatusBayar(total: number, sudahBayar: number) {
    if (sudahBayar <= 0)      return { label: "Belum Bayar", warna: "bg-red-100 text-red-700 border-red-300",    icon: "🔴" };
    if (sudahBayar >= total)  return { label: "Lunas",       warna: "bg-green-100 text-green-700 border-green-300", icon: "🟢" };
    return                           { label: "Sebagian",    warna: "bg-yellow-100 text-yellow-700 border-yellow-300", icon: "🟡" };
  }

  function labelKategori(id: string): string {
    return KATEGORI_LIST.find((k) => k.id === id)?.label ?? "📦 Lainnya";
  }

  function satuanList(kategori: string): string[] {
    return SATUAN_PER_KATEGORI[kategori] ?? SATUAN_PER_KATEGORI.lainnya;
  }

  // ── Tambah ──
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(""); setSukses(""); setLoading(true);

    const formEl = e.currentTarget;
    const data = new FormData(formEl);
    const namaBiaya  = (data.get("nama_biaya") as string).trim();
    const jumlahVal  = parseInt(data.get("jumlah") as string) || 1;
    const hargaVal   = uangKeAngka(nilaiHargaSatuan);

    const payload = {
      acara_id:     acara.id,
      nama_biaya:   namaBiaya,
      kategori:     kategoriTambah,
      jumlah:       jumlahVal,
      satuan:       data.get("satuan") as string,
      harga_satuan: hargaVal,
      sudah_bayar:  uangKeAngka(nilaiSudahBayar),
      catatan:      (data.get("catatan") as string).trim() || null,
    };

    try {
      const { data: baru, error: sbError } = await supabase
        .from("biaya").insert(payload).select().single();
      if (sbError) throw sbError;

      setList([baru, ...list]);
      formEl.reset();
      setKategoriTambah("lainnya");
      setNilaiHargaSatuan("");
      setNilaiSudahBayar("");
      setJumlahTambah(1);
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
      nama_biaya:       b.nama_biaya,
      kategori:         b.kategori,
      jumlah:           b.jumlah.toString(),
      satuan:           b.satuan,
      nilaiHargaSatuan: b.harga_satuan > 0 ? b.harga_satuan.toLocaleString("id-ID") : "",
      nilaiSudahBayar:  b.sudah_bayar > 0 ? b.sudah_bayar.toLocaleString("id-ID") : "",
      catatan:          b.catatan ?? "",
    });
  }

  // ── Simpan edit ──
  async function handleSimpanEdit(id: string) {
    if (!edit.nama_biaya.trim()) { alert("Nama biaya tidak boleh kosong."); return; }
    try {
      const jumlahVal = parseInt(edit.jumlah) || 1;
      const hargaVal  = uangKeAngka(edit.nilaiHargaSatuan);

      const payload = {
        nama_biaya:   edit.nama_biaya.trim(),
        kategori:     edit.kategori,
        jumlah:       jumlahVal,
        satuan:       edit.satuan,
        harga_satuan: hargaVal,
        sudah_bayar:  uangKeAngka(edit.nilaiSudahBayar),
        catatan:      edit.catatan.trim() || null,
      };

      const { error } = await supabase.from("biaya").update(payload).eq("id", id);
      if (error) throw error;

      setList((prev) => prev.map((b) => b.id === id ? { ...b, ...payload } as Biaya : b));
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
        <KartuStatistik label="Total Biaya"   nilai={formatRupiah(totalBiaya)}      ikon="💸" kecil />
        <KartuStatistik label="Sisa Bayar"    nilai={formatRupiah(totalSisa)}        ikon="🔴" kecil />
        <KartuStatistik label="Sudah Bayar"   nilai={formatRupiah(totalSudahBayar)}  ikon="🟢" kecil />
        <KartuStatistik label="Total Item"    nilai={list.length.toString()}         ikon="📋" />
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
              placeholder="Contoh: Catering, Bensin, Cetak Undangan..."
              className="input-field" autoComplete="off" />
          </div>

          {/* Kategori */}
          <div>
            <label className="block text-base font-semibold text-gray-700 mb-1">Kategori</label>
            <select name="kategori" value={kategoriTambah}
              onChange={(e) => setKategoriTambah(e.target.value)}
              className="input-field bg-white">
              {KATEGORI_LIST.map((k) => (
                <option key={k.id} value={k.id}>{k.label}</option>
              ))}
            </select>
          </div>

          {/* Jumlah & Satuan */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-base font-semibold text-gray-700 mb-1">Jumlah</label>
              <input name="jumlah" type="number" min="1" value={jumlahTambah}
                onChange={(e) => setJumlahTambah(parseInt(e.target.value) || 1)}
                className="input-field" inputMode="numeric" />
            </div>
            <div className="flex-1">
              <label className="block text-base font-semibold text-gray-700 mb-1">Satuan</label>
              <select name="satuan" className="input-field bg-white">
                {satuanList(kategoriTambah).map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Harga satuan */}
          <div>
            <label className="block text-base font-semibold text-gray-700 mb-1">
              Harga Satuan (Rp)
            </label>
            <input value={nilaiHargaSatuan}
              onChange={(e) => setNilaiHargaSatuan(formatUang(e.target.value))}
              placeholder="Contoh: 50.000"
              className="input-field" inputMode="numeric" autoComplete="off" />
            {nilaiHargaSatuan !== "" && (
              <div className="mt-1 space-y-0.5">
                {jumlahTambah > 1 && (
                  <p className="text-sm text-batik-600  font-semibold">
                   = {formatRupiah(uangKeAngka(nilaiHargaSatuan))} × {jumlahTambah} ={" "}
                    <span className="font-bold text-batik-700">
                      {formatRupiah(uangKeAngka(nilaiHargaSatuan) * jumlahTambah)}
                    </span>
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Sudah bayar */}
          <div className="bg-gray-50 rounded-xl p-3 space-y-2 border border-gray-200">
            <p className="text-sm font-bold text-gray-600">💳 Pembayaran</p>
            <input value={nilaiSudahBayar}
              onChange={(e) => setNilaiSudahBayar(formatUang(e.target.value))}
              placeholder="Kosongkan jika belum bayar"
              className="input-field" inputMode="numeric" autoComplete="off" />
            <div className="flex items-center gap-2 pt-1">
              <span className="text-sm text-gray-500">Status:</span>
              {(() => {
                // Pakai total (harga × jumlah) bukan harga satuan saja
                const total = uangKeAngka(nilaiHargaSatuan) * jumlahTambah;
                const st = hitungStatusBayar(total, uangKeAngka(nilaiSudahBayar));
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
            <input name="catatan" placeholder="Catatan tambahan..." className="input-field" />
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

      {/* Filter kategori */}
      <section>
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setFilterKategori("semua")}
            className={`flex-shrink-0 text-sm font-bold px-4 py-2 rounded-full border-2 transition-all
              ${filterKategori === "semua"
                ? "bg-batik-600 text-white border-batik-600"
                : "bg-white text-gray-500 border-gray-200"}`}>
            Semua ({list.length})
          </button>
          {KATEGORI_LIST.filter((k) => list.some((b) => b.kategori === k.id)).map((k) => (
            <button key={k.id}
              onClick={() => setFilterKategori(k.id)}
              className={`flex-shrink-0 text-sm font-bold px-4 py-2 rounded-full border-2 transition-all
                ${filterKategori === k.id
                  ? "bg-batik-600 text-white border-batik-600"
                  : "bg-white text-gray-500 border-gray-200"}`}>
              {k.label} ({list.filter((b) => b.kategori === k.id).length})
            </button>
          ))}
        </div>
      </section>

      {/* Daftar biaya */}
      <section>
        <h3 className="text-xl font-bold text-batik-700 mb-3 flex items-center gap-2">
          <span>📋</span> Daftar Biaya
          <span className="ml-auto text-base font-normal text-gray-500">
            {listTerfilter.length} item
          </span>
        </h3>

        {listTerfilter.length === 0 ? (
          <div className="card text-center py-10 text-gray-400">
            <p className="text-4xl mb-2">💸</p>
            <p className="text-lg">Belum ada catatan biaya.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {listTerfilter.map((b) => {
              const total       = hitungTotal(b.harga_satuan, b.jumlah);
              const statusBayar = hitungStatusBayar(total, b.sudah_bayar);
              return (
                <div key={b.id} className="card">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full bg-red-100 text-red-700
                      flex items-center justify-center text-2xl flex-shrink-0">
                      💸
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-800 text-lg leading-tight">
                        {b.nama_biaya}
                      </p>
                      <p className="text-gray-400 text-xs">{labelKategori(b.kategori)}</p>
                      <p className="text-gray-500 text-sm mt-1">
                        {b.jumlah} {b.satuan}
                        {b.harga_satuan > 0 && (
                          <span className="ml-1">× {formatRupiah(b.harga_satuan)}</span>
                        )}
                      </p>
                      {total > 0 && (
                        <p className="text-gray-700 text-sm font-semibold">
                          = {formatRupiah(total)}
                          {b.sudah_bayar > 0 && (
                            <span className="text-green-600 ml-2 font-normal">
                              · Bayar {formatRupiah(b.sudah_bayar)}
                            </span>
                          )}
                        </p>
                      )}
                      {total > 0 && b.sudah_bayar > 0 && b.sudah_bayar < total && (
                        <p className="text-red-500 text-sm">
                          Sisa {formatRupiah(total - b.sudah_bayar)}
                        </p>
                      )}
                      {b.catatan && (
                        <p className="text-gray-400 text-sm italic mt-1">"{b.catatan}"</p>
                      )}
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
                          onChange={(e) => setEdit((p) => ({ ...p, kategori: e.target.value, satuan: satuanList(e.target.value)[0] }))}
                          className="input-field bg-white">
                          {KATEGORI_LIST.map((k) => (
                            <option key={k.id} value={k.id}>{k.label}</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex gap-3">
                        <div className="flex-1">
                          <label className="block text-sm font-semibold text-gray-600 mb-1">Jumlah</label>
                          <input type="number" min="1" value={edit.jumlah}
                            onChange={(e) => setEdit((p) => ({ ...p, jumlah: e.target.value }))}
                            className="input-field" inputMode="numeric" />
                        </div>
                        <div className="flex-1">
                          <label className="block text-sm font-semibold text-gray-600 mb-1">Satuan</label>
                          <select value={edit.satuan}
                            onChange={(e) => setEdit((p) => ({ ...p, satuan: e.target.value }))}
                            className="input-field bg-white">
                            {satuanList(edit.kategori).map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-600 mb-1">Harga Satuan (Rp)</label>
                        <input value={edit.nilaiHargaSatuan}
                          onChange={(e) => setEdit((p) => ({ ...p, nilaiHargaSatuan: formatUang(e.target.value) }))}
                          className="input-field" inputMode="numeric" />
                        {edit.nilaiHargaSatuan !== "" && (
                          <div className="mt-1 space-y-0.5">
                            <p className="text-sm text-batik-600 font-semibold">
                              = {formatRupiah(uangKeAngka(edit.nilaiHargaSatuan))}
                            </p>
                            {parseInt(edit.jumlah) > 1 && (
                              <p className="text-sm text-gray-500">
                                {formatRupiah(uangKeAngka(edit.nilaiHargaSatuan))} × {edit.jumlah} ={" "}
                                <span className="font-bold text-batik-700">
                                  {formatRupiah(uangKeAngka(edit.nilaiHargaSatuan) * (parseInt(edit.jumlah) || 1))}
                                </span>
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="bg-gray-50 rounded-xl p-3 space-y-2 border border-gray-200">
                        <p className="text-sm font-bold text-gray-600">💳 Sudah Dibayar</p>
                        {edit.nilaiHargaSatuan !== "" && (
                          <p className="text-xs text-gray-400">
                            Total tagihan:{" "}
                            <span className="font-bold text-gray-600">
                              {formatRupiah(
                                uangKeAngka(edit.nilaiHargaSatuan) * (parseInt(edit.jumlah) || 1)
                              )}
                            </span>
                          </p>
                        )}
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
                            const total = hitungTotal(
                              uangKeAngka(edit.nilaiHargaSatuan),
                              parseInt(edit.jumlah) || 1
                            );
                            const st = hitungStatusBayar(total, uangKeAngka(edit.nilaiSudahBayar));
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

      {/* Toast */}
      {suksesEdit && (
        <div className="fixed bottom-6 left-4 right-4 z-50 bg-green-600 text-white
          font-semibold text-center py-4 px-6 rounded-2xl shadow-xl animate-bounce">
          {suksesEdit}
        </div>
      )}
    </div>
  );
}