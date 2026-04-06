# 🏡 Catatan Hajatan

Aplikasi sederhana untuk mencatat sumbangan tamu di acara hajatan (pernikahan, sunatan, aqiqah, syukuran, dll).

Dibuat dengan **Next.js 14**, **Tailwind CSS**, dan **Supabase**.

---

## 📋 Fitur

- ✅ Buat dan kelola beberapa acara sekaligus
- ✅ Catat nama tamu, jumlah uang, dan barang bawaan
- ✅ Ringkasan otomatis (total tamu, total uang, yang bawa barang)
- ✅ Hapus data yang salah
- ✅ Tampilan besar dan mudah dibaca (ramah orang tua)
- ✅ Bisa dipakai di HP dan komputer

---

## 🚀 Cara Setup

### 1. Clone & Install

```bash
git clone <repo-url>
cd hajatan-app
npm install
```

### 2. Buat Project Supabase

1. Buka [supabase.com](https://supabase.com) → **New Project**
2. Catat **Project URL** dan **anon/public key** dari menu **Settings → API**

### 3. Buat Tabel di Supabase

1. Buka **SQL Editor** di dashboard Supabase
2. Klik **New Query**
3. Copy-paste isi file `supabase-schema.sql`
4. Klik **Run**

### 4. Isi File Environment

```bash
cp .env.example .env.local
```

Buka `.env.local` dan isi:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

### 5. Jalankan Aplikasi

```bash
npm run dev
```

Buka browser: [http://localhost:3000](http://localhost:3000)

---

## 📁 Struktur Folder

```
hajatan-app/
├── src/
│   ├── app/                        # Halaman (Next.js App Router)
│   │   ├── layout.tsx              # Layout utama (header & footer)
│   │   ├── page.tsx                # Halaman beranda (daftar acara)
│   │   ├── loading.tsx             # Skeleton loading
│   │   ├── error.tsx               # Halaman error
│   │   ├── not-found.tsx           # Halaman 404
│   │   └── acara/[id]/
│   │       └── page.tsx            # Detail acara + daftar sumbangan
│   │
│   ├── components/
│   │   ├── forms/
│   │   │   ├── TambahAcaraForm.tsx     # Form buat acara baru
│   │   │   └── TambahSumbanganForm.tsx # Form catat sumbangan tamu
│   │   ├── lists/
│   │   │   └── DaftarSumbangan.tsx    # Daftar sumbangan dengan tombol hapus
│   │   └── ui/
│   │       └── KartuStatistik.tsx     # Kartu ringkasan statistik
│   │
│   ├── lib/
│   │   ├── supabase.ts     # Inisialisasi Supabase client
│   │   ├── queries.ts      # Semua fungsi query database
│   │   └── utils.ts        # Format Rupiah, tanggal, dll
│   │
│   └── types/
│       └── index.ts        # TypeScript types
│
├── supabase-schema.sql     # SQL untuk setup tabel di Supabase
├── .env.example            # Contoh environment variables
├── tailwind.config.js
├── next.config.js
└── package.json
```

---

## 🛠️ Teknologi

| Teknologi | Kegunaan |
|---|---|
| Next.js 14 (App Router) | Framework React dengan server rendering |
| Tailwind CSS | Styling yang cepat dan konsisten |
| Supabase | Database PostgreSQL + API otomatis |
| TypeScript | Kode lebih aman dari error |

---

## 🔧 Pengembangan Selanjutnya (opsional)

- [ ] Export data ke Excel/PDF
- [ ] Login dengan password (privasi data)
- [ ] Cetak laporan sumbangan
- [ ] Fitur pencarian tamu

---

## 📞 Bantuan

Jika ada masalah saat setup, pastikan:
1. File `.env.local` sudah diisi dengan benar
2. Tabel sudah dibuat di Supabase (jalankan `supabase-schema.sql`)
3. RLS Policy sudah aktif di Supabase
