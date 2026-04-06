"use client";

import { useState } from "react";
import Link from "next/link";
import { formatRupiah, formatTanggal, JENIS_ACARA_LABEL } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import KartuStatistik from "@/components/ui/KartuStatistik";
import TombolExport from "@/components/ui/TombolExport";
import type { Acara, Sumbangan, StatistikAcara, SumbanganFormData } from "@/types";

const DESA_TUAH_NEGERI = [
  "Air Beliti", "Bamasco", "Banpres", "Darma Sakti",
  "Jaya Bhakti", "Jaya Tunggal", "Leban Jaya", "Lubuk Rumbai",
  "Petunang", "Remayu", "Sukamulya",
];

interface Props {
  acara: Acara;
  sumbanganAwal: Sumbangan[];
  statistikAwal: StatistikAcara;
}

interface StateEdit {
  nama_tamu: string;
  alamat: string;
  nilaiUang: string;
  catatan: string;
}

export default function DetailAcaraClient({ acara, sumbanganAwal, statistikAwal }: Props) {
  const [daftarSumbangan, setDaftarSumbangan] = useState<Sumbangan[]>(sumbanganAwal);
  const [statistik, setStatistik] = useState<StatistikAcara>(statistikAwal);

  // State form tambah
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sukses, setSukses] = useState("");
  const [nilaiAlamat, setNilaiAlamat] = useState("");
  const [nilaiUang, setNilaiUang] = useState("");
  const [suggestionDesa, setSuggestionDesa] = useState<string[]>([]);

  // State form edit
  const [editId, setEditId] = useState<string | null>(null);
  const [edit, setEdit] = useState<StateEdit>({ nama_tamu: "", alamat: "", nilaiUang: "", catatan: "" });
  const [suggestionDesaEdit, setSuggestionDesaEdit] = useState<string[]>([]);
  const [loadingEdit, setLoadingEdit] = useState(false);

  // State hapus
  const [menghapus, setMenghapus] = useState<string | null>(null);

  // ─── Helpers ────────────────────────────────────────────────

  function hitungStatistik(list: Sumbangan[]): StatistikAcara {
    return {
      total_tamu: list.length,
      total_uang: list.reduce((sum, s) => sum + (s.jumlah_uang ?? 0), 0),
      total_dengan_barang: list.filter((s) => s.barang && s.barang.trim() !== "").length,
    };
  }

  function filterDesa(teks: string): string[] {
    if (teks.trim() === "") return [];
    const kata = teks.toLowerCase().split(/[\s,]+/).filter(Boolean);
    return DESA_TUAH_NEGERI.filter((desa) =>
      kata.some((k) => desa.toLowerCase().includes(k))
    );
  }

  function terapkanPilihDesa(nilaiSaat: string, desa: string): string {
    const kataKotor = nilaiSaat
      .split(/[\s,]+/)
      .filter((k) => !desa.toLowerCase().includes(k.toLowerCase()) && k.trim() !== "");
    const prefix = kataKotor.join(" ").trim();
    return prefix ? `${prefix}, ${desa}` : desa;
  }

  function formatUang(raw: string): string {
    const angka = raw.replace(/\D/g, "");
    if (angka === "") return "";
    return parseInt(angka).toLocaleString("id-ID");
  }

  function uangKeRupiah(formatted: string): number {
    return (parseInt(formatted.replace(/\./g, "")) || 0) * 1000;
  }

  // ─── Submit tambah ───────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(""); setSukses(""); setLoading(true);

    const formEl = e.currentTarget;
    const namaTamu = (new FormData(formEl).get("nama_tamu") as string).trim();

    const formData: SumbanganFormData = {
      acara_id: acara.id,
      nama_tamu: namaTamu,
      alamat: nilaiAlamat.trim() || undefined,
      jumlah_uang: uangKeRupiah(nilaiUang),
    };

    try {
      const { data: baru, error: sbError } = await supabase
        .from("sumbangan").insert(formData).select().single();
      if (sbError) throw sbError;

      const listBaru = [baru, ...daftarSumbangan];
      setDaftarSumbangan(listBaru);
      setStatistik(hitungStatistik(listBaru));

      formEl.reset();
      setNilaiAlamat(""); setNilaiUang(""); setSuggestionDesa([]);
      setSukses(`✅ ${namaTamu} berhasil dicatat!`);
      setTimeout(() => setSukses(""), 2000);
    } catch (err: any) {
      setError(`Gagal menyimpan: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  // ─── Buka / tutup edit ───────────────────────────────────────

  function bukaEdit(s: Sumbangan) {
    const uangAsli = s.jumlah_uang > 0
      ? (s.jumlah_uang / 1000).toLocaleString("id-ID")
      : "";
    setEditId(s.id);
    setEdit({
      nama_tamu: s.nama_tamu,
      alamat: s.alamat ?? "",
      nilaiUang: uangAsli,
      catatan: s.catatan ?? "",
    });
    setSuggestionDesaEdit([]);
  }

  function tutupEdit() {
    setEditId(null);
    setSuggestionDesaEdit([]);
  }

  // ─── Simpan edit ─────────────────────────────────────────────

  async function handleSimpanEdit(id: string) {
    if (!edit.nama_tamu.trim()) { alert("Nama tamu tidak boleh kosong."); return; }
    setLoadingEdit(true);
    try {
      // Payload untuk Supabase — barang: null supaya terhapus di DB
      const payloadDB = {
        nama_tamu: edit.nama_tamu.trim(),
        alamat: edit.alamat.trim() || null,
        jumlah_uang: uangKeRupiah(edit.nilaiUang),
        catatan: edit.catatan.trim() || null,
        barang: null,
      };

      // Payload untuk state lokal — sesuai tipe Sumbangan
      const payloadLokal: Partial<Sumbangan> = {
        nama_tamu: edit.nama_tamu.trim(),
        alamat: edit.alamat.trim() || undefined,
        jumlah_uang: uangKeRupiah(edit.nilaiUang),
        catatan: edit.catatan.trim() || undefined,
        barang: undefined,
      };

      const { error } = await supabase.from("sumbangan").update(payloadDB).eq("id", id);
      if (error) throw error;

      const listBaru = daftarSumbangan.map((s) =>
        s.id === id ? { ...s, ...payloadLokal } : s
      );
      setDaftarSumbangan(listBaru);
      setStatistik(hitungStatistik(listBaru));

      tutupEdit();
    } catch (err: any) {
      alert(`Gagal menyimpan: ${err.message}`);
    } finally {
      setLoadingEdit(false);
    }
  }

  // ─── Hapus ───────────────────────────────────────────────────

  async function handleHapus(id: string, namaTamu: string) {
    if (!confirm(`Hapus catatan sumbangan dari ${namaTamu}?`)) return;
    setMenghapus(id);
    try {
      const { error } = await supabase.from("sumbangan").delete().eq("id", id);
      if (error) throw error;
      const listBaru = daftarSumbangan.filter((s) => s.id !== id);
      setDaftarSumbangan(listBaru);
      setStatistik(hitungStatistik(listBaru));
    } catch (err: any) {
      alert(`Gagal menghapus: ${err.message}`);
    } finally {
      setMenghapus(null);
    }
  }

  // ─── Render ──────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <Link href="/" className="inline-flex items-center gap-2 text-batik-600 font-semibold text-lg hover:underline">
        ‹ Kembali
      </Link>

      {/* Info acara */}
      <section className="card bg-batik-50 border-batik-200">
        <div className="flex items-start gap-3">
          <span className="text-4xl">{JENIS_ACARA_LABEL[acara.jenis_acara]?.split(" ")[0] ?? "🎉"}</span>
          <div>
            <h2 className="text-2xl font-bold text-batik-800">{acara.nama_acara}</h2>
            <p className="text-gray-600 font-medium">{acara.nama_tuan_rumah}</p>
            <p className="text-gray-500 text-sm mt-1">📅 {formatTanggal(acara.tanggal)}</p>
            <p className="text-gray-500 text-sm">📍 {acara.lokasi}</p>
            {acara.catatan && <p className="text-gray-400 text-sm mt-2 italic">"{acara.catatan}"</p>}
          </div>
        </div>
      </section>

      {/* Statistik */}
      <section>
        <h3 className="text-lg font-bold text-batik-700 mb-3">📊 Ringkasan</h3>
        <div className="grid grid-cols-3 gap-3">
          <KartuStatistik label="Total Tamu" nilai={statistik.total_tamu.toString()} ikon="👥" />
          <KartuStatistik label="Total Uang" nilai={formatRupiah(statistik.total_uang)} ikon="💰" kecil />
          <KartuStatistik label="Bawa Barang" nilai={statistik.total_dengan_barang.toString()} ikon="🎁" />
        </div>
      </section>

      {/* Form tambah */}
      <section className="card">
        <h3 className="text-xl font-bold text-batik-700 mb-4 flex items-center gap-2">
          <span>✍️</span> Catat Sumbangan Tamu
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-base font-semibold text-gray-700 mb-1">
              Nama Tamu <span className="text-red-500">*</span>
            </label>
            <input name="nama_tamu" required placeholder="Contoh: Ibu Romlah"
              className="input-field" autoComplete="off" />
          </div>

          <div className="relative">
            <label className="block text-base font-semibold text-gray-700 mb-1">
              Alamat <span className="text-gray-400 text-sm font-normal">(opsional)</span>
            </label>
            <input
              value={nilaiAlamat}
              onChange={(e) => { setNilaiAlamat(e.target.value); setSuggestionDesa(filterDesa(e.target.value)); }}
              onBlur={() => setTimeout(() => setSuggestionDesa([]), 150)}
              placeholder="Contoh: Kp3 Bandung, Jaya Bhakti"
              autoComplete="off" className="input-field"
            />
            {suggestionDesa.length > 0 && (
              <ul className="absolute z-10 left-0 right-0 bg-white border-2 border-batik-300 rounded-xl shadow-xl mt-1 overflow-hidden">
                {suggestionDesa.map((desa) => (
                  <li key={desa}
                    onMouseDown={() => { setNilaiAlamat(terapkanPilihDesa(nilaiAlamat, desa)); setSuggestionDesa([]); }}
                    onTouchStart={() => { setNilaiAlamat(terapkanPilihDesa(nilaiAlamat, desa)); setSuggestionDesa([]); }}
                    className="px-4 py-3 text-base text-gray-700 hover:bg-batik-50 active:bg-batik-100 cursor-pointer border-b border-gray-100 last:border-0 flex items-center gap-2">
                    <span className="text-batik-400">📍</span> {desa}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <label className="block text-base font-semibold text-gray-700 mb-1">
              Jumlah Uang <span className="text-gray-400 text-sm font-normal">(opsional)</span>
            </label>
            <div className="relative">
              <input value={nilaiUang} onChange={(e) => setNilaiUang(formatUang(e.target.value))}
                placeholder="Contoh: 25 → tersimpan 25.000"
                className="input-field pr-20" inputMode="numeric" autoComplete="off" />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">× 1.000</span>
            </div>
            {nilaiUang !== "" && (
              <p className="text-sm text-batik-600 font-semibold mt-1">
                = Rp {uangKeRupiah(nilaiUang).toLocaleString("id-ID")}
              </p>
            )}
          </div>

          {sukses && (
            <div className="bg-green-50 border-2 border-green-400 rounded-xl p-3 text-green-700 font-semibold text-center">{sukses}</div>
          )}
          {error && <p className="text-red-500 text-sm font-medium">⚠️ {error}</p>}

          <button type="submit" disabled={loading} className="btn-primary w-full text-xl py-5">
            {loading ? "Mencatat..." : "✍️ Catat Sumbangan"}
          </button>
        </form>
      </section>

      {/* Daftar tamu */}
      <section>
        <h3 className="text-xl font-bold text-batik-700 mb-3 flex items-center gap-2">
          <span>📝</span> Daftar Tamu
          <span className="ml-auto text-base font-normal text-gray-500">{daftarSumbangan.length} tamu</span>
        </h3>

        {daftarSumbangan.length === 0 ? (
          <div className="card text-center py-10 text-gray-400">
            <p className="text-4xl mb-2">📝</p>
            <p className="text-lg">Belum ada tamu yang dicatat.</p>
            <p className="text-sm mt-1">Gunakan form di atas untuk mencatat!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {daftarSumbangan.map((s) => (
              <div key={s.id} className="card">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-full bg-batik-100 text-batik-700 font-bold flex items-center justify-center text-lg flex-shrink-0">
                    {s.nama_tamu.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-800 text-lg leading-tight">{s.nama_tamu}</p>
                    {s.alamat && <p className="text-gray-500 text-sm">📍 {s.alamat}</p>}
                    {s.jumlah_uang > 0 && (
                      <p className="text-green-700 font-bold text-base mt-1">💰 {formatRupiah(s.jumlah_uang)}</p>
                    )}
                    {s.catatan && <p className="text-gray-400 text-sm italic mt-1">"{s.catatan}"</p>}
                    <p className="text-gray-300 text-xs mt-1">
                      {new Date(s.created_at).toLocaleString("id-ID", {
                        day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1 flex-shrink-0">
                    <button onClick={() => editId === s.id ? tutupEdit() : bukaEdit(s)}
                      className="text-batik-400 hover:text-batik-600 hover:bg-batik-50 p-2 rounded-lg transition-colors text-lg" title="Edit">
                      {editId === s.id ? "✖️" : "✏️"}
                    </button>
                    <button onClick={() => handleHapus(s.id, s.nama_tamu)} disabled={menghapus === s.id}
                      className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors text-lg" title="Hapus">
                      {menghapus === s.id ? "..." : "🗑️"}
                    </button>
                  </div>
                </div>

                {/* Panel edit inline */}
                {editId === s.id && (
                  <div className="mt-4 pt-4 border-t border-batik-100 space-y-3">
                    <p className="text-sm font-bold text-batik-700">✏️ Edit Data Tamu</p>

                    <div>
                      <label className="block text-sm font-semibold text-gray-600 mb-1">Nama Tamu</label>
                      <input value={edit.nama_tamu}
                        onChange={(e) => setEdit((p) => ({ ...p, nama_tamu: e.target.value }))}
                        className="input-field" autoComplete="off" />
                    </div>

                    <div className="relative">
                      <label className="block text-sm font-semibold text-gray-600 mb-1">Alamat</label>
                      <input value={edit.alamat}
                        onChange={(e) => {
                          setEdit((p) => ({ ...p, alamat: e.target.value }));
                          setSuggestionDesaEdit(filterDesa(e.target.value));
                        }}
                        onBlur={() => setTimeout(() => setSuggestionDesaEdit([]), 150)}
                        placeholder="Contoh: Kp3 Bandung, Jaya Bhakti"
                        autoComplete="off" className="input-field" />
                      {suggestionDesaEdit.length > 0 && (
                        <ul className="absolute z-10 left-0 right-0 bg-white border-2 border-batik-300 rounded-xl shadow-xl mt-1 overflow-hidden">
                          {suggestionDesaEdit.map((desa) => (
                            <li key={desa}
                              onMouseDown={() => { setEdit((p) => ({ ...p, alamat: terapkanPilihDesa(p.alamat, desa) })); setSuggestionDesaEdit([]); }}
                              onTouchStart={() => { setEdit((p) => ({ ...p, alamat: terapkanPilihDesa(p.alamat, desa) })); setSuggestionDesaEdit([]); }}
                              className="px-4 py-3 text-base text-gray-700 hover:bg-batik-50 active:bg-batik-100 cursor-pointer border-b border-gray-100 last:border-0 flex items-center gap-2">
                              <span className="text-batik-400">📍</span> {desa}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-600 mb-1">Jumlah Uang</label>
                      <div className="relative">
                        <input value={edit.nilaiUang}
                          onChange={(e) => setEdit((p) => ({ ...p, nilaiUang: formatUang(e.target.value) }))}
                          className="input-field pr-20" inputMode="numeric" autoComplete="off" />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">× 1.000</span>
                      </div>
                      {edit.nilaiUang !== "" && (
                        <p className="text-sm text-batik-600 font-semibold mt-1">
                          = Rp {uangKeRupiah(edit.nilaiUang).toLocaleString("id-ID")}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-600 mb-1">Catatan</label>
                      <input value={edit.catatan}
                        onChange={(e) => setEdit((p) => ({ ...p, catatan: e.target.value }))}
                        placeholder="Catatan tambahan..."
                        className="input-field" />
                    </div>

                    <div className="flex gap-2">
                      <button onClick={() => handleSimpanEdit(s.id)} disabled={loadingEdit}
                        className="btn-primary flex-1 py-3 text-base">
                        {loadingEdit ? "Menyimpan..." : "💾 Simpan"}
                      </button>
                      <button onClick={tutupEdit} className="btn-secondary py-3 px-5 text-base">
                        Batal
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Export */}
      {daftarSumbangan.length > 0 && (
        <section className="card">
          <h3 className="text-lg font-bold text-batik-700 mb-3 flex items-center gap-2">
            <span>💾</span> Unduh Data Tamu
          </h3>
          <TombolExport acara={acara} sumbangan={daftarSumbangan} />
        </section>
      )}
    </div>
  );
}
