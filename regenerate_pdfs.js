const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

function createPDF(filename, contentFn) {
  return new Promise((resolve) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const stream = fs.createWriteStream(filename);
    doc.pipe(stream);
    contentFn(doc);
    doc.end();
    stream.on('finish', () => {
      console.log(`✅ Created: ${path.basename(filename)}`);
      resolve();
    });
  });
}

const HEADER_COLOR = '#1a3a5c';
const ACCENT_COLOR = '#2c6fad';

function header(doc, title, subtitle) {
  doc.rect(0, 0, doc.page.width, 80).fill(HEADER_COLOR);
  doc.fillColor('white').fontSize(20).font('Helvetica-Bold')
     .text('JILO HEALTH SYSTEM', 50, 20);
  doc.fontSize(11).font('Helvetica')
     .text(subtitle || 'excellence in patient care', 50, 48);
  doc.fillColor('black').moveDown(3);

  doc.fontSize(16).font('Helvetica-Bold').fillColor(ACCENT_COLOR)
     .text(title, { align: 'center' });
  doc.moveTo(50, doc.y + 4).lineTo(545, doc.y + 4).stroke(ACCENT_COLOR);
  doc.moveDown(1).fillColor('black');
}

function field(doc, label, value) {
  doc.fontSize(10).font('Helvetica-Bold').text(label + ':', { continued: true });
  doc.font('Helvetica').text('  ' + value);
}

function sectionTitle(doc, title) {
  doc.moveDown(0.8);
  doc.fontSize(12).font('Helvetica-Bold').fillColor(ACCENT_COLOR).text(title);
  doc.moveTo(50, doc.y + 2).lineTo(545, doc.y + 2).stroke(ACCENT_COLOR);
  doc.fillColor('black').moveDown(0.5);
}

