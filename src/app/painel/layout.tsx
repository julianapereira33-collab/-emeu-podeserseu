import { redirect } from "next/navigation";
import { getCurrentUsuario } from "@/lib/supabase/current-usuario";

export default async function PainelLayout({ children }: { children: React.ReactNode }) {
  const usuario = await getCurrentUsuario();
  if (!usuario) redirect("/login");

  return <div className="mx-auto w-full max-w-5xl px-4 py-8">{children}</div>;
}
