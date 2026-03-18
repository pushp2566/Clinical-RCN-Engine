import { NextResponse } from 'next/server';
import { extractClinicalEntities } from '@/lib/extractionEngine';
import { mapToFHIR } from '@/lib/fhirMapper';
import { runReconciliationRules } from '@/lib/reconciliationEngine';

export async function POST(request) {
  try {
    const data = await request.formData();
    const files = data.getAll('documents');

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files received.' },
        { status: 400 }
      );
    }

    const documentParts = [];

    // Convert all PDFs and Images into Gemini Base64 Part objects
    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      documentParts.push({
        inlineData: {
          data: buffer.toString('base64'),
          mimeType: file.type
        }
      });
    }

    // Check for API Key in environment
    const apiKey = process.env.GEMINI_API_KEY;
    
    let extractedEntities = null;
    let fhirStructure = null;
    let reconciliationIssues = [];
    
    if (apiKey) {
      // 1. Extract unstructured entities via Gemini
      extractedEntities = await extractClinicalEntities(documentParts, apiKey);
      
      // 2. Map to structured FHIR JSON
      fhirStructure = mapToFHIR(extractedEntities);

      // 3. Run reconciliation checks
      reconciliationIssues = runReconciliationRules(extractedEntities);

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
      reconciliationIssues
    });

  } catch (error) {
    console.error('Error parsing PDF:', error);
    return NextResponse.json(
      { error: 'Failed to process document.', details: error.message },
      { status: 500 }
    );
  }
}
