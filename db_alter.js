const { Client } = require('pg');
const connectionString = 'postgresql://postgres:7%2C26.dNgf-Cf%2FpS@db.uibbwvddhamtlhnnjjti.supabase.co:5432/postgres';
const client = new Client({ connectionString });
async function alterDb() {
  try {
    await client.connect();
    await client.query('ALTER TABLE claims ADD COLUMN IF NOT EXISTS billed_amount NUMERIC');
    await client.query('ALTER TABLE claims ADD COLUMN IF NOT EXISTS approved_amount NUMERIC');
    await client.query('ALTER TABLE claims ADD COLUMN IF NOT EXISTS paid_amount NUMERIC');
    console.log('Columns added successfully.');
  } catch (e) {
    console.error(e);
  } finally {
    await client.end();
  }
}
alterDb();
