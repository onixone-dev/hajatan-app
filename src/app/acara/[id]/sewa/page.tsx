import { notFound, redirect } from "next/navigation";
import { getAcaraById } from "@/lib/queries";
import { getSession, bolehAkses } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import SewaClient from "./SewaClient";

interface Props {
  params: Promise<{ id: string }>;
}

export const revalidate = 0;

export default async function SewaPage({ params }: Props) {
  const { id } = await params;

  const session = await getSession();
  if (!session) redirect("/login");
  if (!bolehAkses(session, "sewa")) redirect(`/acara/${id}`);

  const acara = await getAcaraById(id);
  if (!acara) return notFound();

  const { data: sewaAwal } = await supabase
    .from("sewa")
    .select("*")
    .eq("acara_id", id)
    .order("created_at", { ascending: false });

  return (
    <SewaClient acara={acara} sewaAwal={sewaAwal ?? []} />
  );
}