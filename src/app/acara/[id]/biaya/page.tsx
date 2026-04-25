import { notFound, redirect } from "next/navigation";
import { getAcaraById } from "@/lib/queries";
import { getSession, bolehAkses } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import BiayaClient from "./BiayaClient";

interface Props {
  params: Promise<{ id: string }>;
}

export const revalidate = 0;

export default async function BiayaPage({ params }: Props) {
  const { id } = await params;

  const session = await getSession();
  if (!session) redirect("/login");
  if (!bolehAkses(session, "biaya")) redirect(`/acara/${id}`);

  const acara = await getAcaraById(id);
  if (!acara) return notFound();

  const { data: biayaAwal } = await supabase
    .from("biaya")
    .select("*")
    .eq("acara_id", id)
    .order("created_at", { ascending: false });

  return (
    <BiayaClient acara={acara} biayaAwal={biayaAwal ?? []} />
  );
}