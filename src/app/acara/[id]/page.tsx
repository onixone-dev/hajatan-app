import { notFound, redirect } from "next/navigation";
import { getAcaraById } from "@/lib/queries";
import { getSession } from "@/lib/auth";
import { bolehAkses } from "@/lib/auth";
import { FITUR_LIST } from "@/lib/session";
import DashboardAcaraClient from "./DashboardAcaraClient";

interface Props {
  params: Promise<{ id: string }>;
}

export const revalidate = 0;

export default async function AcaraPage({ params }: Props) {
  const { id } = await params;

  const session = await getSession();
  if (!session) redirect("/login");

  const acara = await getAcaraById(id);
  if (!acara) return notFound();

  // Panitia hanya bisa akses acara yang ditugaskan
  if (session.role === "panitia" && session.acara_id !== id) {
    redirect("/");
  }

  // Filter fitur yang boleh diakses
  const fiturTersedia = FITUR_LIST.filter((f) =>
    bolehAkses(session, f.id)
  );

  return (
    <DashboardAcaraClient
      acara={acara}
      fiturTersedia={fiturTersedia}
      role={session.role}
      panitia_nama={session.panitia_nama}
    />
  );
}