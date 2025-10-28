// Quick test script to verify Gemini API key
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function testGeminiAPI() {
  console.log('🧪 Testing Gemini API Key...\n');
  
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error('❌ GEMINI_API_KEY not found in .env file');
    process.exit(1);
  }
  
  console.log(`📝 API Key: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 5)}`);
  console.log('');
  
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    
    console.log('📤 Sending test prompt to Gemini...');
    const result = await model.generateContent('Say "Hello, SceneIt!" if you can read this.');
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ API Key is VALID!');
    console.log('📥 Response:', text);
    console.log('\n🎉 Gemini AI is working correctly!');
    
  } catch (error) {
    console.error('❌ API Key is INVALID or there was an error:');
    console.error(error.message);
    console.error('\n💡 To fix this:');
    console.error('1. Go to https://aistudio.google.com/app/apikey');
    console.error('2. Create a new API key');
    console.error('3. Update GEMINI_API_KEY in your .env file');
    process.exit(1);
  }
}

testGeminiAPI();
