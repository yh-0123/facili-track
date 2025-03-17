import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rohnryqforluxapynjdi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvaG5yeXFmb3JsdXhhcHluamRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIxMTc3NDUsImV4cCI6MjA1NzY5Mzc0NX0.nsuUqi0n6xDCrEgOGykQ5xm8RWuvr2v2BYgm7GIgtF0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;