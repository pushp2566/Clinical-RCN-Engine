const fs = require('fs');
const pdfParse = require('pdf-parse');

async function testParse() {
  try {
    const dataBuffer = fs.readFileSync('sample_discharge_summary.pdf');
    console.log("Buffer created:", dataBuffer instanceof Buffer, dataBuffer.length);
    const data = await pdfParse(dataBuffer);
    console.log("PDF parsed successfully. Characters extracted:", data.text.length);
  } catch (error) {
    console.error("PDF Parse Error:", error);
  }
}

testParse();
