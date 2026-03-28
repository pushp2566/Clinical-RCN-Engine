
const { Client } = require('pg');

const connectionString = 'postgresql://postgres:7%2C26.dNgf-Cf%2FpS@db.uibbwvddhamtlhnnjjti.supabase.co:5432/postgres';

const client = new Client({
  connectionString,
});

async function setupDatabase() {
  try {
    await client.connect();
    console.log('Connected to Supabase PostgreSQL locally.');

    const schemaQuery = `
      CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT,
          email TEXT UNIQUE NOT NULL,
          role TEXT CHECK (role IN ('hospital', 'insurance', 'admin'))
      );

      CREATE TABLE IF NOT EXISTS documents (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(id),
          file_url TEXT,
          file_type TEXT,
          uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
      );

      CREATE TABLE IF NOT EXISTS extracted_data (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          document_id UUID REFERENCES documents(id),
          patient_id UUID DEFAULT gen_random_uuid(),
          patient_name TEXT,
          diagnosis TEXT,
          icd_code TEXT,
          procedure TEXT,
          cpt_code TEXT,
          total_cost NUMERIC
      );

      CREATE TABLE IF NOT EXISTS claims (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          document_id UUID REFERENCES documents(id),
          status TEXT CHECK (status IN ('pending', 'approved', 'rejected')),
          submitted_to TEXT,
          billed_amount NUMERIC,
          approved_amount NUMERIC,
          paid_amount NUMERIC,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
      );

      CREATE TABLE IF NOT EXISTS logs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          document_id UUID REFERENCES documents(id),
          error_type TEXT,
          message TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
      );
    `;

    await client.query(schemaQuery);
    console.log('Database tables created successfully.');
  } catch (err) {
    console.error('Error setting up the database:', err.stack);
  } finally {
    await client.end();
  }
}

setupDatabase();
