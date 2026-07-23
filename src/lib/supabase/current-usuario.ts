import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export async function getCurrentUsuario(): Promise<Tables<"usuarios"> | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("usuarios")
    .select("*")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  return data;
}
