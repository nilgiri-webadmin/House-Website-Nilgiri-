require('dotenv').config({ path: '../.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addResource() {
  const newLink = {
    id: `link_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    title: 'Student Handbook',
    url: 'https://docs.google.com/document/d/e/2PACX-1vRxGnnDCVAO3KX2CGtMIcJQuDrAasVk2JHbDxkjsGrTP5ShhZK8N6ZSPX89lexKx86QPAUswSzGLsOA/pub',
    description: null,
    category: 'Official > General',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase.from('important_links').insert([newLink]).select();
  if (error) {
    console.error("Error inserting:", error);
  } else {
    console.log("Success:", data);
  }
}

addResource();
