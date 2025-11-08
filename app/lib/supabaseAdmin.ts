// lib/supabaseAdmin.ts
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // server-side only!
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export default supabaseAdmin
