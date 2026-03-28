import { NextResponse } from 'next/server';
import { extractClinicalEntities } from '@/lib/extractionEngine';
import { mapToFHIR } from '@/lib/fhirMapper';
import { runReconciliationRules } from '@/lib/reconciliationEngine';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request) {
  try {
    const data = await request.formData();
    const files = data.getAll('documents');
    const phase = data.get('phase') || 'none';
    let contextHistory = null;
    try {
      const ch = data.get('contextHistory');
      if (ch) contextHistory = JSON.parse(ch);
    } catch(e) {
      console.warn('Failed to parse contextHistory', e);
    }

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files received.' },
        { status: 400 }
      );
    }

    const documentParts = [];
    let fileTypes = [];
    
    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      documentParts.push({
        inlineData: {
          data: buffer.toString('base64'),
          mimeType: file.type
        }
      });
      fileTypes.push(file.type);
    }

    const apiKey = process.env.GEMINI_API_KEY;
    
    let extractedEntities = null;
    let fhirStructure = null;
    let reconciliationIssues = [];
    let validationSummary = null;
    
    if (apiKey) {
      try {
        extractedEntities = await extractClinicalEntities(documentParts, apiKey, phase, contextHistory);
        fhirStructure = mapToFHIR(extractedEntities);
        const reconciliationData = runReconciliationRules(extractedEntities);
        reconciliationIssues = reconciliationData.issues;
        validationSummary = reconciliationData.validationSummary;
        
        // --- SUPABASE INTEGRATION ---

        // 1. Insert into documents table
        const { data: docData, error: docError } = await supabase
          .from('documents')
          .insert([
            {
              file_type: fileTypes[0] || 'application/pdf',
              file_url: 'In-memory buffer (no persistent storage set up)',
            }
          ])
          .select()
          .single();

        if (docError) throw new Error(`Supabase doc insert error: ${docError.message}`);
        
        // 2. Insert into extracted_data table
        const documentId = docData.id;
        const patientName = fhirStructure?.entry?.find(e => e.resource.resourceType === 'Patient')?.resource?.name?.[0]?.text || extractedEntities.patient_info?.name || 'Unknown Patient';
        
        // Try mapping the entities
        const diagnosisStr = (extractedEntities.diagnoses || []).map(d => d.description).join(', ');
        const icdStr = (extractedEntities.diagnoses || []).map(d => d.icd_10_code).join(', ');
        const procedureStr = (extractedEntities.procedures || []).map(p => p.description).join(', ');
        const cptStr = (extractedEntities.procedures || []).map(p => p.cpt_code).join(', ');
        let totalCost = 0;
        
        if (extractedEntities.financial_summary?.total_billed_amount) {
           const costStr = extractedEntities.financial_summary.total_billed_amount;
           totalCost = parseFloat(String(costStr).replace(/[^0-9.-]+/g, '')) || 0;
        }

        const { error: extractError } = await supabase
          .from('extracted_data')
          .insert([
            {
              document_id: documentId,
              patient_name: patientName,
              diagnosis: diagnosisStr || null,
              icd_code: icdStr || null,
              procedure: procedureStr || null,
              cpt_code: cptStr || null,
              total_cost: totalCost
            }
          ]);
          
        if (extractError) throw new Error(`Supabase extracted_data insert error: ${extractError.message}`);

        // Insert into claims table
        const approvedAmtStr = extractedEntities.insurance_workflow?.approved_amount;
        const paidAmtStr = extractedEntities.insurance_workflow?.paid_amount;
        let claimStatusRaw = extractedEntities.insurance_workflow?.claim_status?.toLowerCase() || 'pending';
        // Enforce enum constraints ('pending', 'approved', 'rejected')
        if (!['pending', 'approved', 'rejected'].includes(claimStatusRaw)) { claimStatusRaw = 'pending'; }

        const approvedAmt = approvedAmtStr ? parseFloat(String(approvedAmtStr).replace(/[^0-9.-]+/g, '')) : null;
        const paidAmt = paidAmtStr ? parseFloat(String(paidAmtStr).replace(/[^0-9.-]+/g, '')) : null;

        const { error: claimError } = await supabase
          .from('claims')
          .insert([
            {
              document_id: documentId,
              status: claimStatusRaw,
              submitted_to: 'Default Payer',
              billed_amount: totalCost || null,
              approved_amount: approvedAmt || null,
              paid_amount: paidAmt || null
            }
          ]);
        
        if (claimError) console.error('Error inserting claim status:', claimError.message);

        // 3. Log any reconciliation issues
        if (reconciliationIssues.length > 0) {
          const logsToInsert = reconciliationIssues.map(issue => ({
             document_id: documentId,
             error_type: issue.severity || 'warning',
             message: issue.message
          }));
          await supabase.from('logs').insert(logsToInsert);
        }
        
      } catch (extractionErr) {
        // Log critical extraction error to Supabase
        console.error('Extraction/Insertion Error:', extractionErr);
        await supabase.from('logs').insert([{
           error_type: 'critical',
           message: extractionErr.message
        }]);
        throw extractionErr;
      }

    } else {
       return NextResponse.json(
        { error: 'Gemini API Key missing', isMissingKey: true },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      extractedTextPreview: extractedEntities.extracted_text_preview,
      extractedEntities,
      fhirStructure,
      reconciliationIssues,
      validationSummary
    });

  } catch (error) {
    console.error('Error parsing document:', error);
    return NextResponse.json(
      { error: 'Failed to process document.', details: error.message },
      { status: 500 }
    );
  }
}
