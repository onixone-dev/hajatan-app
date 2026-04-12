import { notFound, redirect } from "next/navigation";
import { getAcaraById, getSumbanganByAcara, getStatistikAcara } from "@/lib/queries";
import { getSession, bolehAkses } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import TamuClient from "./TamuClient";

interface Props {
  params: Promise<{ id: string }>;
}

export const revalidate = 0;

export default async function TamuPage({ params }: Props) {
  const { id } = await params;

  const session = await getSession();
  if (!session) redirect("/login");
  if (!bolehAkses(session, "tamu")) redirect(`/acara/${id}`);

  const acara = await getAcaraById(id);
  if (!acara) return notFound();

  const [sumbanganAwal, statistikAwal, undanganResult] = await Promise.all([
    getSumbanganByAcara(id),
    getStatistikAcara(id),
    supabase.from("undangan").select("id, nama, alamat").eq("acara_id", id).order("nama"),
  ]);

  return (
    <TamuClient
      acara={acara}
      sumbanganAwal={sumbanganAwal}
      statistikAwal={statistikAwal}
      daftarUndangan={undanganResult.data ?? []}
    />
  );
}