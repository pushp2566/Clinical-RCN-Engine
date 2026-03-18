import { GoogleGenAI } from '@google/genai';

/**
 * Extracts structured entities from raw medical text using Gemini.
 * Returns a unified JSON object representing Patient, Conditions, Procedures, and Claims.
 */
export async function extractClinicalEntities(documentParts, apiKey) {
  if (!apiKey) {
    throw new Error("Gemini API key is required for extraction.");
  }

  const ai = new GoogleGenAI({ apiKey: apiKey });

  const prompt = `
    You are an expert medical coder and data normalization engine.
    Extract the following entities from the provided clinical documents (PDFs, images, or handwritten notes) and format them STRICTLY as a JSON object.
    Do not include any markdown formatting, only the raw JSON.

    # Required JSON Structure:
    {
      "patient": {
        "name": "full name if found, else null",
        "dob": "YYYY-MM-DD if found, else null",
        "gender": "male, female, or other, else null"
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
        { "service": "billed service name", "amount": "number representing cost if found, else null", "code": "billing code if found, else null" }
      ],
      "extracted_text_preview": "A 5-10 line plain text summary showing the raw text you extracted from the documents to prove OCR worked."
    }
  `;

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
    console.error("Gemini Extraction Error:", error);
    throw new Error("Failed to extract data using AI engine.");
  }
}
