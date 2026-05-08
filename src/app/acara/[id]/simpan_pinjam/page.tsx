import { notFound, redirect } from "next/navigation";
import { getAcaraById } from "@/lib/queries";
import { getSession, bolehAkses } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import SimpanPinjamClient from "./SimpanPinjamClient";

interface Props {
  params: Promise<{ id: string }>;
}

export const revalidate = 0;

export default async function SimpanPinjamPage({ params }: Props) {
  const { id } = await params;

  const session = await getSession();
  if (!session) redirect("/login");
  if (!bolehAkses(session, "simpan_pinjam")) redirect(`/acara/${id}`);

  const acara = await getAcaraById(id);
  if (!acara) return notFound();

  const { data: dataAwal } = await supabase
    .from("simpan_pinjam")
    .select("*")
    .eq("acara_id", id)
    .order("created_at", { ascending: false });

  return (
    <SimpanPinjamClient acara={acara} dataAwal={dataAwal ?? []} />
  );
}