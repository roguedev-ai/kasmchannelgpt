/**
 * Test script to verify API keys are properly configured
 */

const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

async function testApiKeys() {
  console.log('\n🔍 Testing API Key Configuration...\n');
  
  // Check environment variables
  console.log('1. Environment Variables:');
  console.log(`   CUSTOMGPT_API_KEY: ${process.env.CUSTOMGPT_API_KEY ? '✅ Set' : '❌ Missing'}`);
  console.log(`   OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? '✅ Set' : '❌ Missing (optional)'}`);
  
  if (!process.env.CUSTOMGPT_API_KEY) {
    console.log('\n❌ CUSTOMGPT_API_KEY is not set in .env.local');
    console.log('   Please add: CUSTOMGPT_API_KEY=your_api_key_here');
    process.exit(1);
  }
  
  // Test CustomGPT API
  console.log('\n2. Testing CustomGPT API:');
  try {
    const response = await fetch('https://app.customgpt.ai/api/v1/projects?limit=1', {
      headers: {
        'Authorization': `Bearer ${process.env.CUSTOMGPT_API_KEY}`
      }
    });
    
    if (response.ok) {
      console.log('   ✅ CustomGPT API key is valid');
      const data = await response.json();
      console.log(`   ✅ Found ${data.data?.length || 0} projects`);
    } else {
      console.log(`   ❌ CustomGPT API returned error: ${response.status}`);
      const text = await response.text();
      console.log(`   Response: ${text}`);
    }
  } catch (error) {
    console.log(`   ❌ Failed to connect to CustomGPT API: ${error.message}`);
  }
  
  // Test OpenAI API (if configured)
  if (process.env.OPENAI_API_KEY) {
    console.log('\n3. Testing OpenAI API:');
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        }
      });
      
      if (response.ok) {
        console.log('   ✅ OpenAI API key is valid');
      } else {
        console.log(`   ❌ OpenAI API returned error: ${response.status}`);
      }
    } catch (error) {
      console.log(`   ❌ Failed to connect to OpenAI API: ${error.message}`);
    }
  }
  
  console.log('\n✨ Done!\n');
}

// Run the test
testApiKeys().catch(console.error);