"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import KartuStatistik from "@/components/ui/KartuStatistik";
import { formatRupiah } from "@/lib/utils";
import type { Acara } from "@/types";

interface Sewa {
  id: string;
  acara_id: string;
  nama_barang: string;
  vendor?: string;
  jumlah: number;
  lunas: number;
  satuan: string;
  harga: number;
  dp: number;
  status: "belum_lunas" | "dp_dibayar" | "lunas";
  tanggal_ambil?: string;
  tanggal_kembali?: string;
  catatan?: string;
  created_at: string;
}

interface StateEdit {
  nama_barang: string;
  vendor: string;
  jumlah: string;
  satuan: string;
  nilaiHarga: string;
  nilaiDp: string;
  nilaiLunas: string;
  tanggal_ambil: string;
  tanggal_kembali: string;
  catatan: string;
}

interface Props {
  acara: Acara;
  sewaAwal: Sewa[];
}

const STATUS_LABEL: Record<string, { label: string; warna: string; icon: string }> = {
  belum_lunas: { label: "Belum Lunas", warna: "bg-red-100 text-red-700 border-red-300",       icon: "🔴" },
  dp_dibayar:  { label: "DP Dibayar",  warna: "bg-yellow-100 text-yellow-700 border-yellow-300", icon: "🟡" },
  lunas:       { label: "Lunas",       warna: "bg-green-100 text-green-700 border-green-300",  icon: "🟢" },
};

const SATUAN_LIST = ["unit", "set", "buah", "meter", "hari", "malam", "paket"];

const CONTOH_BARANG = [
  "Tenda", "Pelaminan", "Orgen Tunggal", "Sound System",
  "Meja", "Kursi", "Perlengkapan Masak", "Generator",
  "Dekorasi", "Backdrop", "Lighting", "Kipas Angin",
];

