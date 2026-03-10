import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://phxpqymsfqpywzffjave.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBocHhxeW1zZnFweXd6ZmZqYXZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxMDIxNDEsImV4cCI6MjA4ODY3ODE0MX0.pRTXkCm8xxTiDDErHb3zt10gHAduK66Jk5PaAXFemzU";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
