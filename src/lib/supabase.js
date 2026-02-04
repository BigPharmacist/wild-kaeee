import { createClient } from '@supabase/supabase-js'

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validierung der Umgebungsvariablen
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase Konfiguration fehlt! VITE_SUPABASE_URL und VITE_SUPABASE_ANON_KEY müssen gesetzt sein.')
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
    global: {
      headers: { 'x-client-info': 'kaeee-app' },
    },
  }
)

// Hilfsfunktion zum Prüfen der Supabase-Verbindung
export async function checkSupabaseConnection() {
  try {
    const { error } = await supabase.from('pharmacies').select('count', { count: 'exact', head: true })
    return !error
  } catch {
    return false
  }
}
