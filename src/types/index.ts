// Tipe data untuk Acara (Hajatan)
export interface Acara {
  id: string;
  nama_acara: string;
  jenis_acara: "pernikahan" | "sunatan" | "aqiqah" | "syukuran" | "lainnya";
  tanggal: string;
  lokasi: string;
  nama_tuan_rumah: string;
  catatan?: string;
  created_at: string;
}

// Tipe data untuk Sumbangan Tamu
export interface Sumbangan {
  id: string;
  acara_id: string;
  nama_tamu: string;
  alamat?: string;
  jumlah_uang: number;
  barang?: string;
  catatan?: string;
  created_at: string;
}

// Tipe untuk form tambah sumbangan
export type SumbanganFormData = Omit<Sumbangan, "id" | "created_at">;

// Tipe untuk form tambah acara
export type AcaraFormData = Omit<Acara, "id" | "created_at">;

// Ringkasan statistik acara
export interface StatistikAcara {
  total_tamu: number;
  total_uang: number;
  total_dengan_barang: number;
}
