const path = require('path');
const jwt = require('../server/node_modules/jsonwebtoken');
require('../server/node_modules/dotenv').config({ path: path.resolve(__dirname, '../server/.env') });

const BACKEND_URL = 'http://localhost:5000';

const mongoose = require('../server/node_modules/mongoose');
const User = require('../server/models/User');

async function testGenerationStream() {
  console.log('Testing live AI stream generation...');

  await mongoose.connect(process.env.MONGODB_URI, { dbName: 'appstruct' });
  const user = await User.findOne({ email: 'autotest@appstruct.dev' });
  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '10m' });

  const res = await fetch(`${BACKEND_URL}/api/generate-stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      idea: 'A minimalist bookmark manager with tags and dark mode',
      platform: 'web',
      detailLevel: 'brief'
    })
  });

  console.log('Stream status code:', res.status);
  if (!res.ok) {
    const errText = await res.text();
    console.error('Stream error:', errText);
    process.exit(1);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let receivedChars = 0;
  let preview = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value);
    receivedChars += chunk.length;
    if (preview.length < 250) {
      preview += chunk;
    }
  }

  console.log(`Stream complete! Total characters received: ${receivedChars}`);
  console.log('Preview snippet:\n', preview.slice(0, 200) + '...');

  if (receivedChars > 100) {
    console.log('LIVE AI STREAM GENERATION TEST: PASSED');
  } else {
    console.error('LIVE AI STREAM GENERATION TEST: FAILED (output too short)');
    process.exit(1);
  }
}

testGenerationStream().catch((e) => {
  console.error('Stream test failed:', e);
  process.exit(1);
});