async function main() {
  // 1. Discharge Summary
  await createPDF('sample_discharge_summary.pdf', (doc) => {
    header(doc, 'DISCHARGE SUMMARY', 'Inpatient Services');
    doc.moveDown(0.5);

    sectionTitle(doc, 'Patient Information');
    field(doc, 'Name', 'John Doe');
    field(doc, 'Date of Birth', '1975-08-22');
    field(doc, 'Gender', 'Male');
    field(doc, 'MRN', 'JHS-204981');
    field(doc, 'Admission Date', '2024-11-10');
    field(doc, 'Discharge Date', '2024-11-17');
    field(doc, 'Ward', 'General Medicine – Bed 14B');

    sectionTitle(doc, 'Admitting Diagnosis');
    doc.fontSize(10).font('Helvetica').text('Community-Acquired Pneumonia (CAP) with moderate severity.');

    sectionTitle(doc, 'Final Diagnoses');
    doc.fontSize(10).font('Helvetica')
       .text('1. Community-Acquired Pneumonia (ICD-10: J18.9)')
       .text('2. Type 2 Diabetes Mellitus – uncontrolled (ICD-10: E11.65)')
       .text('3. Hypertension (ICD-10: I10)');

    sectionTitle(doc, 'Procedures Performed');
    doc.fontSize(10).font('Helvetica')
       .text('• Chest X-Ray (CPT: 71046) – Bilateral infiltrates confirmed')
       .text('• IV Antibiotic Therapy – Ceftriaxone 1g IV q24h x 7 days')
       .text('• Blood Glucose Monitoring – Fasting levels ranging 180–240 mg/dL');

    sectionTitle(doc, 'Clinical Summary');
    doc.fontSize(10).font('Helvetica').text(
      'Patient presented with 5 days of productive cough, fever (39.2°C), and dyspnea. ' +
      'CXR revealed bilateral lower lobe infiltrates consistent with pneumonia. ' +
      'Blood cultures were negative. Glycaemic control was poor on admission. ' +
      'Patient improved with IV antibiotics and was transitioned to oral Amoxicillin-Clavulanate on Day 5. ' +
      'Insulin sliding scale initiated for glucose management.',
      { lineGap: 3 }
    );

    sectionTitle(doc, 'Discharge Medications');
    doc.fontSize(10).font('Helvetica')
       .text('• Amoxicillin-Clavulanate 625mg PO BD x 5 days')
       .text('• Metformin 500mg PO BD (continue)')
       .text('• Amlodipine 5mg PO OD (continue)')
       .text('• Salbutamol inhaler 100mcg PRN');

    sectionTitle(doc, 'Follow-up Instructions');
    doc.fontSize(10).font('Helvetica')
       .text('• Review with pulmonologist in 2 weeks')
       .text('• Fasting blood glucose check in 1 week')
       .text('• HbA1c test at 3-month follow-up')
       .text('• Return to Emergency if fever > 38.5°C or dyspnea worsens');

    doc.moveDown(2);
    field(doc, 'Discharging Physician', 'Dr. Ananya Rao, MD (Reg. No. MH-29482)');
    field(doc, 'Date', '2024-11-17');
  });

  // 2. Lab Report
  await createPDF('sample_lab_report.pdf', (doc) => {
    header(doc, 'LABORATORY REPORT', 'Diagnostic & Pathology Services');
    doc.moveDown(0.5);

    sectionTitle(doc, 'Patient Details');
    field(doc, 'Name', 'John Doe');
    field(doc, 'DOB', '1975-08-22');
    field(doc, 'MRN', 'JHS-204981');
    field(doc, 'Referring Physician', 'Dr. Ananya Rao');
    field(doc, 'Collection Date', '2024-11-11 07:30');
    field(doc, 'Report Date', '2024-11-11 14:00');

    sectionTitle(doc, 'Complete Blood Count (LOINC: 58410-2)');
    doc.fontSize(10).font('Helvetica')
       .text('Haemoglobin (LOINC: 718-7):          11.8 g/dL    [Ref: 13.5–17.5]  ⬇ LOW')
       .text('WBC Count (LOINC: 6690-2):            14,200 /μL   [Ref: 4,500–11,000] ⬆ HIGH')
       .text('Platelets (LOINC: 777-3):             189,000 /μL  [Ref: 150,000–400,000]  Normal')
       .text('Neutrophils %:                        82%          [Ref: 50–70%]  ⬆ HIGH');

    sectionTitle(doc, 'Blood Glucose (LOINC: 2339-0)');
    doc.fontSize(10).font('Helvetica')
       .text('Fasting Blood Glucose:                214 mg/dL    [Ref: 70–99]   ⬆⬆ HIGH')
       .text('HbA1c (LOINC: 4548-4):               9.1%         [Ref: < 5.7%]  ⬆⬆ HIGH');

    sectionTitle(doc, 'Liver Function Tests (LOINC: 24325-3)');
    doc.fontSize(10).font('Helvetica')
       .text('ALT (LOINC: 1742-6):                 38 U/L       [Ref: 7–40]    Normal')
       .text('AST (LOINC: 1920-8):                 42 U/L       [Ref: 10–40]   ⬆ Mildly elevated')
       .text('Total Bilirubin (LOINC: 1975-2):     0.9 mg/dL    [Ref: 0.2–1.2] Normal');

    sectionTitle(doc, 'Lipid Profile (LOINC: 24331-1)');
    doc.fontSize(10).font('Helvetica')
       .text('Total Cholesterol (LOINC: 2093-3):   228 mg/dL    [Ref: < 200]   ⬆ HIGH')
       .text('LDL Cholesterol (LOINC: 2089-1):     148 mg/dL    [Ref: < 100]   ⬆ HIGH')
       .text('HDL Cholesterol (LOINC: 2085-9):     38 mg/dL     [Ref: > 40]    ⬇ LOW')
       .text('Triglycerides (LOINC: 2571-8):       192 mg/dL    [Ref: < 150]   ⬆ HIGH');

    sectionTitle(doc, 'Remarks');
    doc.fontSize(10).font('Helvetica').text(
      'Leukocytosis with neutrophilia consistent with active bacterial infection. ' +
      'Hyperglycaemia and elevated HbA1c indicate poorly controlled Type 2 DM. ' +
      'Dyslipidaemia noted – advise dietary modification and statin therapy review.'
    );

    doc.moveDown(1.5);
    field(doc, 'Validated by', 'Dr. Priya Mehta, MD (Pathology) – Reg. No. MH-18842');
  });

  // 3. Hospital Bill
  await createPDF('hospital_bill.pdf', (doc) => {
    header(doc, 'ITEMIZED HOSPITAL INVOICE', 'Billing & Finance Department');
    doc.moveDown(0.5);

    sectionTitle(doc, 'Patient Information');
    field(doc, 'Name', 'John Doe');
    field(doc, 'MRN', 'JHS-204981');
    field(doc, 'Invoice No', 'INV-2024-11897');
    field(doc, 'Admission', '2024-11-10');
    field(doc, 'Discharge', '2024-11-17');
    field(doc, 'Insurance ID', 'NIC-TPA-88291');

    sectionTitle(doc, 'Billing Details');
    const items = [
      ['Room Charges (7 nights @ ₹2,500/night)', '99213', '17,500'],
      ['ICU Monitoring (Day 1–2)', '99232', '8,000'],
      ['Chest X-Ray (Bilateral)', '71046', '2,200'],
      ['IV Ceftriaxone (7 days supply)', '96374', '4,800'],
      ['Blood Culture & Sensitivity', '87040', '1,400'],
      ['Complete Blood Count', '85025', '900'],
      ['HbA1c Test', '83036', '700'],
      ['Fasting Blood Glucose', '82947', '300'],
      ['Lipid Profile Panel', '80061', '1,100'],
      ['Liver Function Tests', '80076', '850'],
      ['Physician Consultation (7 days)', '99215', '7,000'],
      ['Nursing Services', '', '3,500'],
    ];

    doc.fontSize(9).font('Helvetica-Bold')
       .text('Service Description', 50, doc.y, { width: 300, continued: true })
       .text('CPT Code', { width: 80, continued: true })
       .text('Amount (₹)', { width: 100, align: 'right' });
    doc.moveTo(50, doc.y + 3).lineTo(545, doc.y + 3).stroke('#cccccc');
    doc.moveDown(0.3);

    items.forEach(([desc, cpt, amt]) => {
      doc.fontSize(9).font('Helvetica')
         .text(desc, 50, doc.y, { width: 300, continued: true })
         .text(cpt, { width: 80, continued: true })
         .text('₹' + amt, { width: 100, align: 'right' });
    });

    doc.moveTo(50, doc.y + 5).lineTo(545, doc.y + 5).stroke(ACCENT_COLOR);
    doc.moveDown(0.5);
    doc.fontSize(11).font('Helvetica-Bold')
       .text('Total Billed Amount:', 50, doc.y, { width: 380, continued: true })
       .text('₹48,250', { width: 115, align: 'right' });

    sectionTitle(doc, 'Payment Details');
    field(doc, 'Insurance Covered (TPA Pre-auth)', '₹35,000');
    field(doc, 'Patient Liability', '₹13,250');
    field(doc, 'Payment Mode', 'UPI / Cash / Card');
    field(doc, 'Due Date', '2024-11-24');

    doc.moveDown(1.5);
    doc.fontSize(8).fillColor('#888888')
       .text('This is a computer-generated invoice. For queries, contact billing@jilohealth.com', { align: 'center' });
  });

  // 4. Prescription
  await createPDF('prescription.pdf', (doc) => {
    header(doc, 'MEDICAL PRESCRIPTION', 'Outpatient Services');
    doc.moveDown(0.5);

    field(doc, 'Date', '2024-11-17');
    field(doc, 'Patient', 'John Doe');
    field(doc, 'Age/Gender', '49 yrs / Male');
    field(doc, 'Contact', '+91-98200-XXXXX');

    sectionTitle(doc, 'Prescribing Physician');
    field(doc, 'Doctor', 'Dr. Ananya Rao, MD – General Medicine');
    field(doc, 'Reg. No.', 'MH-29482');
    field(doc, 'Clinic', 'Jilo Health System – OPD Room 4');

    sectionTitle(doc, 'Medications Prescribed (Rx)');
    doc.fontSize(10).font('Helvetica')
       .text('1. Amoxicillin-Clavulanate 625mg (Tab)')
       .text('   Sig: 1 tablet twice daily (BD) after meals × 5 days')
       .moveDown(0.3)
       .text('2. Metformin HCl 500mg (Tab)')
       .text('   Sig: 1 tablet twice daily (BD) with meals × continue')
       .moveDown(0.3)
       .text('3. Amlodipine 5mg (Tab)')
       .text('   Sig: 1 tablet once daily (OD) in the morning × continue')
       .moveDown(0.3)
       .text('4. Salbutamol 100mcg MDI Inhaler')
       .text('   Sig: 2 puffs as needed (PRN) for breathlessness')
       .moveDown(0.3)
       .text('5. Atorvastatin 20mg (Tab)')
       .text('   Sig: 1 tablet once daily at bedtime × continue');

    sectionTitle(doc, 'Advice');
    doc.fontSize(10).font('Helvetica')
       .text('• Low-carbohydrate, low-fat diet. Avoid processed sugar.')
       .text('• Monitor blood pressure daily.')
       .text('• Avoid strenuous activity for next 2 weeks.')
       .text('• Follow up in 2 weeks or earlier if fever returns.');

    doc.moveDown(3);
    doc.fontSize(10).font('Helvetica-Bold').text("Doctor's Signature: _________________     Stamp");
  });

  // 5. Patient Admission Form
  await createPDF('patient_admission_form.pdf', (doc) => {
    header(doc, 'PATIENT ADMISSION FORM', 'Inpatient Admissions');
    doc.moveDown(0.5);

    sectionTitle(doc, 'Personal Information');
    field(doc, 'Full Name', 'John Doe');
    field(doc, 'Date of Birth', '22/08/1975');
    field(doc, 'Age', '49');
    field(doc, 'Gender', 'Male');
    field(doc, 'Blood Group', 'B+');
    field(doc, 'National ID', 'XXXX-XXXX-8291');
    field(doc, 'Address', '12, Shivaji Nagar, Pune – 411005, Maharashtra');
    field(doc, 'Contact', '+91-98200-XXXXX');
    field(doc, 'Emergency Contact', 'Jane Doe (Wife) – +91-98201-XXXXX');

    sectionTitle(doc, 'Admission Details');
    field(doc, 'Admission Date & Time', '2024-11-10 | 09:45 AM');
    field(doc, 'Admitting Department', 'General Medicine');
    field(doc, 'Ward / Bed', 'General Ward – Bed 14B');
    field(doc, 'MRN Assigned', 'JHS-204981');
    field(doc, 'Admitting Physician', 'Dr. Ananya Rao, MD');
    field(doc, 'Reason for Admission', 'Fever with productive cough, breathlessness for 5 days');

    sectionTitle(doc, 'Insurance & Payment');
    field(doc, 'Insurance Provider', 'National Insurance Corporation (NIC)');
    field(doc, 'Policy Number', 'NIC-TPA-88291');
    field(doc, 'TPA', 'MediAssist Healthcare Services');
    field(doc, 'Pre-Authorization No', 'PA-2024-49821');
    field(doc, 'Approved Amount', '₹35,000');

    sectionTitle(doc, 'Medical History');
    doc.fontSize(10).font('Helvetica')
       .text('Known Conditions: Type 2 Diabetes Mellitus (diagnosed 2015), Hypertension (diagnosed 2018)')
       .text('Current Medications: Metformin 500mg, Amlodipine 5mg')
       .text('Known Allergies: Sulfonamides')
       .text('Previous Hospitalizations: Appendectomy (2010 – Jilo Health System)');

    doc.moveDown(2);
    field(doc, 'Patient Signature', '______________________');
    field(doc, 'Date', '2024-11-10');
    field(doc, 'Admissions Officer', 'Rekha Sharma (Staff ID: JHS-1042)');
  });

  // 6. X-Ray Report
  await createPDF('xray_report.pdf', (doc) => {
    header(doc, 'RADIOLOGY REPORT – CHEST X-RAY', 'Radiology & Imaging');
    doc.moveDown(0.5);

    sectionTitle(doc, 'Patient Details');
    field(doc, 'Name', 'John Doe');
    field(doc, 'MRN', 'JHS-204981');
    field(doc, 'Age/Gender', '49 yrs / Male');
    field(doc, 'Referring Physician', 'Dr. Ananya Rao');
    field(doc, 'Study Date', '2024-11-10');
    field(doc, 'Report Date', '2024-11-10 13:30');
    field(doc, 'Study Type', 'Chest X-Ray – PA View (CPT: 71046)');
    field(doc, 'Accession No', 'RAD-2024-88710');

    sectionTitle(doc, 'Clinical Indication');
    doc.fontSize(10).font('Helvetica')
       .text('Fever, productive cough, and breathlessness for 5 days. Rule out pneumonia.');

    sectionTitle(doc, 'Technique');
    doc.fontSize(10).font('Helvetica')
       .text('PA and lateral chest radiograph obtained using standard exposure parameters. ' +
             'Adequate inspiration. No motion artifact.');

    sectionTitle(doc, 'Findings');
    doc.fontSize(10).font('Helvetica')
       .text('Lungs: Bilateral lower lobe consolidation with air-space opacities, right > left. ' +
             'Patchy ground-glass opacities noted in the right middle lobe.')
       .moveDown(0.3)
       .text('Heart: Cardiothoracic ratio within normal limits (0.48). No cardiomegaly.')
       .moveDown(0.3)
       .text('Mediastinum: No mediastinal widening. Trachea is central.')
       .moveDown(0.3)
       .text('Pleural Space: No pleural effusion. No pneumothorax.')
       .moveDown(0.3)
       .text('Bones: Bony thorax intact. No rib fractures or lytic lesions.')
       .moveDown(0.3)
       .text('Soft Tissues: Unremarkable.');

    sectionTitle(doc, 'Impression / Conclusion');
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#c0392b')
       .text('Bilateral Lower Lobe Pneumonia (ICD-10: J18.9)');
    doc.font('Helvetica').fillColor('black')
       .text('Findings consistent with community-acquired pneumonia. ' +
             'Recommend clinical correlation and antibiotic therapy. ' +
             'Repeat CXR advised after 6 weeks to confirm resolution.');

    doc.moveDown(2);
    field(doc, 'Radiologist', 'Dr. Suresh Patil, MD – Radiodiagnosis (Reg. No. MH-31204)');
    field(doc, 'Date & Time', '2024-11-10 | 13:30');
    doc.moveDown(0.5);
    doc.fontSize(8).fillColor('#888888')
       .text('This report is electronically signed. Contact radiology@jilohealth.com for queries.');
  });

  console.log('\n🎉 All 6 PDFs regenerated with JILO HEALTH SYSTEM branding!');
}

main().catch(console.error);
