// assets/js/supabase.js
import { createClient } from 'https://esm.sh/@supabase/supabase-js'

export const SUPABASE_URL = 'https://csvvtsheawphgghosryx.supabase.co';
export const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzdnZ0c2hlYXdwaGdnaG9zcnl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5OTEzMTEsImV4cCI6MjA3MjU2NzMxMX0.ph12Klr8Ee4pM3l2fnz2ciAuvKv2gGMxAF9Twwm6l8Y'; 

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
