'use client'

import { createClient } from '@supabase/supabase-js'

const isBrowser = typeof window !== 'undefined'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: isBrowser ? window.localStorage : undefined,
    },
  }
)

// // app/lib/supabaseClient.ts
// "use client";

// import { createClient } from "@supabase/supabase-js";

// const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// // ✅ ESTE é o client que você deve importar e usar
// export const supabase = createClient(supabaseUrl, supabaseAnonKey);
