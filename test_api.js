const fs = require('fs');

async function testUpload() {
  const form = new FormData();
  
  const file1 = fs.readFileSync('mock_final_bill.pdf');
  form.append('documents', new File([file1], 'mock_final_bill.pdf', { type: 'application/pdf' }));
  
  const file2 = fs.readFileSync('sample_discharge_summary.pdf');
  form.append('documents', new File([file2], 'sample_discharge_summary.pdf', { type: 'application/pdf' }));

  try {
    const response = await fetch('http://localhost:3000/api/ingest', {
      method: 'POST',
      body: form
    });
    
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response JSON:', data);
  } catch (err) {
    console.error('Fetch failed:', err);
  }
}

testUpload();
