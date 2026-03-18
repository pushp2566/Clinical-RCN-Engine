const PDFDocument = require('pdfkit');
const fs = require('fs');

const HEADER_COLOR = '#1a3a5c';
const ACCENT_COLOR = '#2c6fad';

function header(doc, title, subtitle) {
  doc.rect(0, 0, doc.page.width, 80).fill(HEADER_COLOR);
  doc.fillColor('white').fontSize(20).font('Helvetica-Bold').text('JILO HEALTH SYSTEM', 50, 20);
  doc.fontSize(11).font('Helvetica').text(subtitle || 'excellence in patient care', 50, 48);
  doc.fillColor('black').moveDown(3);
  doc.fontSize(16).font('Helvetica-Bold').fillColor(ACCENT_COLOR).text(title, { align: 'center' });
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

const doc = new PDFDocument({ margin: 50, size: 'A4' });
const stream = fs.createWriteStream('xray_report.pdf');
doc.pipe(stream);

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
doc.fontSize(10).font('Helvetica').text('Fever, productive cough, and breathlessness for 5 days. Rule out pneumonia.');

sectionTitle(doc, 'Technique');
doc.fontSize(10).font('Helvetica').text('PA and lateral chest radiograph obtained using standard exposure parameters. Adequate inspiration. No motion artifact.');

sectionTitle(doc, 'Findings');
doc.fontSize(10).font('Helvetica')
   .text('Lungs: Bilateral lower lobe consolidation with air-space opacities, right > left. Patchy ground-glass opacities noted in the right middle lobe.')
   .moveDown(0.3)
   .text('Heart: Cardiothoracic ratio within normal limits (0.48). No cardiomegaly.')
   .moveDown(0.3)
   .text('Mediastinum: No mediastinal widening. Trachea is central.')
   .moveDown(0.3)
   .text('Pleural Space: No pleural effusion. No pneumothorax.')
   .moveDown(0.3)
   .text('Bones: Bony thorax intact. No rib fractures or lytic lesions.');

sectionTitle(doc, 'Impression / Conclusion');
doc.fontSize(10).font('Helvetica-Bold').fillColor('#c0392b').text('Bilateral Lower Lobe Pneumonia (ICD-10: J18.9)');
doc.font('Helvetica').fillColor('black').text('Findings consistent with community-acquired pneumonia. Recommend clinical correlation and antibiotic therapy. Repeat CXR advised after 6 weeks to confirm resolution.');

doc.moveDown(2);
field(doc, 'Radiologist', 'Dr. Suresh Patil, MD – Radiodiagnosis (Reg. No. MH-31204)');
field(doc, 'Date & Time', '2024-11-10 | 13:30');
doc.moveDown(0.5);
doc.fontSize(8).fillColor('#888888').text('This report is electronically signed. Contact radiology@jilohealth.com for queries.');

doc.end();
stream.on('finish', () => console.log('✅ xray_report.pdf created with JILO HEALTH SYSTEM!'));
