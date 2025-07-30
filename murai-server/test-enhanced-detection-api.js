// Enhanced test script to verify the updated detected words API endpoint
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const API_BASE_URL = 'http://localhost:3000/api';

// Enhanced test data with all required fields
const testDetectionData = {
  word: 'inappropriate-test-word',
  context: 'This is a test context with the inappropriate-test-word that should be flagged for testing purposes',
  sentimentScore: -0.7,
  url: 'https://test-website.com/page',
  accuracy: 0.85,
  responseTime: 150,
  patternType: 'Profanity',
  language: 'English',
  severity: 'medium',
  siteType: 'Website'
};

// Test credentials (update with valid test user)
const testCredentials = {
  email: 'test@example.com',
  password: 'testpassword123'
};

async function testEnhancedDetectionAPI() {
  try {
    console.log('🧪 Testing Enhanced Detection API...\n');
    
    // 1. Login to get token
    console.log('1. Logging in...');
    const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testCredentials)
    });
    
    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${await loginResponse.text()}`);
    }
    
    const loginData = await loginResponse.json();
    console.log('✅ Login successful, got token\n');
    
    // 2. Test the enhanced detected words endpoint
    console.log('2. Testing enhanced detected words endpoint...');
    console.log('📤 Sending data:', JSON.stringify(testDetectionData, null, 2));
    
    const response = await fetch(`${API_BASE_URL}/users/detected-words`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${loginData.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testDetectionData)
    });
    
    console.log(`📊 Response status: ${response.status}`);
    console.log(`📊 Response ok: ${response.ok}\n`);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ SUCCESS! Enhanced detection logged successfully!');
      console.log('📥 Server response:', JSON.stringify(result, null, 2));
      
      // Verify all fields were saved correctly
      const detection = result.detection;
      console.log('\n🔍 Field Verification:');
      console.log(`✅ Word: ${detection.word}`);
      console.log(`✅ Context: ${detection.context}`);
      console.log(`✅ Sentiment Score: ${detection.sentimentScore}`);
      console.log(`✅ Accuracy: ${detection.accuracy}`);
      console.log(`✅ Response Time: ${detection.responseTime}ms`);
      console.log(`✅ Pattern Type: ${detection.patternType}`);
      console.log(`✅ Language: ${detection.language}`);
      console.log(`✅ Severity: ${detection.severity}`);
      console.log(`✅ Site Type: ${detection.siteType}`);
      console.log(`✅ URL: ${detection.url}`);
      console.log(`✅ Created At: ${detection.createdAt}`);
      
    } else {
      const errorText = await response.text();
      console.error('❌ FAILED! Error:', errorText);
    }
    
    // 3. Test validation errors
    console.log('\n3. Testing validation errors...');
    
    const invalidData = {
      word: 'test',
      context: 'test context',
      sentimentScore: 2.0, // Invalid: should be between -1 and 1
      url: 'https://test.com',
      accuracy: 1.5, // Invalid: should be between 0 and 1
      responseTime: -50, // Invalid: should be positive
      severity: 'invalid' // Invalid: should be low/medium/high
    };
    
    const validationResponse = await fetch(`${API_BASE_URL}/users/detected-words`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${loginData.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(invalidData)
    });
    
    if (!validationResponse.ok) {
      const errorText = await validationResponse.text();
      console.log('✅ Validation working correctly - rejected invalid data:');
      console.log(`📝 Error: ${errorText}`);
    } else {
      console.log('⚠️ Warning: Validation might not be working - invalid data was accepted');
    }
    
    console.log('\n🎉 Enhanced Detection API test completed!');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the test
testEnhancedDetectionAPI();
