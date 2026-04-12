"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatTanggal, JENIS_ACARA_LABEL } from "@/lib/utils";
import type { Acara } from "@/types";

interface Fitur {
  id: string;
  label: string;
  icon: string;
}

interface Props {
  acara: Acara;
  fiturTersedia: Fitur[];
  role: string;
  panitia_nama?: string;
}

// Warna per fitur supaya lebih mudah dibedakan
const FITUR_WARNA: Record<string, string> = {
  tamu:          "bg-blue-50   border-blue-200   text-blue-700",
  undangan:      "bg-purple-50 border-purple-200 text-purple-700",
  sewa:          "bg-yellow-50 border-yellow-200 text-yellow-700",
  biaya:         "bg-red-50    border-red-200    text-red-700",
  simpan_pinjam: "bg-green-50  border-green-200  text-green-700",
  konsumsi:      "bg-orange-50 border-orange-200 text-orange-700",
  dokumentasi:   "bg-pink-50   border-pink-200   text-pink-700",
};

export default function DashboardAcaraClient({ acara, fiturTersedia, role, panitia_nama }: Props) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="space-y-6">

      {/* Info acara */}
      <section className="card bg-batik-50 border-batik-200">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="text-4xl">
              {JENIS_ACARA_LABEL[acara.jenis_acara]?.split(" ")[0] ?? "🎉"}
            </span>
            <div>
              <h2 className="text-xl font-bold text-batik-800">{acara.nama_acara}</h2>
              <p className="text-gray-600 text-sm">{acara.nama_tuan_rumah}</p>
              <p className="text-gray-500 text-sm">📅 {formatTanggal(acara.tanggal)}</p>
              <p className="text-gray-500 text-sm">📍 {acara.lokasi}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="text-red-400 hover:text-red-600 text-sm font-semibold flex-shrink-0"
          >
            Keluar
          </button>
        </div>

        {/* Badge role */}
        <div className="mt-3 pt-3 border-t border-batik-200">
          {role === "user" && (
            <span className="bg-batik-100 text-batik-700 text-xs font-bold px-3 py-1 rounded-full">
              👤 Tuan Rumah — Akses Penuh
            </span>
          )}
          {role === "panitia" && (
            <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">
              🤝 Panitia — {panitia_nama}
            </span>
          )}
          {role === "admin" && (
            <span className="bg-gray-100 text-gray-700 text-xs font-bold px-3 py-1 rounded-full">
              ⚙️ Admin
            </span>
          )}
        </div>
      </section>

      {/* Grid menu fitur */}
      <section>
        <h3 className="text-lg font-bold text-batik-700 mb-3">📋 Menu</h3>
        <div className="grid grid-cols-2 gap-3">
          {fiturTersedia.map((fitur) => (
            <Link
              key={fitur.id}
              href={`/acara/${acara.id}/${fitur.id}`}
              className={`card border-2 flex flex-col items-center justify-center py-6 gap-2
                hover:shadow-lg active:scale-95 transition-all duration-150
                ${FITUR_WARNA[fitur.id] ?? "bg-gray-50 border-gray-200 text-gray-700"}`}
            >
              <span className="text-4xl">{fitur.icon}</span>
              <span className="font-bold text-sm text-center leading-tight">
                {fitur.label}
              </span>
            </Link>
          ))}

          {/* Menu kelola panitia — hanya user utama */}
          {role === "user" && (
            <Link
              href={`/acara/${acara.id}/panitia`}
              className="card border-2 border-gray-200 bg-gray-50 flex flex-col items-center
                justify-center py-6 gap-2 hover:shadow-lg active:scale-95 transition-all duration-150"
            >
              <span className="text-4xl">⚙️</span>
              <span className="font-bold text-sm text-gray-600 text-center">
                Kelola Panitia
              </span>
            </Link>
          )}
        </div>
      </section>

      {/* Tombol kembali ke beranda — kalau user utama punya banyak acara */}
      {role === "user" && (
        <Link href="/"
          className="block text-center text-batik-500 font-semibold text-sm hover:underline">
          ‹ Kembali ke Daftar Acara
        </Link>
      )}
    </div>
  );
}