// =============================================
// SUPABASE CONFIGURATION
// Replace these with your actual Supabase credentials
// =============================================
const SUPABASE_URL = "https://wkgacywvsndwiezqdcxj.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrZ2FjeXd2c25kd2llenFkY3hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxMzU3MDksImV4cCI6MjA4ODcxMTcwOX0.jRJR4F-rN4xF87maTcpzi4OB3oFbQFEI6Vg8TYd2uno";

const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
