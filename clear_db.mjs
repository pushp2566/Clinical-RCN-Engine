import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fdivzadlysdcjuuypicm.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkaXZ6YWRseXNkY2p1dXlwaWNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NzQxODYsImV4cCI6MjA5MDI1MDE4Nn0.o7jphO-Cqh_mJeb0-mHXNfO6oRFfoF4UIZIfpD9hkoM';
const supabase = createClient(supabaseUrl, supabaseKey);

async function clearDB() {
  console.log('Clearing database tables...');
  
  // Need to clear child tables first if there are foreign keys, but we can try dropping all rows
  await supabase.from('logs').delete().neq('id', 0);
  await supabase.from('claims').delete().neq('id', 0);
  await supabase.from('extracted_data').delete().neq('id', 0);
  await supabase.from('documents').delete().neq('id', 0);
  
  console.log('Database cleared successfully!');
}

clearDB();
