const PDFDocument = require('pdfkit');
const fs = require('fs');

function createDoc(filename, contentFn) {
  return new Promise((resolve) => {
    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(filename);
    doc.pipe(stream);
    contentFn(doc);
    doc.end();
    stream.on('finish', resolve);
  });
}

async function run() {
  await createDoc('mock_final_bill.pdf', (doc) => {
    doc.fontSize(24).text('HOSPITAL FINAL BILL', { align: 'center' });
    doc.moveDown(2);
    doc.fontSize(12).text('Patient: Jane Doe');
    doc.text('Date: Oct 12, 2026');
    doc.moveDown();
    doc.text('Charges Summary:');
    doc.text('----------------');
    doc.text('1. Emergency Visit (CPT 99284) .......... ₹450.00');
    doc.text('2. CT Scan Head (CPT 70450) ............. ₹1,200.00');
    doc.text('3. Basic Metabolic Panel (CPT 80048) .... ₹120.00');
    doc.text('4. Pharmacy Services .................... ₹80.00');
    doc.moveDown();
    doc.fontSize(16).text('TOTAL BILLED AMOUNT: ₹1,850.00', { underline: true });
  });

  await createDoc('mock_insurance_settlement.pdf', (doc) => {
    doc.fontSize(20).text('INSURANCE SETTLEMENT EXPLANATION OF BENEFITS (EOB)', { align: 'center' });
    doc.moveDown(2);
    doc.fontSize(12).text('Insured: Jane Doe   |   Claim ID: #IN-8293-F');
    doc.text('Status: APPROVED WITH ADJUSTMENTS');
    doc.moveDown();
    doc.text('Service Summary:');
    doc.text('Total Amount Billed : ₹1,850.00');
    doc.text('Allowed/Approved Amount: ₹1,600.00 (Network adjustment)');
    doc.text('Patient Responsibility (Copay) : ₹100.00');
    doc.moveDown();
    doc.fontSize(16).text('FINAL PAID AMOUNT BY INSURANCE: ₹1,500.00', { bold: true });
  });

  console.log('Mock documents generated successfully.');
}

run();
