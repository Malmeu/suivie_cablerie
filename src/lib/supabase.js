import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pcvtfufyolojflxehhzh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjdnRmdWZ5b2xvamZseGVoaHpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1NzM4NzgsImV4cCI6MjA5MjE0OTg3OH0.LbYfNR3LwNdvPdyrwoqA695VX5TX8Ctv4wHWJfdK6sg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
