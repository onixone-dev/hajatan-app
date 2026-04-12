import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getSemuaAcara } from "@/lib/queries";
import AdminClient from "./AdminClient";

export const revalidate = 0;

export default async function AdminPage() {
  const session = await getSession();
  if (!session || session.role !== "admin") redirect("/login");

  const acara = await getSemuaAcara();
  return <AdminClient acaraList={acara} />;
}