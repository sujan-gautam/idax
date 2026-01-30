const axios = require('axios');

async function triggerEDA() {
  try {
    const versionId = "525bf8c9-621a-4cdc-b17a-1e76b84376b6";
    console.log(`Triggering EDA for version: ${versionId}`);
    const res = await axios.post('http://127.0.0.1:8004/jobs/eda', { versionId });
    console.log('Success:', res.data);
  } catch (err) {
    console.error('Failed:', err.response ? err.response.data : err.message);
  }
}

triggerEDA();
