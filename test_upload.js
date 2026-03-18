const fs = require('fs');

async function testUpload() {
  try {
    const formData = new FormData();
    const fileBuffer = fs.readFileSync('sample_discharge_summary.pdf');
    const blob = new Blob([fileBuffer], { type: 'application/pdf' });
    formData.append('documents', blob, 'sample_discharge_summary.pdf');

    console.log('Sending request to API...');
    
    // We expect the server to be running on 3000
    const response = await fetch('http://localhost:3000/api/ingest', {
      method: 'POST',
      body: formData
    });

    console.log('Status Code:', response.status);
    
    if (response.ok) {
        const result = await response.json();
        console.log('Success! Extracted Entities:', Object.keys(result.extractedEntities).length);
    } else {
        const text = await response.text();
        console.error('Failed with:', text);
    }
  } catch (err) {
    console.error('Error during fetch:', err);
  }
}

testUpload();
