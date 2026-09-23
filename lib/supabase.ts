import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://eweoydtpchrmnoinyute.supabase.co';
const supabaseAnonKey = 'sb_publishable_LKU29Jh-jtD9DnlDqE0Y0Q_rFFL_lhg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
