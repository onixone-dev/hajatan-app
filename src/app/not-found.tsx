import Link from "next/link";

export default function NotFound() {
  return (
    <div className="card text-center py-16">
      <p className="text-6xl mb-4">🔍</p>
      <h2 className="text-2xl font-bold text-batik-700 mb-2">Halaman Tidak Ditemukan</h2>
      <p className="text-gray-500 mb-6">Acara yang Anda cari mungkin sudah dihapus.</p>
      <Link href="/" className="btn-primary inline-block">
        ‹ Kembali ke Beranda
      </Link>
    </div>
  );
}
