-- ============================================================
-- CATATAN HAJATAN - Supabase SQL Setup
-- Jalankan file ini di Supabase SQL Editor
-- https://supabase.com → SQL Editor → New Query → Paste & Run
-- ============================================================

-- ─── Tabel Acara ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS acara (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_acara      TEXT NOT NULL,
  jenis_acara     TEXT NOT NULL CHECK (jenis_acara IN ('pernikahan','sunatan','aqiqah','syukuran','lainnya')),
  tanggal         DATE NOT NULL,
  lokasi          TEXT NOT NULL,
  nama_tuan_rumah TEXT NOT NULL,
  catatan         TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Tabel Sumbangan ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sumbangan (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  acara_id     UUID NOT NULL REFERENCES acara(id) ON DELETE CASCADE,
  nama_tamu    TEXT NOT NULL,
  alamat       TEXT,
  jumlah_uang  INTEGER NOT NULL DEFAULT 0,
  barang       TEXT,
  catatan      TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Index untuk performa ─────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_sumbangan_acara_id ON sumbangan(acara_id);
CREATE INDEX IF NOT EXISTS idx_acara_tanggal ON acara(tanggal DESC);

-- ─── Row Level Security (RLS) ────────────────────────────────
-- Aktifkan RLS
ALTER TABLE acara     ENABLE ROW LEVEL SECURITY;
ALTER TABLE sumbangan ENABLE ROW LEVEL SECURITY;

-- Policy: izinkan semua operasi (untuk aplikasi tanpa login)
-- CATATAN: Ganti policy ini jika Anda menambahkan autentikasi nanti
CREATE POLICY "allow_all_acara"     ON acara     FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_sumbangan" ON sumbangan FOR ALL USING (true) WITH CHECK (true);

-- ─── Data contoh (opsional, bisa dihapus) ────────────────────
-- INSERT INTO acara (nama_acara, jenis_acara, tanggal, lokasi, nama_tuan_rumah)
-- VALUES ('Pernikahan Budi & Siti', 'pernikahan', '2025-06-15', 'Jl. Merdeka No. 12, Lampung', 'Pak Ahmad');
