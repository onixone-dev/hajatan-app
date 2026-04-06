import { notFound } from "next/navigation";
import { getAcaraById, getSumbanganByAcara, getStatistikAcara } from "@/lib/queries";
import DetailAcaraClient from "./DetailAcaraClient";

// Next.js 15: params adalah Promise — harus di-await
interface Props {
  params: Promise<{ id: string }>;
}

// Server Component: fetch data awal, lalu serahkan ke Client Component
export default async function DetailAcaraPage({ params }: Props) {
  const { id } = await params;

  try {
    const acara = await getAcaraById(id);
    if (!acara) return notFound();

    const [sumbanganAwal, statistikAwal] = await Promise.all([
      getSumbanganByAcara(id),
      getStatistikAcara(id),
    ]);

    return (
      <DetailAcaraClient
        acara={acara}
        sumbanganAwal={sumbanganAwal}
        statistikAwal={statistikAwal}
      />
    );
  } catch {
    return (
      <div className="card text-center py-10 text-red-500">
        ⚠️ Gagal memuat data acara. Coba refresh halaman.
      </div>
    );
  }
}
