import { SessionOptions } from "iron-session";

export interface SessionData {
  role: "admin" | "user" | "panitia";
  acara_id: string;
  acara_nama: string;
  panitia_id?: string;
  panitia_nama?: string;
  fitur_akses?: string[];
}

export const SESSION_OPTIONS: SessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: "hajatan_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24, // 1 hari
  },
};

export const ADMIN_KODE = process.env.ADMIN_KODE!;

export const FITUR_LIST = [
  { id: "tamu",         label: "Catatan Tamu",         icon: "👥" },
  { id: "undangan",     label: "Catatan Undangan",      icon: "📨" },
  { id: "sewa",         label: "Catatan Sewa",          icon: "🪑" },
  { id: "biaya",        label: "Catatan Biaya",         icon: "💸" },
  { id: "simpan_pinjam",label: "Simpan Pinjam",         icon: "🤝" },
  { id: "konsumsi",     label: "Catatan Konsumsi",      icon: "🍽️" },
  { id: "dokumentasi",  label: "Dokumentasi",           icon: "📸" },
];