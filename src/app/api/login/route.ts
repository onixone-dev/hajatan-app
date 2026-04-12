import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase";
import { SESSION_OPTIONS, ADMIN_KODE, SessionData } from "@/lib/session";

export async function POST(req: NextRequest) {
  const { kode } = await req.json();

  if (!kode || kode.trim() === "") {
    return NextResponse.json({ error: "Kode tidak boleh kosong." }, { status: 400 });
  }

  const kodeBersih = kode.trim().toUpperCase();
  const session = await getIronSession<SessionData>(await cookies(), SESSION_OPTIONS);

  // ── Cek admin ──
  if (kodeBersih === ADMIN_KODE) {
    session.role = "admin";
    session.acara_id = "";
    session.acara_nama = "Admin";
    await session.save();
    return NextResponse.json({ role: "admin" });
  }

  // ── Cek kode acara (user utama) ──
  const { data: acara } = await supabase
    .from("acara")
    .select("id, nama_acara")
    .eq("kode_acara", kodeBersih)
    .single();

  if (acara) {
    session.role = "user";
    session.acara_id = acara.id;
    session.acara_nama = acara.nama_acara;
    await session.save();
    return NextResponse.json({ role: "user", acara_id: acara.id });
  }

  // ── Cek kode panitia ──
  const { data: panitia } = await supabase
    .from("panitia")
    .select("id, nama, acara_id, fitur_akses, acara:acara_id(nama_acara)")
    .eq("kode_panitia", kodeBersih)
    .single();

  if (panitia) {
    session.role = "panitia";
    session.acara_id = panitia.acara_id;
    session.acara_nama = (panitia.acara as any).nama_acara;
    session.panitia_id = panitia.id;
    session.panitia_nama = panitia.nama;
    session.fitur_akses = panitia.fitur_akses;
    await session.save();
    return NextResponse.json({
      role: "panitia",
      acara_id: panitia.acara_id,
      fitur_akses: panitia.fitur_akses,
    });
  }

  return NextResponse.json({ error: "Kode tidak ditemukan." }, { status: 401 });
}