require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGeminiConnection() {
  console.log('Testing Gemini API Connection...\n');
  
  // Check if API key exists
  if (!process.env.GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY not found in environment variables');
    return;
  }
  
  console.log('✅ API Key found');
  console.log('API Key (first 10 chars):', process.env.GEMINI_API_KEY.substring(0, 10) + '...\n');
  
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  
  // Test different models
  const modelsToTest = [
    'gemini-pro',
    'gemini-1.5-pro',
    'gemini-1.5-flash',
    'gemini-2.0-flash-exp'
  ];
  
  for (const modelName of modelsToTest) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`Testing model: ${modelName}`);
    console.log('='.repeat(80));
    
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const prompt = 'Say "Hello, I am working!" in JSON format: {"message": "your response"}';
      
      console.log('📤 Sending test request...');
      const startTime = Date.now();
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      
      console.log(`✅ SUCCESS (${duration}s)`);
      console.log('Response:', text);
      
    } catch (error) {
      console.log('❌ FAILED');
      console.log('Error:', error.message);
      if (error.status) {
        console.log('Status:', error.status, error.statusText);
      }
      if (error.errorDetails) {
        console.log('Details:', JSON.stringify(error.errorDetails, null, 2));
      }
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('Test complete!');
  console.log('='.repeat(80));
}

testGeminiConnection().catch(console.error);
