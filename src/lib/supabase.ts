import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Supabase URL dan Anon Key harus diisi di file .env.local\n" +
      "Salin .env.example menjadi .env.local dan isi nilainya."
  );
}

// Next.js 15: fetch sudah default cache: "no-store"
// Tidak perlu workaround manual seperti di Next.js 14
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
