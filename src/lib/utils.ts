// Format angka menjadi format Rupiah
export function formatRupiah(angka: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(angka);
}

// Format tanggal Indonesia
export function formatTanggal(tanggal: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(tanggal));
}

// Label jenis acara
export const JENIS_ACARA_LABEL: Record<string, string> = {
  pernikahan: "💍 Pernikahan",
  sunatan: "✂️ Sunatan",
  aqiqah: "🐑 Aqiqah",
  syukuran: "🙏 Syukuran",
  lainnya: "🎉 Lainnya",
};