export default function SewaClient({ acara, sewaAwal }: Props) {
  const [list, setList] = useState<Sewa[]>(sewaAwal);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sukses, setSukses] = useState("");
  const [suksesEdit, setSuksesEdit] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [edit, setEdit] = useState<StateEdit>({
  nama_barang: "", vendor: "", jumlah: "1", satuan: "unit",
  nilaiHarga: "", nilaiDp: "", nilaiLunas: "",
  tanggal_ambil: "", tanggal_kembali: "", catatan: "",
});
  const [menghapus, setMenghapus] = useState<string | null>(null);

  // State form tambah
  const [nilaiHarga, setNilaiHarga] = useState("");
  const [nilaiDp, setNilaiDp] = useState("");
  const [nilaiLunas, setNilaiLunas] = useState("");
  const [suggestionBarang, setSuggestionBarang] = useState<string[]>([]);

  // ── Statistik ──
  const totalHarga   = list.reduce((s, i) => s + i.harga, 0);
  const totalDp      = list.reduce((s, i) => s + i.dp, 0);
  const totalLunas   = list.filter((i) => i.status === "lunas").length;
  const sisaBayar    = totalHarga - totalDp;

  // ── Helpers ──
  function formatUang(raw: string): string {
    const angka = raw.replace(/\D/g, "");
    if (angka === "") return "";
    return parseInt(angka).toLocaleString("id-ID");
  }

  function uangKeAngka(formatted: string): number {
    return parseInt(formatted.replace(/\./g, "")) || 0;
  }

  function hitungStatus(dp: number, lunas: number): Sewa["status"] {
  if (lunas > 0) return "lunas";
  if (dp > 0) return "dp_dibayar";
  return "belum_lunas";
}

  function cariBarang(teks: string) {
    if (teks.trim() === "") { setSuggestionBarang([]); return; }
    const cocok = CONTOH_BARANG.filter((b) =>
      b.toLowerCase().includes(teks.toLowerCase())
    );
    setSuggestionBarang(cocok);
  }

  // ── Tambah ──
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(""); setSukses(""); setLoading(true);

    const formEl = e.currentTarget;
    const data = new FormData(formEl);
    const dpVal    = uangKeAngka(nilaiDp);
    const lunasVal = uangKeAngka(nilaiLunas);

    const payload = {
      acara_id:       acara.id,
      nama_barang:    (data.get("nama_barang") as string).trim(),
      vendor:         (data.get("vendor") as string).trim() || null,
      jumlah:         parseInt(data.get("jumlah") as string) || 1,
      satuan:         data.get("satuan") as string,
      harga:          uangKeAngka(nilaiHarga),
      dp:     dpVal,
      lunas:  lunasVal,
      status: hitungStatus(dpVal, lunasVal),
      tanggal_ambil:  (data.get("tanggal_ambil") as string) || null,
      tanggal_kembali:(data.get("tanggal_kembali") as string) || null,
      catatan:        (data.get("catatan") as string).trim() || null,
    };

    try {
      const { data: baru, error: sbError } = await supabase
        .from("sewa").insert(payload).select().single();
      if (sbError) throw sbError;

      setList([baru, ...list]);
      formEl.reset();
      setNilaiHarga("");
      setNilaiDp("");
      setNilaiLunas("");
      setSuggestionBarang([]);
      setSukses(`✅ ${payload.nama_barang} berhasil ditambahkan!`);
      setTimeout(() => setSukses(""), 2000);
    } catch (err: any) {
      setError(`Gagal: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  // ── Update status langsung ──
  async function handleStatusChange(id: string, status: Sewa["status"]) {
    try {
      const { error } = await supabase
        .from("sewa").update({ status }).eq("id", id);
      if (error) throw error;
      setList((prev) => prev.map((s) => s.id === id ? { ...s, status } : s));
    } catch (err: any) {
      alert(`Gagal: ${err.message}`);
    }
  }

  // ── Buka edit ──
  function bukaEdit(s: Sewa) {
  setEditId(s.id);
  setEdit({
    nama_barang:     s.nama_barang,
    vendor:          s.vendor ?? "",
    jumlah:          s.jumlah.toString(),
    satuan:          s.satuan,
    nilaiHarga:      s.harga > 0 ? s.harga.toLocaleString("id-ID") : "",
    nilaiDp:         s.dp > 0 ? s.dp.toLocaleString("id-ID") : "",
    nilaiLunas:      s.lunas > 0 ? s.lunas.toLocaleString("id-ID") : "",
    tanggal_ambil:   s.tanggal_ambil ?? "",
    tanggal_kembali: s.tanggal_kembali ?? "",
    catatan:         s.catatan ?? "",
  });
}
  // ── Simpan edit ──
  async function handleSimpanEdit(id: string) {
    if (!edit.nama_barang.trim()) { alert("Nama barang tidak boleh kosong."); return; }
    try {

      const dpVal    = uangKeAngka(edit.nilaiDp);
      const lunasVal = uangKeAngka(edit.nilaiLunas);

      const payloadDB = {
        nama_barang:    edit.nama_barang.trim(),
        vendor:         edit.vendor.trim() || null,
        jumlah:         parseInt(edit.jumlah) || 1,
        satuan:         edit.satuan,
        harga:          uangKeAngka(edit.nilaiHarga),
        dp:     dpVal,
        lunas:  lunasVal,
        status: hitungStatus(dpVal, lunasVal),
        tanggal_ambil:  edit.tanggal_ambil || null,
        tanggal_kembali:edit.tanggal_kembali || null,
        catatan:        edit.catatan.trim() || null,
      };

      const { error } = await supabase.from("sewa").update(payloadDB).eq("id", id);
      if (error) throw error;

      setList((prev) => prev.map((s) =>
        s.id === id ? { ...s, ...payloadDB } as Sewa : s
      ));
      setEditId(null);
      setSuksesEdit(`✅ ${edit.nama_barang} berhasil diperbarui!`);
      setTimeout(() => setSuksesEdit(""), 3000);
    } catch (err: any) {
      alert(`Gagal: ${err.message}`);
    }
  }

  // ── Hapus ──
  async function handleHapus(id: string, nama: string) {
    if (!confirm(`Hapus sewa ${nama}?`)) return;
    setMenghapus(id);
    try {
      const { error } = await supabase.from("sewa").delete().eq("id", id);
      if (error) throw error;
      setList((prev) => prev.filter((s) => s.id !== id));
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
      <section className="card bg-yellow-50 border-yellow-200">
        <div className="flex items-center gap-3">
          <span className="text-4xl">🪑</span>
          <div>
            <h2 className="text-xl font-bold text-yellow-800">Catatan Sewa</h2>
            <p className="text-gray-500 text-sm">{acara.nama_acara}</p>
          </div>
        </div>
      </section>

      {/* Statistik */}
      <div className="grid grid-cols-2 gap-3">
        <KartuStatistik label="Total Harga" nilai={formatRupiah(totalHarga)} ikon="💰" kecil />
        <KartuStatistik label="Sisa Bayar" nilai={formatRupiah(sisaBayar)} ikon="🔴" kecil />
        <KartuStatistik label="Total DP" nilai={formatRupiah(totalDp)} ikon="🟡" kecil />
        <KartuStatistik label="Sudah Lunas" nilai={`${totalLunas} item`} ikon="🟢" />
      </div>

      {/* Form tambah */}
      <section className="card">
        <h3 className="text-xl font-bold text-batik-700 mb-4">✍️ Tambah Sewa</h3>
        <form onSubmit={handleSubmit} className="space-y-3">

          {/* Nama barang + suggestion */}
          <div className="relative">
            <label className="block text-base font-semibold text-gray-700 mb-1">
              Nama Barang <span className="text-red-500">*</span>
            </label>
            <input name="nama_barang" required
              onChange={(e) => cariBarang(e.target.value)}
              onBlur={() => setTimeout(() => setSuggestionBarang([]), 150)}
              placeholder="Contoh: Tenda, Pelaminan, Orgen..."
              className="input-field" autoComplete="off" />
            {suggestionBarang.length > 0 && (
              <ul className="absolute z-10 left-0 right-0 bg-white border-2 border-batik-300
                rounded-xl shadow-xl mt-1 overflow-hidden">
                {suggestionBarang.map((b) => (
                  <li key={b}
                    onMouseDown={(e) => {
                      const input = e.currentTarget.closest("form")
                        ?.querySelector("[name=nama_barang]") as HTMLInputElement;
                      if (input) input.value = b;
                      setSuggestionBarang([]);
                    }}
                    className="px-4 py-3 text-base text-gray-700 hover:bg-batik-50
                      cursor-pointer border-b border-gray-100 last:border-0">
                    {b}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Vendor */}
          <div>
            <label className="block text-base font-semibold text-gray-700 mb-1">
              Vendor <span className="text-gray-400 text-sm font-normal">(opsional)</span>
            </label>
            <input name="vendor" placeholder="Contoh: Tenda Pak Haji Ahmad"
              className="input-field" />
          </div>

          {/* Jumlah & Satuan */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-base font-semibold text-gray-700 mb-1">Jumlah</label>
              <input name="jumlah" type="number" min="1" defaultValue="1"
                className="input-field" inputMode="numeric" />
            </div>
            <div className="flex-1">
              <label className="block text-base font-semibold text-gray-700 mb-1">Satuan</label>
              <select name="satuan" className="input-field bg-white">
                {SATUAN_LIST.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Harga */}
          <div>
            <label className="block text-base font-semibold text-gray-700 mb-1">
              Harga Total (Rp)
            </label>
            <input value={nilaiHarga}
              onChange={(e) => setNilaiHarga(formatUang(e.target.value))}
              placeholder="Contoh: 500.000"
              className="input-field" inputMode="numeric" autoComplete="off" />
            {nilaiHarga !== "" && (
              <p className="text-sm text-batik-600 font-semibold mt-1">
                = {formatRupiah(uangKeAngka(nilaiHarga))}
              </p>
            )}
          </div>

          {/* DP & Lunas dalam 1 baris */}
          <div className="bg-gray-50 rounded-xl p-3 space-y-3 border border-gray-200">
            <p className="text-sm font-bold text-gray-600">💳 Pembayaran</p>

            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">
                DP <span className="text-gray-400 font-normal">(opsional)</span>
              </label>
              <input value={nilaiDp}
                onChange={(e) => setNilaiDp(formatUang(e.target.value))}
                placeholder="Kosongkan jika belum bayar DP"
                className="input-field" inputMode="numeric" autoComplete="off" />
              {nilaiDp !== "" && (
                <p className="text-sm text-yellow-600 font-semibold mt-1">
                  = {formatRupiah(uangKeAngka(nilaiDp))}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">
                Pelunasan <span className="text-gray-400 font-normal">(opsional)</span>
              </label>
              <input value={nilaiLunas}
                onChange={(e) => setNilaiLunas(formatUang(e.target.value))}
                placeholder="Kosongkan jika belum lunas"
                className="input-field" inputMode="numeric" autoComplete="off" />
              {nilaiLunas !== "" && (
                <p className="text-sm text-green-600 font-semibold mt-1">
                  = {formatRupiah(uangKeAngka(nilaiLunas))}
                </p>
              )}
            </div>

            {/* Preview status otomatis */}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-sm text-gray-500">Status otomatis:</span>
              <span className={`text-xs font-bold px-3 py-1 rounded-full border-2
                ${hitungStatus(uangKeAngka(nilaiDp), uangKeAngka(nilaiLunas)) === "lunas"
                  ? STATUS_LABEL.lunas.warna
                  : hitungStatus(uangKeAngka(nilaiDp), uangKeAngka(nilaiLunas)) === "dp_dibayar"
                  ? STATUS_LABEL.dp_dibayar.warna
                  : STATUS_LABEL.belum_lunas.warna
                }`}>
                {STATUS_LABEL[hitungStatus(uangKeAngka(nilaiDp), uangKeAngka(nilaiLunas))].icon}{" "}
                {STATUS_LABEL[hitungStatus(uangKeAngka(nilaiDp), uangKeAngka(nilaiLunas))].label}
              </span>
            </div>
          </div>

          {/* Tanggal ambil & kembali */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-base font-semibold text-gray-700 mb-1">
                Tgl Ambil
              </label>
              <input name="tanggal_ambil" type="date" className="input-field" />
            </div>
            <div className="flex-1">
              <label className="block text-base font-semibold text-gray-700 mb-1">
                Tgl Kembali
              </label>
              <input name="tanggal_kembali" type="date" className="input-field" />
            </div>
          </div>

          {/* Catatan */}
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
            {loading ? "Menyimpan..." : "➕ Tambah Sewa"}
          </button>
        </form>
      </section>

      {/* Daftar sewa */}
      <section>
        <h3 className="text-xl font-bold text-batik-700 mb-3 flex items-center gap-2">
          <span>📋</span> Daftar Sewa
          <span className="ml-auto text-base font-normal text-gray-500">
            {list.length} item
          </span>
        </h3>

        {list.length === 0 ? (
          <div className="card text-center py-10 text-gray-400">
            <p className="text-4xl mb-2">🪑</p>
            <p className="text-lg">Belum ada catatan sewa.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {list.map((s) => (
              <div key={s.id} className="card">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-full bg-yellow-100 text-yellow-700 font-bold
                    flex items-center justify-center text-2xl flex-shrink-0">
                    🪑
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-800 text-lg leading-tight">
                      {s.nama_barang}
                      <span className="text-gray-400 text-sm font-normal ml-2">
                        {s.jumlah} {s.satuan}
                      </span>
                    </p>
                    {s.vendor && <p className="text-gray-500 text-sm">🏪 {s.vendor}</p>}
                    {s.harga > 0 && (
                      <p className="text-gray-700 text-sm mt-1">
                        💰 {formatRupiah(s.harga)}
                        {s.dp > 0 && (
                          <span className="text-yellow-600 ml-2">
                            · DP {formatRupiah(s.dp)}
                          </span>
                        )}
                      </p>
                    )}
                    {(s.tanggal_ambil || s.tanggal_kembali) && (
                      <p className="text-gray-400 text-sm">
                        📅 {s.tanggal_ambil ?? "-"} → {s.tanggal_kembali ?? "-"}
                      </p>
                    )}
                    {s.catatan && (
                      <p className="text-gray-400 text-sm italic">"{s.catatan}"</p>
                    )}

                    {/* Ganti tombol status dengan badge saja */}
                    <div className="mt-2">
                      <span className={`text-xs font-bold px-3 py-1 rounded-full border-2
                        ${STATUS_LABEL[s.status].warna}`}>
                        {STATUS_LABEL[s.status].icon} {STATUS_LABEL[s.status].label}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 flex-shrink-0">
                    <button onClick={() => editId === s.id ? setEditId(null) : bukaEdit(s)}
                      className="text-batik-400 hover:text-batik-600 hover:bg-batik-50 p-2 rounded-lg transition-colors text-lg">
                      {editId === s.id ? "✖️" : "✏️"}
                    </button>
                    <button onClick={() => handleHapus(s.id, s.nama_barang)}
                      disabled={menghapus === s.id}
                      className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors text-lg">
                      {menghapus === s.id ? "..." : "🗑️"}
                    </button>
                  </div>
                </div>

                {/* Panel edit */}
                {editId === s.id && (
                  <div className="mt-4 pt-4 border-t border-yellow-100 space-y-3">
                    <p className="text-sm font-bold text-yellow-700">✏️ Edit Sewa</p>

                    <div>
                      <label className="block text-sm font-semibold text-gray-600 mb-1">Nama Barang</label>
                      <input value={edit.nama_barang}
                        onChange={(e) => setEdit((p) => ({ ...p, nama_barang: e.target.value }))}
                        className="input-field" />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-600 mb-1">Vendor</label>
                      <input value={edit.vendor}
                        onChange={(e) => setEdit((p) => ({ ...p, vendor: e.target.value }))}
                        className="input-field" />
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
                          {SATUAN_LIST.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-600 mb-1">Harga Total (Rp)</label>
                      <input value={edit.nilaiHarga}
                        onChange={(e) => setEdit((p) => ({ ...p, nilaiHarga: formatUang(e.target.value) }))}
                        className="input-field" inputMode="numeric" />
                      {edit.nilaiHarga !== "" && (
                        <p className="text-sm text-batik-600 font-semibold mt-1">
                          = {formatRupiah(uangKeAngka(edit.nilaiHarga))}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-600 mb-1">DP</label>
                      <input value={edit.nilaiDp}
                        onChange={(e) => setEdit((p) => ({ ...p, nilaiDp: formatUang(e.target.value) }))}
                        className="input-field" inputMode="numeric" />
                      {edit.nilaiDp !== "" && (
                        <p className="text-sm text-batik-600 font-semibold mt-1">
                          = {formatRupiah(uangKeAngka(edit.nilaiDp))}
                        </p>
                      )}
                    </div>

                    {/* Ganti field status di panel edit dengan ini: */}
                    <div className="bg-gray-50 rounded-xl p-3 space-y-3 border border-gray-200">
                      <p className="text-sm font-bold text-gray-600">💳 Pembayaran</p>
                      <div>
                        <label className="block text-sm font-semibold text-gray-600 mb-1">DP</label>
                        <input value={edit.nilaiDp}
                          onChange={(e) => setEdit((p) => ({ ...p, nilaiDp: formatUang(e.target.value) }))}
                          className="input-field" inputMode="numeric" />
                        {edit.nilaiDp !== "" && (
                          <p className="text-sm text-yellow-600 font-semibold mt-1">
                            = {formatRupiah(uangKeAngka(edit.nilaiDp))}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-600 mb-1">Pelunasan</label>
                        <input value={edit.nilaiLunas}
                          onChange={(e) => setEdit((p) => ({ ...p, nilaiLunas: formatUang(e.target.value) }))}
                          className="input-field" inputMode="numeric" />
                        {edit.nilaiLunas !== "" && (
                          <p className="text-sm text-green-600 font-semibold mt-1">
                            = {formatRupiah(uangKeAngka(edit.nilaiLunas))}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <span className="text-sm text-gray-500">Status otomatis:</span>
                        <span className={`text-xs font-bold px-3 py-1 rounded-full border-2
                          ${STATUS_LABEL[hitungStatus(uangKeAngka(edit.nilaiDp), uangKeAngka(edit.nilaiLunas))].warna}`}>
                          {STATUS_LABEL[hitungStatus(uangKeAngka(edit.nilaiDp), uangKeAngka(edit.nilaiLunas))].icon}{" "}
                          {STATUS_LABEL[hitungStatus(uangKeAngka(edit.nilaiDp), uangKeAngka(edit.nilaiLunas))].label}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label className="block text-sm font-semibold text-gray-600 mb-1">Tgl Ambil</label>
                        <input type="date" value={edit.tanggal_ambil}
                          onChange={(e) => setEdit((p) => ({ ...p, tanggal_ambil: e.target.value }))}
                          className="input-field" />
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-semibold text-gray-600 mb-1">Tgl Kembali</label>
                        <input type="date" value={edit.tanggal_kembali}
                          onChange={(e) => setEdit((p) => ({ ...p, tanggal_kembali: e.target.value }))}
                          className="input-field" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-600 mb-1">Catatan</label>
                      <input value={edit.catatan}
                        onChange={(e) => setEdit((p) => ({ ...p, catatan: e.target.value }))}
                        placeholder="Catatan tambahan..." className="input-field" />
                    </div>

                    <div className="flex gap-2">
                      <button onClick={() => handleSimpanEdit(s.id)}
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