
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qtiplyczwjdmcibmwfzg.supabase.co';
const supabaseAnonKey = 'sb_publishable_g867NqdWpo6WH-22kvVZ1g_AfhvBd19';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
