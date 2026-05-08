"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import KartuStatistik from "@/components/ui/KartuStatistik";
import type { Acara } from "@/types";

interface SimpanPinjam {
  id: string;
  acara_id: string;
  nama_peminjam: string;
  alamat?: string;
  jenis_barang: string;
  jumlah: number;
  satuan: string;
  status: "belum_kembali" | "sebagian" | "lunas";
  catatan?: string;
  created_at: string;
}

interface StateEdit {
  nama_peminjam: string;
  alamat: string;
  jenis_barang: string;
  jumlah: string;
  satuan: string;
  status: SimpanPinjam["status"];
  catatan: string;
}

interface Props {
  acara: Acara;
  dataAwal: SimpanPinjam[];
}

const BARANG_LIST = [
  "Beras", "Minyak Goreng", "Gula Pasir", "Tepung Terigu",
  "Telur", "Garam", "Kecap", "Santan", "Bawang Merah",
  "Bawang Putih", "Cabai", "Kentang", "Wortel",
];

const SATUAN_LIST = ["kg", "liter", "gram", "buah", "dus", "karung", "bungkus"];

const STATUS_LABEL: Record<string, { label: string; warna: string; icon: string }> = {
  belum_kembali: { label: "Belum Kembali", warna: "bg-red-100 text-red-700 border-red-300",       icon: "🔴" },
  sebagian:      { label: "Sebagian",       warna: "bg-yellow-100 text-yellow-700 border-yellow-300", icon: "🟡" },
  lunas:         { label: "Sudah Kembali",  warna: "bg-green-100 text-green-700 border-green-300",  icon: "🟢" },
};

const DESA_TUAH_NEGERI = [
  "Air Beliti", "Bamasco", "Banpres", "Darma Sakti",
  "Jaya Bhakti", "Jaya Tunggal", "Leban Jaya", "Lubuk Rumbai",
  "Petunang", "Remayu", "Sukamulya",
];

