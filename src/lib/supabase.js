import { createClient } from '@supabase/supabase-js'

const url  = import.meta.env.VITE_SUPABASE_URL
const key  = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !key) {
  throw new Error('⚠️ Crie o arquivo .env com VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY')
}

export const supabase = createClient(url, key, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
})

// Helper: retorna o user_id logado ou lança erro
export function uid() {
  const session = supabase.auth.getSession()
  return session
}
