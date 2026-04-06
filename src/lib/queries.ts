import { supabase } from "./supabase";
import type { Acara, AcaraFormData, Sumbangan, SumbanganFormData, StatistikAcara } from "@/types";

// ─── Acara ────────────────────────────────────────────────────────────────────

export async function getSemuaAcara(): Promise<Acara[]> {
  const { data, error } = await supabase
    .from("acara")
    .select("*")
    .order("tanggal", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getAcaraById(id: string): Promise<Acara | null> {
  const { data, error } = await supabase
    .from("acara")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function tambahAcara(formData: AcaraFormData): Promise<Acara> {
  const { data, error } = await supabase
    .from("acara")
    .insert(formData)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function hapusAcara(id: string): Promise<void> {
  const { error } = await supabase.from("acara").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ─── Sumbangan ────────────────────────────────────────────────────────────────

export async function getSumbanganByAcara(acaraId: string): Promise<Sumbangan[]> {
  const { data, error } = await supabase
    .from("sumbangan")
    .select("*")
    .eq("acara_id", acaraId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function tambahSumbangan(formData: SumbanganFormData): Promise<Sumbangan> {
  const { data, error } = await supabase
    .from("sumbangan")
    .insert(formData)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function hapusSumbangan(id: string): Promise<void> {
  const { error } = await supabase.from("sumbangan").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function getStatistikAcara(acaraId: string): Promise<StatistikAcara> {
  const { data, error } = await supabase
    .from("sumbangan")
    .select("jumlah_uang, barang")
    .eq("acara_id", acaraId);

  if (error) throw new Error(error.message);

  const sumbangan = data ?? [];
  return {
    total_tamu: sumbangan.length,
    total_uang: sumbangan.reduce((sum, s) => sum + (s.jumlah_uang ?? 0), 0),
    total_dengan_barang: sumbangan.filter((s) => s.barang && s.barang.trim() !== "").length,
  };
}
