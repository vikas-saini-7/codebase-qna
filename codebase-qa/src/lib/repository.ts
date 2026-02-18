// repository.ts
// Create and manage repository records in Supabase
import { supabase } from "./supabase";

export async function createRepository(name: string) {
  const { data, error } = await supabase
    .from("repositories")
    .insert([{ name }])
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}
