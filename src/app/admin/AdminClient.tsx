"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { formatTanggal, JENIS_ACARA_LABEL } from "@/lib/utils";
import type { Acara, AcaraFormData } from "@/types";

interface Props { acaraList: Acara[] }

function generateKode(nama: string): string {
  const bersih = nama.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
  const angka = Math.floor(100 + Math.random() * 900);
  return `${bersih}${angka}`;
}

export default function AdminClient({ acaraList }: Props) {
  const router = useRouter();
  const [list, setList] = useState<Acara[]>(acaraList);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [buka, setBuka] = useState(false);
  const [editAcaraId, setEditAcaraId] = useState<string | null>(null);
  const [editAcara, setEditAcara] = useState<Partial<Acara>>({});
  const [loadingEdit, setLoadingEdit] = useState(false);

  async function handleLogout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  async function handleTambahAcara(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(""); setLoading(true);
    const data = new FormData(e.currentTarget);
    const namaAcara = data.get("nama_acara") as string;

    const formData: AcaraFormData & { kode_acara: string } = {
      nama_acara: namaAcara,
      jenis_acara: data.get("jenis_acara") as AcaraFormData["jenis_acara"],
      tanggal: data.get("tanggal") as string,
      lokasi: data.get("lokasi") as string,
      nama_tuan_rumah: data.get("nama_tuan_rumah") as string,
      kode_acara: generateKode(namaAcara),
    };

    try {
      const { data: baru, error: sbError } = await supabase
        .from("acara").insert(formData).select().single();
      if (sbError) throw sbError;
      setList([baru, ...list]);
      setBuka(false);
      (e.target as HTMLFormElement).reset();
    } catch (err: any) {
      setError(`Gagal: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  function bukaEditAcara(acara: Acara) {
  setEditAcaraId(acara.id);
  setEditAcara({
    nama_acara:      acara.nama_acara,
    jenis_acara:     acara.jenis_acara,
    tanggal:         acara.tanggal,
    lokasi:          acara.lokasi,
    nama_tuan_rumah: acara.nama_tuan_rumah,
  });
}

async function handleSimpanEditAcara(id: string) {
  if (!editAcara.nama_acara?.trim()) { alert("Nama acara tidak boleh kosong."); return; }
  setLoadingEdit(true);
  try {
    const payload = {
      nama_acara:      editAcara.nama_acara?.trim(),
      jenis_acara:     editAcara.jenis_acara,
      tanggal:         editAcara.tanggal,
      lokasi:          editAcara.lokasi?.trim(),
      nama_tuan_rumah: editAcara.nama_tuan_rumah?.trim(),
    };

    const { error } = await supabase
      .from("acara").update(payload).eq("id", id);
    if (error) throw error;

    setList((prev) =>
      prev.map((a) => a.id === id ? { ...a, ...payload } as Acara : a)
    );
    setEditAcaraId(null);
  } catch (err: any) {
    alert(`Gagal menyimpan: ${err.message}`);
  } finally {
    setLoadingEdit(false);
  }
}

  return (
    <div className="space-y-6">
      {/* Header admin */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-batik-800">⚙️ Dashboard Admin</h2>
          <p className="text-gray-500 text-sm">{list.length} acara terdaftar</p>
        </div>
        <button onClick={handleLogout}
          className="text-red-500 hover:bg-red-50 px-4 py-2 rounded-xl font-semibold transition-colors">
          Keluar
        </button>
      </div>

      {/* Tombol tambah acara */}
      {!buka ? (
        <button onClick={() => setBuka(true)} className="btn-primary w-full">
          + Buat Acara Baru
        </button>
      ) : (
        <div className="card">
          <h3 className="text-lg font-bold text-batik-700 mb-4">Buat Acara Baru</h3>
          <form onSubmit={handleTambahAcara} className="space-y-3">
            <input name="nama_acara" required placeholder="Nama Acara" className="input-field" />
            <select name="jenis_acara" required className="input-field bg-white">
              <option value="">-- Jenis Acara --</option>
              <option value="pernikahan">💍 Pernikahan</option>
              <option value="sunatan">✂️ Sunatan</option>
              <option value="aqiqah">🐑 Aqiqah</option>
              <option value="syukuran">🙏 Syukuran</option>
              <option value="lainnya">🎉 Lainnya</option>
            </select>
            <input name="nama_tuan_rumah" required placeholder="Nama Tuan Rumah" className="input-field" />
            <input name="tanggal" type="date" required className="input-field" />
            <input name="lokasi" required placeholder="Lokasi" className="input-field" />
            {error && <p className="text-red-500 text-sm">⚠️ {error}</p>}
            <div className="flex gap-3">
              <button type="submit" disabled={loading} className="btn-primary flex-1">
                {loading ? "Menyimpan..." : "💾 Simpan"}
              </button>
              <button type="button" onClick={() => setBuka(false)} className="btn-secondary">
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Daftar acara */}
    <div className="space-y-3">
    {list.map((acara) => (
        <div key={acara.id} className="card">
        {/* Info acara */}
        <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
            <p className="font-bold text-lg text-gray-800">{acara.nama_acara}</p>
            <p className="text-gray-500 text-sm">
                {acara.nama_tuan_rumah} · {formatTanggal(acara.tanggal)}
            </p>
            <p className="text-gray-400 text-sm">📍 {acara.lokasi}</p>
            </div>

            <div className="flex flex-col items-end gap-2 flex-shrink-0">
            {/* Kode acara */}
            <div className="text-right">
                <p className="text-xs text-gray-400">Kode Acara</p>
                <p className="font-bold text-batik-600 text-lg tracking-widest">
                {(acara as any).kode_acara ?? "-"}
                </p>
            </div>

            {/* Tombol edit */}
            <button
                onClick={() => editAcaraId === acara.id ? setEditAcaraId(null) : bukaEditAcara(acara)}
                className="text-batik-400 hover:text-batik-600 hover:bg-batik-50
                px-3 py-1 rounded-lg text-sm font-semibold transition-colors">
                {editAcaraId === acara.id ? "✖️ Tutup" : "✏️ Edit"}
            </button>
            </div>
        </div>

        {/* Panel edit inline */}
        {editAcaraId === acara.id && (
            <div className="mt-4 pt-4 border-t border-batik-100 space-y-3">
            <p className="text-sm font-bold text-batik-700">✏️ Edit Acara</p>

            <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">Nama Acara</label>
                <input
                value={editAcara.nama_acara ?? ""}
                onChange={(e) => setEditAcara((p) => ({ ...p, nama_acara: e.target.value }))}
                className="input-field" />
            </div>

            <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">Jenis Acara</label>
                <select
                value={editAcara.jenis_acara ?? ""}
                onChange={(e) => setEditAcara((p) => ({ ...p, jenis_acara: e.target.value as Acara["jenis_acara"] }))}
                className="input-field bg-white">
                <option value="pernikahan">💍 Pernikahan</option>
                <option value="sunatan">✂️ Sunatan</option>
                <option value="aqiqah">🐑 Aqiqah</option>
                <option value="syukuran">🙏 Syukuran</option>
                <option value="lainnya">🎉 Lainnya</option>
                </select>
            </div>

            <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">Nama Tuan Rumah</label>
                <input
                value={editAcara.nama_tuan_rumah ?? ""}
                onChange={(e) => setEditAcara((p) => ({ ...p, nama_tuan_rumah: e.target.value }))}
                className="input-field" />
            </div>

            <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">Tanggal</label>
                <input
                type="date"
                value={editAcara.tanggal ?? ""}
                onChange={(e) => setEditAcara((p) => ({ ...p, tanggal: e.target.value }))}
                className="input-field" />
            </div>

            <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">Lokasi</label>
                <input
                value={editAcara.lokasi ?? ""}
                onChange={(e) => setEditAcara((p) => ({ ...p, lokasi: e.target.value }))}
                className="input-field" />
            </div>

            <div className="flex gap-2">
                <button
                onClick={() => handleSimpanEditAcara(acara.id)}
                disabled={loadingEdit}
                className="btn-primary flex-1 py-3 text-base">
                {loadingEdit ? "Menyimpan..." : "💾 Simpan"}
                </button>
                <button
                onClick={() => setEditAcaraId(null)}
                className="btn-secondary py-3 px-5 text-base">
                Batal
                </button>
            </div>
            </div>
        )}
        </div>
    ))}
    </div>
    </div>
  );
}