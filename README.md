# 🏥 AI-Powered Clinical & Administrative Data Normalization Engine

> **Hackathon Submission · Problem Statement PS-2**
> Revenue Reconciliation Management (RCM) · Built with **Next.js 15 + Gemini 2.5 Flash**

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![Gemini](https://img.shields.io/badge/Gemini-2.5%20Flash-blue?logo=google)](https://ai.google.dev/)
[![FHIR](https://img.shields.io/badge/FHIR-R4-orange)](https://hl7.org/fhir/R4/)
[![License](https://img.shields.io/badge/License-Hackathon-green)](./LICENSE)

---

## 📌 Problem Statement

Revenue Reconciliation Management (RCM) in hospitals is plagued by:

- Clinical diagnoses that don't map to correct billing codes
- Procedures that are documented but never billed (revenue leakage)
- Lab tests performed without corresponding CPT claim codes
- No intelligent normalization layer between hospital raw data and payer requirements

This leads to **millions in uncaptured revenue** and delayed claim approvals.

---

## 💡 Solution Overview

An end-to-end AI pipeline that ingests **any clinical document** — PDFs, scanned images, handwritten notes — and transforms them into structured, payer-ready data:

```
📄 Raw Documents
      ↓
🤖 Gemini 2.5 Flash (Multimodal OCR + NLP)
      ↓
🗂️  FHIR R4 Bundle (Patient · Encounter · Condition · Procedure · Observation · Claim)
      ↓
⚖️  Revenue Reconciliation Engine (LOINC→CPT mapping, dollar estimates, action items)
      ↓
📊  Dashboard (Clinical Timeline · Lab Grid · RCM Alerts · Export)
```

---

## ✨ Key Features

| Feature | Description |
|---|---|
| **Multi-Document Ingestion** | Upload multiple PDFs, scanned images, and handwritten notes simultaneously via drag-and-drop |
| **Multimodal AI Extraction** | Gemini 2.5 Flash reads PDFs and images via base64, performs OCR and clinical NLP in one call |
| **ICD-10 Auto-Coding** | All diagnoses extracted and assigned best-match ICD-10 codes |
| **CPT Auto-Coding** | Procedures mapped to CPT billing codes |
| **LOINC Auto-Coding** | Lab tests structured as FHIR Observations with LOINC codes |
| **Encounter Resource** | FHIR R4 Encounter links all clinical resources — critical for RCM context |
| **FHIR R4 Bundle** | Fully valid output: Encounter · Patient · Condition · Procedure · Observation · Claim |
| **Revenue Reconciliation** | Rule engine maps LOINC→CPT, flags missing codes with dollar estimates and action steps |
| **Patient Header** | Extracted patient demographics + total billed amount shown prominently |
| **Clinical Timeline** | Ordered diagnosis timeline with ICD-10 codes and clinical status |
| **Lab Results Grid** | Visual cards showing each lab test value, unit, and LOINC code |
| **Export** | Download FHIR JSON bundle or full Reconciliation Report as `.txt` |
| **Animated Step UI** | Real-time step progress: Reading → AI Extraction → FHIR Mapping → Done |

---

## 🏗️ Architecture

```
src/
├── app/
│   ├── page.js                    # Landing page (hero, pipeline, stakeholders, CTA)
│   ├── layout.js                  # Root layout + top navigation bar
│   ├── globals.css                # Design system (glassmorphism, animations, tokens)
│   ├── dashboard/
│   │   └── page.js                # Main dashboard (upload + results + all UI panels)
│   └── api/
│       └── ingest/
│           └── route.js           # POST endpoint → AI pipeline → JSON response
└── lib/
    ├── extractionEngine.js        # Gemini 2.5 Flash multimodal extraction
    ├── fhirMapper.js              # Extracted JSON → FHIR R4 Bundle
    └── reconciliationEngine.js    # Rule-based revenue discrepancy detection
components/
└── FileUploadZone.jsx             # Drag-and-drop, multi-file, step progress, retry
```

---

## 🔬 AI Extraction Layer

The `extractionEngine.js` sends all uploaded files as **base64 inline data** to Gemini 2.5 Flash in a single multimodal request. The prompt instructs the model to extract and return a strict JSON schema:

```json
{
  "patient":     { "name", "dob", "gender" },
  "conditions":  [ { "condition", "icd10_guess" } ],
  "procedures":  [ { "procedure", "cpt_guess" } ],
  "lab_results": [ { "test_name", "value", "loinc_guess" } ],
  "claims":      [ { "service", "amount", "code" } ],
  "extracted_text_preview": "..."
}
```

The engine handles both text-based PDFs and scanned/handwritten images without separate preprocessing.

---

## 🗂️ FHIR R4 Mapping Engine

`fhirMapper.js` converts the AI output into a valid **FHIR R4 Bundle**:

| FHIR Resource | Source | Notes |
|---|---|---|
| `Encounter` | Always created | Links Patient, Conditions, Procedures; `status: finished` |
| `Patient` | `patient.*` | Name, gender, birthDate |
| `Condition` | `conditions[]` | ICD-10 coding, `clinicalStatus: active`, `verificationStatus: confirmed`, Encounter reference |
| `Procedure` | `procedures[]` | CPT coding, `status: completed`, Encounter reference |
| `Observation` | `lab_results[]` | LOINC coding, `status: final`, value as string |
| `Claim` | `claims[]` | Service, billed amount, billing code |

Sample FHIR output:

```json
{
  "resourceType": "Bundle",
  "type": "collection",
  "entry": [
    { "resource": { "resourceType": "Encounter", "status": "finished", "class": { "code": "IMP" } } },
    { "resource": { "resourceType": "Patient", "name": [{ "text": "John Doe" }], "gender": "male" } },
    { "resource": { "resourceType": "Condition", "code": { "coding": [{ "system": "http://hl7.org/fhir/sid/icd-10", "code": "I21.1", "display": "STEMI" }] } } }
  ]
}
```

---

## ⚖️ Revenue Reconciliation Engine

`reconciliationEngine.js` runs 6 rule categories after extraction:

| Rule | Severity | Example |
|---|---|---|
| **LOINC → CPT unbilled** | CRITICAL | `Hemoglobin (LOINC 718-7) performed but CPT 85018 not billed. Lost: $15` |
| **Conditions with zero claims** | CRITICAL | `3 conditions documented, 0 claims filed. Add E&M code. Lost: $85` |
| **ICD-10 requires specific CPT** | HIGH | `STEMI (I21) requires ECG CPT 93010 — not found in claims` |
| **Procedure/claim count mismatch** | HIGH | `4 procedures but only 2 claims — review unbilled procedures` |
| **Surgical procedure without claim** | CRITICAL | `Appendectomy detected, no surgical claim. Lost: $350` |
| **Zero-amount claim** | MEDIUM | `Claim for 'CBC' has $0 billed amount — verify pricing` |
| **RCM Insight Summary** | INFO | `Total estimated revenue capture opportunity: $475.0` |

The engine includes a built-in **LOINC → CPT mapping table** for 18+ common lab tests, covering glucose, CBC, cholesterol, troponin, BNP, HbA1c, creatinine, liver enzymes, and more.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 15](https://nextjs.org/) with App Router |
| AI Model | [Google Gemini 2.5 Flash](https://ai.google.dev/) via `@google/genai` |
| Data Standard | [HL7 FHIR R4](https://hl7.org/fhir/R4/) |
| Styling | Tailwind CSS v4 + custom glassmorphism design system |
| Icons | [Lucide React](https://lucide.dev/) |
| Runtime | Node.js 18+ |

---

## ⚙️ Setup & Running

### Prerequisites

- Node.js 18 or later
- A Google Gemini API key — [get one free at Google AI Studio](https://aistudio.google.com/app/apikey)

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Create `.env.local` in the project root:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📋 How to Demo

1. **Open** `http://localhost:3000` — explore the landing page and pipeline overview
2. **Click** "Launch Dashboard"
3. **Upload** one or more sample PDFs from the project root:

   | File | Type |
   |---|---|
   | `sample_discharge_summary.pdf` | Discharge summary with diagnoses & procedures |
   | `sample_lab_report.pdf` | Lab results with values |
   | `hospital_bill.pdf` | Billing document with claim codes |
   | `prescription.pdf` | Medication prescription |
   | `patient_admission_form.pdf` | Admission form |
   | `xray_report.pdf` | Radiology report |

4. **Watch** the animated pipeline: Reading → AI Extraction → FHIR Mapping → Done
5. **Review** the results:
   - Patient header (name, gender, total billed)
   - Clinical Timeline (ICD-10 coded diagnoses)
   - Lab Results Grid (value + unit cards)
   - Revenue Reconciliation alerts with action steps
   - FHIR Resource Explorer (expand to view full bundle)
6. **Export** the FHIR JSON bundle or Reconciliation Report

---

## 📦 Expected Deliverables (PS-2 Checklist)

| Deliverable | Status | File |
|---|---|---|
| Data Ingestion Module | ✅ Complete | `api/ingest/route.js` + `FileUploadZone.jsx` |
| AI Extraction Layer | ✅ Complete | `lib/extractionEngine.js` |
| FHIR Mapping Engine | ✅ Complete | `lib/fhirMapper.js` |
| Revenue Reconciliation Logic | ✅ Complete | `lib/reconciliationEngine.js` |

---

## 👥 Key Stakeholders Addressed

| Stakeholder | Value Delivered |
|---|---|
| 🏥 Hospital Billing Teams | Automated ICD-10/CPT/LOINC coding eliminates manual lookup |
| 📊 RCM Managers | Real-time dollar-value discrepancy detection with action steps |
| 🤝 TPA Coordination Staff | Structured FHIR R4 Bundle ready for payer system submission |
| 📋 Claims Processing Executives | Downloadable reconciliation reports with per-issue severity |

---

## 🔒 Security Notes

- The Gemini API key is stored in `.env.local` and never exposed to the client
- All document processing happens server-side in the Next.js API route
- No patient data is stored or logged — all processing is in-memory per request

---

## 📄 License

This project was created for **hackathon demonstration purposes** under PS-2 of the competition.
