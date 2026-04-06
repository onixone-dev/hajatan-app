import Link from "next/link";
import { getSemuaAcara } from "@/lib/queries";
import { formatTanggal, JENIS_ACARA_LABEL } from "@/lib/utils";
import TambahAcaraForm from "@/components/forms/TambahAcaraForm";
import type { Acara } from "@/types";


export default async function HomePage() {
  let acaraList: Acara[] = [];
  let errorMsg = "";

  try {
    acaraList = await getSemuaAcara();
  } catch (err: any) {
    errorMsg = `Gagal memuat data: ${err.message ?? "Cek koneksi Supabase Anda."}`;
  }

  return (
    <div className="space-y-6">
      {/* Pesan error koneksi */}
      {errorMsg && (
        <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4 text-red-700 font-medium text-center">
          ⚠️ {errorMsg}
        </div>
      )}

      {/* Form tambah acara baru */}
      <section className="card">
        <h2 className="text-xl font-bold text-batik-700 mb-4 flex items-center gap-2">
          <span>➕</span> Buat Acara Baru
        </h2>
        <TambahAcaraForm />
      </section>

      {/* Daftar acara */}
      <section>
        <h2 className="text-xl font-bold text-batik-700 mb-3 flex items-center gap-2">
          <span>📋</span> Daftar Acara
          <span className="ml-auto text-base font-normal text-gray-500">
            {acaraList.length} acara
          </span>
        </h2>

        {acaraList.length === 0 && !errorMsg ? (
          <div className="card text-center py-10 text-gray-400">
            <p className="text-4xl mb-2">🎉</p>
            <p className="text-lg">Belum ada acara.</p>
            <p className="text-sm mt-1">Buat acara baru di atas!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {acaraList.map((acara) => (
              <Link
                key={acara.id}
                href={`/acara/${acara.id}`}
                className="card flex items-center gap-4 hover:border-batik-300 hover:shadow-lg transition-all duration-150 active:scale-[0.98] block"
              >
                {/* Ikon jenis acara */}
                <div className="text-3xl flex-shrink-0">
                  {JENIS_ACARA_LABEL[acara.jenis_acara]?.split(" ")[0] ?? "🎉"}
                </div>

                {/* Info acara */}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-lg text-gray-800 truncate">
                    {acara.nama_acara}
                  </p>
                  <p className="text-gray-500 text-sm">
                    {acara.nama_tuan_rumah} · {formatTanggal(acara.tanggal)}
                  </p>
                  <p className="text-gray-400 text-sm truncate">{acara.lokasi}</p>
                </div>

                {/* Panah */}
                <div className="text-batik-400 text-xl flex-shrink-0">›</div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
