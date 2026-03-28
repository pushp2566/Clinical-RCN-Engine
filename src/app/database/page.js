import React from 'react';
import { supabase } from '@/lib/supabaseClient';
import DatabaseClient from '@/components/DatabaseClient';

export const dynamic = 'force-dynamic';

export default async function DatabasePage() {
  // Fetch data
  const { data: documents, error: docErr } = await supabase.from('documents').select('*').order('uploaded_at', { ascending: false });
  const { data: extractedData, error: extErr } = await supabase.from('extracted_data').select('*, documents(*)').order('id', { ascending: false });
  const { data: logs, error: logErr } = await supabase.from('logs').select('*').order('created_at', { ascending: false });
  const { data: claims, error: claimErr } = await supabase.from('claims').select('*').order('created_at', { ascending: false });

  if (docErr || extErr || logErr || claimErr) {
    console.error('Supabase DB fetch error:', { docErr, extErr, logErr, claimErr });
  }

  // Map claims to documents for easy lookup
  const claimsMap = {};
  if (claims) {
    claims.forEach(c => {
      claimsMap[c.document_id] = c;
    });
  }

  return (
    <DatabaseClient 
      extractedData={extractedData} 
      documents={documents} 
      logs={logs} 
      claimsMap={claimsMap} 
    />
  );
}
