import Link from "next/link";
import { redirect } from "next/navigation";
import { getSemuaAcara } from "@/lib/queries";
import { formatTanggal, JENIS_ACARA_LABEL } from "@/lib/utils";
import { getSession } from "@/lib/auth";
import LogoutButton from "@/components/ui/LogoutButton";
import type { Acara } from "@/types";

export const revalidate = 0;

export default async function HomePage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role === "admin") redirect("/admin");

  let acaraList: Acara[] = [];
  let errorMsg = "";

  try {
    // User utama lihat semua acara miliknya
    // Panitia lihat acara yang ditugaskan saja
    if (session.role === "user") {
      const { data } = await supabase_direct(session.acara_id);
      acaraList = data ?? [];
    } else {
      // panitia — hanya 1 acara
      const { getAcaraById } = await import("@/lib/queries");
      const acara = await getAcaraById(session.acara_id);
      if (acara) acaraList = [acara];
    }
  } catch (err: any) {
    errorMsg = `Gagal memuat data: ${err.message}`;
  }

  return (
    <div className="space-y-6">
      {/* Info session */}
      <div className="card bg-batik-50 border-batik-200 flex items-center justify-between">
        <div>
          <p className="font-bold text-batik-700">{session.acara_nama}</p>
          <p className="text-sm text-gray-500">
            {session.role === "user" ? "👤 Tuan Rumah" : `🤝 Panitia — ${session.panitia_nama}`}
          </p>
        </div>
        <LogoutButton />
      </div>

      {errorMsg && (
        <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4 text-red-700 font-medium text-center">
          ⚠️ {errorMsg}
        </div>
      )}

      {/* Daftar acara / menu fitur */}
      <div className="space-y-3">
        {acaraList.map((acara) => (
          <Link key={acara.id} href={`/acara/${acara.id}`}
            className="card flex items-center gap-4 hover:border-batik-300 hover:shadow-lg transition-all block">
            <div className="text-3xl flex-shrink-0">
              {JENIS_ACARA_LABEL[acara.jenis_acara]?.split(" ")[0] ?? "🎉"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-lg text-gray-800 truncate">{acara.nama_acara}</p>
              <p className="text-gray-500 text-sm">{acara.nama_tuan_rumah} · {formatTanggal(acara.tanggal)}</p>
            </div>
            <div className="text-batik-400 text-xl">›</div>
          </Link>
        ))}
      </div>
    </div>
  );
}

// Helper langsung query acara berdasarkan acara_id session
async function supabase_direct(acara_id: string) {
  const { supabase } = await import("@/lib/supabase");
  return supabase.from("acara").select("*").eq("id", acara_id);
}