import { supabase } from '@shared/supabase/client';
import type { Database } from '@shared/supabase/database.types';

type MedicationRow = Database['public']['Tables']['medications']['Row'];
type MedicationInsert = Database['public']['Tables']['medications']['Insert'];
type MedicationUpdate = Database['public']['Tables']['medications']['Update'];

export async function getMedicationById(id: string): Promise<MedicationRow> {
  const { data, error } = await supabase
    .from('medications')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function updateMedication(id: string, updates: MedicationUpdate): Promise<void> {
  const { error } = await supabase
    .from('medications')
    .update(updates)
    .eq('id', id);
  if (error) throw error;
}

export async function insertMedication(data: MedicationInsert): Promise<{ id: string }> {
  const { data: row, error } = await supabase
    .from('medications')
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return { id: row.id };
}