export default function SimpanPinjamClient({ acara, dataAwal }: Props) {
  const [list, setList] = useState<SimpanPinjam[]>(dataAwal);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sukses, setSukses] = useState("");
  const [suksesEdit, setSuksesEdit] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [menghapus, setMenghapus] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<"semua" | SimpanPinjam["status"]>("semua");
  const [edit, setEdit] = useState<StateEdit>({
    nama_peminjam: "", alamat: "", jenis_barang: "",
    jumlah: "", satuan: "kg", status: "belum_kembali", catatan: "",
  });

  // Autocomplete
  const [nilaiAlamat, setNilaiAlamat] = useState("");
  const [suggestionDesa, setSuggestionDesa] = useState<string[]>([]);
  const [suggestionBarang, setSuggestionBarang] = useState<string[]>([]);
  const [nilaiBarang, setNilaiBarang] = useState("");
  const [suggestionDesaEdit, setSuggestionDesaEdit] = useState<string[]>([]);

  // ── Statistik ──
  const totalPinjam    = list.length;
  const totalKembali   = list.filter((s) => s.status === "lunas").length;
  const belumKembali   = list.filter((s) => s.status === "belum_kembali").length;

  // ── Filter ──
  const listTerfilter = filterStatus === "semua"
    ? list
    : list.filter((s) => s.status === filterStatus);

  // ── Helpers autocomplete ──
  function filterDesa(teks: string): string[] {
    if (teks.trim() === "") return [];
    const kata = teks.toLowerCase().split(/[\s,]+/).filter(Boolean);
    return DESA_TUAH_NEGERI.filter((d) =>
      kata.some((k) => d.toLowerCase().includes(k))
    );
  }

  function terapkanPilihDesa(nilaiSaat: string, desa: string): string {
    const kataKotor = nilaiSaat
      .split(/[\s,]+/)
      .filter((k) => !desa.toLowerCase().includes(k.toLowerCase()) && k.trim() !== "");
    const prefix = kataKotor.join(" ").trim();
    return prefix ? `${prefix}, ${desa}` : desa;
  }

  function filterBarang(teks: string): string[] {
    if (teks.trim() === "") return [];
    return BARANG_LIST.filter((b) =>
      b.toLowerCase().includes(teks.toLowerCase())
    );
  }

  // ── Tambah ──
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(""); setSukses(""); setLoading(true);

    const formEl = e.currentTarget;
    const data = new FormData(formEl);
    const namaPeminjam = (data.get("nama_peminjam") as string).trim();

    const payload = {
      acara_id:      acara.id,
      nama_peminjam: namaPeminjam,
      alamat:        nilaiAlamat.trim() || null,
      jenis_barang:  nilaiBarang.trim(),
      jumlah:        parseFloat(data.get("jumlah") as string) || 0,
      satuan:        data.get("satuan") as string,
      status:        "belum_kembali" as const,
      catatan:       (data.get("catatan") as string).trim() || null,
    };

    if (!payload.jenis_barang) {
      setError("Jenis barang tidak boleh kosong.");
      setLoading(false);
      return;
    }

    try {
      const { data: baru, error: sbError } = await supabase
        .from("simpan_pinjam").insert(payload).select().single();
      if (sbError) throw sbError;

      setList([baru, ...list]);
      formEl.reset();
      setNilaiAlamat("");
      setNilaiBarang("");
      setSuggestionDesa([]);
      setSuggestionBarang([]);
      setSukses(`✅ ${namaPeminjam} berhasil dicatat!`);
      setTimeout(() => setSukses(""), 2000);
    } catch (err: any) {
      setError(`Gagal: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  // ── Update status langsung ──
  async function handleStatusChange(id: string, status: SimpanPinjam["status"]) {
    try {
      const { error } = await supabase
        .from("simpan_pinjam").update({ status }).eq("id", id);
      if (error) throw error;
      setList((prev) => prev.map((s) => s.id === id ? { ...s, status } : s));
    } catch (err: any) {
      alert(`Gagal: ${err.message}`);
    }
  }

  // ── Buka edit ──
  function bukaEdit(s: SimpanPinjam) {
    setEditId(s.id);
    setEdit({
      nama_peminjam: s.nama_peminjam,
      alamat:        s.alamat ?? "",
      jenis_barang:  s.jenis_barang,
      jumlah:        s.jumlah.toString(),
      satuan:        s.satuan,
      status:        s.status,
      catatan:       s.catatan ?? "",
    });
    setSuggestionDesaEdit([]);
  }

  // ── Simpan edit ──
  async function handleSimpanEdit(id: string) {
    if (!edit.nama_peminjam.trim()) { alert("Nama tidak boleh kosong."); return; }
    if (!edit.jenis_barang.trim()) { alert("Jenis barang tidak boleh kosong."); return; }
    try {
      const payloadDB = {
        nama_peminjam: edit.nama_peminjam.trim(),
        alamat:        edit.alamat.trim() || null,
        jenis_barang:  edit.jenis_barang.trim(),
        jumlah:        parseFloat(edit.jumlah) || 0,
        satuan:        edit.satuan,
        status:        edit.status,
        catatan:       edit.catatan.trim() || null,
      };

      const payloadLokal: Partial<SimpanPinjam> = {
        ...payloadDB,
        alamat:  edit.alamat.trim() || undefined,
        catatan: edit.catatan.trim() || undefined,
      };

      const { error } = await supabase
        .from("simpan_pinjam").update(payloadDB).eq("id", id);
      if (error) throw error;

      setList((prev) => prev.map((s) =>
        s.id === id ? { ...s, ...payloadLokal } : s
      ));
      setEditId(null);
      setSuksesEdit(`✅ Data ${edit.nama_peminjam} berhasil diperbarui!`);
      setTimeout(() => setSuksesEdit(""), 3000);
    } catch (err: any) {
      alert(`Gagal: ${err.message}`);
    }
  }

  // ── Hapus ──
  async function handleHapus(id: string, nama: string) {
    if (!confirm(`Hapus catatan pinjam ${nama}?`)) return;
    setMenghapus(id);
    try {
      const { error } = await supabase
        .from("simpan_pinjam").delete().eq("id", id);
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
      <section className="card bg-green-50 border-green-200">
        <div className="flex items-center gap-3">
          <span className="text-4xl">🤝</span>
          <div>
            <h2 className="text-xl font-bold text-green-800">Simpan Pinjam</h2>
            <p className="text-gray-500 text-sm">{acara.nama_acara}</p>
          </div>
        </div>
      </section>

      {/* Statistik */}
      <div className="grid grid-cols-3 gap-3">
        <KartuStatistik label="Total Pinjam"   nilai={totalPinjam.toString()}  ikon="🤝" />
        <KartuStatistik label="Belum Kembali"  nilai={belumKembali.toString()} ikon="🔴" />
        <KartuStatistik label="Sudah Kembali"  nilai={totalKembali.toString()} ikon="🟢" />
      </div>

      {/* Form tambah */}
      <section className="card">
        <h3 className="text-xl font-bold text-batik-700 mb-4">✍️ Catat Pinjaman</h3>
        <form onSubmit={handleSubmit} className="space-y-3">

          {/* Nama peminjam */}
          <div>
            <label className="block text-base font-semibold text-gray-700 mb-1">
              Nama Peminjam <span className="text-red-500">*</span>
            </label>
            <input name="nama_peminjam" required
              placeholder="Contoh: Ibu Sari"
              className="input-field" autoComplete="off" />
          </div>

          {/* Alamat + autocomplete desa */}
          <div className="relative">
            <label className="block text-base font-semibold text-gray-700 mb-1">
              Alamat <span className="text-gray-400 text-sm font-normal">(opsional)</span>
            </label>
            <input value={nilaiAlamat}
              onChange={(e) => { setNilaiAlamat(e.target.value); setSuggestionDesa(filterDesa(e.target.value)); }}
              onBlur={() => setTimeout(() => setSuggestionDesa([]), 150)}
              placeholder="Contoh: Kp3, Jaya Bhakti"
              autoComplete="off" className="input-field" />
            {suggestionDesa.length > 0 && (
              <ul className="absolute z-10 left-0 right-0 bg-white border-2 border-batik-300
                rounded-xl shadow-xl mt-1 overflow-hidden">
                {suggestionDesa.map((d) => (
                  <li key={d}
                    onMouseDown={() => { setNilaiAlamat(terapkanPilihDesa(nilaiAlamat, d)); setSuggestionDesa([]); }}
                    onTouchStart={() => { setNilaiAlamat(terapkanPilihDesa(nilaiAlamat, d)); setSuggestionDesa([]); }}
                    className="px-4 py-3 text-base text-gray-700 hover:bg-batik-50
                      active:bg-batik-100 cursor-pointer border-b border-gray-100
                      last:border-0 flex items-center gap-2">
                    <span className="text-batik-400">📍</span> {d}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Jenis barang + autocomplete */}
          <div className="relative">
            <label className="block text-base font-semibold text-gray-700 mb-1">
              Jenis Barang <span className="text-red-500">*</span>
            </label>
            <input value={nilaiBarang}
              onChange={(e) => { setNilaiBarang(e.target.value); setSuggestionBarang(filterBarang(e.target.value)); }}
              onBlur={() => setTimeout(() => setSuggestionBarang([]), 150)}
              placeholder="Contoh: Beras, Minyak, Gula..."
              autoComplete="off" className="input-field" />
            {suggestionBarang.length > 0 && (
              <ul className="absolute z-10 left-0 right-0 bg-white border-2 border-batik-300
                rounded-xl shadow-xl mt-1 overflow-hidden">
                {suggestionBarang.map((b) => (
                  <li key={b}
                    onMouseDown={() => { setNilaiBarang(b); setSuggestionBarang([]); }}
                    onTouchStart={() => { setNilaiBarang(b); setSuggestionBarang([]); }}
                    className="px-4 py-3 text-base text-gray-700 hover:bg-batik-50
                      active:bg-batik-100 cursor-pointer border-b border-gray-100
                      last:border-0">
                    🛒 {b}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Jumlah & Satuan */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-base font-semibold text-gray-700 mb-1">Jumlah</label>
              <input name="jumlah" type="number" min="0" step="0.5" defaultValue="1"
                className="input-field" inputMode="decimal" />
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

          {/* Catatan */}
          <div>
            <label className="block text-base font-semibold text-gray-700 mb-1">
              Catatan <span className="text-gray-400 text-sm font-normal">(opsional)</span>
            </label>
            <input name="catatan" placeholder="Contoh: Dikembalikan setelah acara selesai"
              className="input-field" />
          </div>

          {sukses && (
            <div className="bg-green-50 border-2 border-green-400 rounded-xl p-3
              text-green-700 font-semibold text-center">{sukses}</div>
          )}
          {error && <p className="text-red-500 text-sm">⚠️ {error}</p>}

          <button type="submit" disabled={loading} className="btn-primary w-full text-xl py-5">
            {loading ? "Menyimpan..." : "➕ Catat Pinjaman"}
          </button>
        </form>
      </section>

      {/* Filter status */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {([
          { id: "semua",         label: `Semua (${list.length})` },
          { id: "belum_kembali", label: `🔴 Belum (${list.filter((s) => s.status === "belum_kembali").length})` },
          { id: "sebagian",      label: `🟡 Sebagian (${list.filter((s) => s.status === "sebagian").length})` },
          { id: "lunas",         label: `🟢 Kembali (${list.filter((s) => s.status === "lunas").length})` },
        ] as const).map((f) => (
          <button key={f.id}
            onClick={() => setFilterStatus(f.id)}
            className={`flex-shrink-0 text-sm font-bold px-4 py-2 rounded-full border-2 transition-all
              ${filterStatus === f.id
                ? "bg-batik-600 text-white border-batik-600"
                : "bg-white text-gray-500 border-gray-200"}`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Daftar */}
      <section>
        <h3 className="text-xl font-bold text-batik-700 mb-3 flex items-center gap-2">
          <span>📋</span> Daftar Pinjaman
          <span className="ml-auto text-base font-normal text-gray-500">
            {listTerfilter.length} data
          </span>
        </h3>

        {listTerfilter.length === 0 ? (
          <div className="card text-center py-10 text-gray-400">
            <p className="text-4xl mb-2">🤝</p>
            <p className="text-lg">Belum ada catatan pinjaman.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {listTerfilter.map((s) => (
              <div key={s.id} className="card">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-full bg-green-100 text-green-700 font-bold
                    flex items-center justify-center text-lg flex-shrink-0">
                    {s.nama_peminjam.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-800 text-lg leading-tight">
                      {s.nama_peminjam}
                    </p>
                    {s.alamat && <p className="text-gray-500 text-sm">📍 {s.alamat}</p>}
                    <p className="text-gray-700 text-sm mt-1">
                      🛒 {s.jenis_barang} —{" "}
                      <span className="font-semibold">{s.jumlah} {s.satuan}</span>
                    </p>
                    {s.catatan && (
                      <p className="text-gray-400 text-sm italic">"{s.catatan}"</p>
                    )}
                    <p className="text-gray-300 text-xs mt-1">
                      {new Date(s.created_at).toLocaleString("id-ID", {
                        day: "numeric", month: "short",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </p>

                    {/* Tombol status */}
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {(["belum_kembali", "sebagian", "lunas"] as const).map((st) => (
                        <button key={st}
                          onClick={() => handleStatusChange(s.id, st)}
                          className={`text-xs font-bold px-3 py-1 rounded-full border-2 transition-all
                            ${s.status === st
                              ? STATUS_LABEL[st].warna + " scale-105"
                              : "bg-white text-gray-400 border-gray-200 hover:border-gray-300"
                            }`}>
                          {STATUS_LABEL[st].icon} {STATUS_LABEL[st].label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 flex-shrink-0">
                    <button onClick={() => editId === s.id ? setEditId(null) : bukaEdit(s)}
                      className="text-batik-400 hover:text-batik-600 hover:bg-batik-50
                        p-2 rounded-lg transition-colors text-lg">
                      {editId === s.id ? "✖️" : "✏️"}
                    </button>
                    <button onClick={() => handleHapus(s.id, s.nama_peminjam)}
                      disabled={menghapus === s.id}
                      className="text-red-400 hover:text-red-600 hover:bg-red-50
                        p-2 rounded-lg transition-colors text-lg">
                      {menghapus === s.id ? "..." : "🗑️"}
                    </button>
                  </div>
                </div>

                {/* Panel edit */}
                {editId === s.id && (
                  <div className="mt-4 pt-4 border-t border-green-100 space-y-3">
                    <p className="text-sm font-bold text-green-700">✏️ Edit Pinjaman</p>

                    <div>
                      <label className="block text-sm font-semibold text-gray-600 mb-1">
                        Nama Peminjam
                      </label>
                      <input value={edit.nama_peminjam}
                        onChange={(e) => setEdit((p) => ({ ...p, nama_peminjam: e.target.value }))}
                        className="input-field" autoComplete="off" />
                    </div>

                    {/* Alamat edit + autocomplete */}
                    <div className="relative">
                      <label className="block text-sm font-semibold text-gray-600 mb-1">Alamat</label>
                      <input value={edit.alamat}
                        onChange={(e) => {
                          setEdit((p) => ({ ...p, alamat: e.target.value }));
                          setSuggestionDesaEdit(filterDesa(e.target.value));
                        }}
                        onBlur={() => setTimeout(() => setSuggestionDesaEdit([]), 150)}
                        placeholder="Contoh: Kp3, Jaya Bhakti"
                        autoComplete="off" className="input-field" />
                      {suggestionDesaEdit.length > 0 && (
                        <ul className="absolute z-10 left-0 right-0 bg-white border-2
                          border-batik-300 rounded-xl shadow-xl mt-1 overflow-hidden">
                          {suggestionDesaEdit.map((d) => (
                            <li key={d}
                              onMouseDown={() => { setEdit((p) => ({ ...p, alamat: terapkanPilihDesa(p.alamat, d) })); setSuggestionDesaEdit([]); }}
                              onTouchStart={() => { setEdit((p) => ({ ...p, alamat: terapkanPilihDesa(p.alamat, d) })); setSuggestionDesaEdit([]); }}
                              className="px-4 py-3 text-base text-gray-700 hover:bg-batik-50
                                active:bg-batik-100 cursor-pointer border-b border-gray-100
                                last:border-0 flex items-center gap-2">
                              <span className="text-batik-400">📍</span> {d}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-600 mb-1">
                        Jenis Barang
                      </label>
                      <input value={edit.jenis_barang}
                        onChange={(e) => setEdit((p) => ({ ...p, jenis_barang: e.target.value }))}
                        className="input-field" autoComplete="off" />
                    </div>

                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label className="block text-sm font-semibold text-gray-600 mb-1">Jumlah</label>
                        <input type="number" min="0" step="0.5" value={edit.jumlah}
                          onChange={(e) => setEdit((p) => ({ ...p, jumlah: e.target.value }))}
                          className="input-field" inputMode="decimal" />
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-semibold text-gray-600 mb-1">Satuan</label>
                        <select value={edit.satuan}
                          onChange={(e) => setEdit((p) => ({ ...p, satuan: e.target.value }))}
                          className="input-field bg-white">
                          {SATUAN_LIST.map((st) => (
                            <option key={st} value={st}>{st}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-600 mb-1">Status</label>
                      <div className="flex gap-2 flex-wrap">
                        {(["belum_kembali", "sebagian", "lunas"] as const).map((st) => (
                          <button key={st} type="button"
                            onClick={() => setEdit((p) => ({ ...p, status: st }))}
                            className={`text-xs font-bold px-3 py-2 rounded-full border-2 transition-all
                              ${edit.status === st
                                ? STATUS_LABEL[st].warna + " scale-105"
                                : "bg-white text-gray-400 border-gray-200"
                              }`}>
                            {STATUS_LABEL[st].icon} {STATUS_LABEL[st].label}
                          </button>
                        ))}
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