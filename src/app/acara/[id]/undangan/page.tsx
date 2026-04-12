import { notFound, redirect } from "next/navigation";
import { getAcaraById } from "@/lib/queries";
import { getSession, bolehAkses } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import UndanganClient from "./UndanganClient";

interface Props {
  params: Promise<{ id: string }>;
}

export const revalidate = 0;

export default async function UndanganPage({ params }: Props) {
  const { id } = await params;

  const session = await getSession();
  if (!session) redirect("/login");
  if (!bolehAkses(session, "undangan")) redirect(`/acara/${id}`);

  const acara = await getAcaraById(id);
  if (!acara) return notFound();

  const { data: undanganAwal } = await supabase
    .from("undangan")
    .select("*")
    .eq("acara_id", id)
    .order("created_at", { ascending: false });

  return (
    <UndanganClient
      acara={acara}
      undanganAwal={undanganAwal ?? []}
    />
  );
}