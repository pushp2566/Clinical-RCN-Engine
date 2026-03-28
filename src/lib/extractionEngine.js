import { GoogleGenAI } from '@google/genai';

/**
 * Extracts structured entities from raw medical text using Gemini.
 * Returns a unified JSON object representing Patient, Conditions, Procedures, and Claims.
 */
export async function extractClinicalEntities(documentParts, apiKey, phase = 'none', contextHistory = null) {
  if (!apiKey) {
    throw new Error("Gemini API key is required for extraction.");
  }

  const ai = new GoogleGenAI({ apiKey: apiKey });

  let contextInjection = '';
  if (contextHistory) {
      contextInjection = `
      # Previous Context (Memory):
      You must remember the following context from previous steps in this patient's journey when generating feedback:
      ${JSON.stringify(contextHistory, null, 2)}
      `;
  }

  const prompt = `
    You are an expert medical coder, data normalization engine, and patient advocate.
    Extract the following entities from the provided clinical documents (PDFs, images, or handwritten notes) and format them STRICTLY as a JSON object.
    Do not include any markdown formatting, only the raw JSON.

    # Current Phase: ${phase}
    ${contextInjection}

    # Required JSON Structure:
    {
      "patient": {
        "patient_name": "full name if found, else null",
        "dob": "YYYY-MM-DD if found, else null",
        "gender": "male, female, or other, else null",
        "contact_number": "phone number if found, else null",
        "id_number": "Aadhar/PAN/Social Security if found, else null",
        "insurance_id": "insurance policy number if found, else null",
        "admission_date": "YYYY-MM-DD if found, else null",
        "chief_complaint": "brief medical diagnosis or chief complaint, else null",
        "estimated_cost": "estimated total cost if found on provisional documents, else 0"
      },
      "vitals": {
        "heart_rate": "number, else null",
        "blood_pressure": "string like '120/80', else null",
        "temperature": "number or string (e.g. 98.6 F), else null",
        "oxygen_saturation": "number (e.g. 98), else null",
        "respiratory_rate": "number, else null"
      },
      "conditions": [
        { "condition": "name of diagnosis", "icd10_guess": "best guess ICD-10 code based on name, else null" }
      ],
      "procedures": [
        { "procedure": "name of procedure performed", "cpt_guess": "best guess CPT code, else null" }
      ],
      "lab_results": [
        { "test_name": "name of lab test", "value": "test result value", "loinc_guess": "best guess LOINC code, else null" }
      ],
      "claims": [
        { "service": "billed service name", "amount": "number representing itemized cost if found, else null", "code": "billing code if found, else null" }
      ],
      "financial_summary": {
        "total_billed_amount": "total sum of all billed charges found in financial documents, else 0",
        "approved_amount": "amount approved/allowed by insurance from pre-auth or settlement, else 0",
        "paid_amount": "final amount paid by insurance, else 0"
      },
      "insurance_workflow": {
        "claim_status": "e.g., 'approved', 'rejected', 'pending', else 'pending'"
      },
      "layman_feedback": "CRITICAL: Explain what you found in these documents and what it means for the patient's insurance claim process. Use extremely simple layman terms (12th Pass / B.Com level), avoiding dense clinical jargon unless you explain it. Relate it to the Current Phase (${phase}) and any Previous Context. Limit to 3 sentences.",
      "missing_fields": ["array of required field keys (e.g., 'contact_number', 'id_number', 'patient_name', 'dob', 'gender', 'admission_date', 'chief_complaint') that are completely missing from the documents but are crucial for a Pre-Auth application. Empty array if all good."],
      "extracted_text_preview": "A 5-10 line plain text summary showing the raw text you extracted."
    }
  `;

  let retries = 3;
  let delay = 2000;

  while (retries > 0) {
    try {
      const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [prompt, ...documentParts],
          config: {
              temperature: 0.1, // Low temperature for factual extraction
          }
      });

      const outputText = response.text;
      
      // Clean up potential markdown code blocks that Gemini sometimes returns
      let cleanedJson = outputText.trim();
      if (cleanedJson.startsWith('```json')) {
        cleanedJson = cleanedJson.replace(/^```json/, '').replace(/```$/, '').trim();
      } else if (cleanedJson.startsWith('```')) {
        cleanedJson = cleanedJson.replace(/^```/, '').replace(/```$/, '').trim();
      }

      return JSON.parse(cleanedJson);

    } catch (error) {
      if (error?.status === 429) {
        retries--;
        if (retries === 0) {
          console.error("Gemini Extraction Error: Rate Limit completely exhausted.", error);
          throw new Error("API Rate limit exhausted. Gemini free tier allows 15 requests/min. Please wait a moment and click Retry.");
        }
        console.warn(`Gemini 429 Rate limit hit. Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      } else {
        console.error("Gemini Extraction Error:", error);
        throw new Error("Failed to extract data using AI engine.");
      }
    }
  }
}
